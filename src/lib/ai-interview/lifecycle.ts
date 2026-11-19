import "server-only";
import { ensureIntegrationKeys } from "@/lib/integration-keys";
import { escapeHtml, sendMail } from "@/lib/mailer";
import { getSiteSettings } from "@/lib/settings";
import { randomUUID } from "node:crypto";
import { getApplication, openResume, updateApplication, type Application } from "@/lib/applications-store";
import { isApplicationStatus, type ApplicationStatus } from "@/lib/applications-validation";
import { builtInRecords, getCareerForAdmin } from "@/lib/careers-store";
import { formatExperience } from "@/lib/careers-shared";
import { hashToken, newToken, encryptText } from "./crypto";
import { evaluateInterview, followUp, planInterview, type InterviewContext } from "./ai";
import { calendarEventId, cancelEvent, CalendarNotConnected, upsertEvent } from "./google-calendar";
import { cancelJobs, enqueue, listJobs, registerJobHandler, PermanentJobError, type Job } from "./jobs";
import { adminInterviewUrl, interviewLink, sendNotification, type NotifyJob } from "./notify";
import { deleteRecording } from "./recordings";
import { settingsForJob } from "./settings-store";
import {
  audit, createInterview, getInterview, latestForApplication, logNotification, updateInterview,
  type EvaluationResult, type InterviewAnswer, type InterviewQuestion, type InterviewRecord,
} from "./store";
import {
  ANSWER_MAX, CRITERIA_KEYS, SECTION_KEYS, classifyExperience, consistentRecommendation, endOfDayAfter, formatInZone, nextWorkingSlot, overallScore,
  reminderDueAt, safeTimeZone, type HrDecision, type InterviewMode, type Recommendation, type ReminderOffset, type SectionKey,
} from "./types";
import { isEmailOnlyKind, type NotificationKind } from "./templates";

// The AI interview workflow: from an application to an evaluated interview.
// Server-only. Every step writes to the audit trail. Long or failure-prone
// work (emails, WhatsApp, calendar, the AI plan and evaluation) runs as a
// background job (jobs.ts), so a slow provider never blocks a request.

const SYSTEM = "system";

// --- creating and scheduling ------------------------------------------------------------------

/**
 * Called after someone applies (careers/apply). Creates the interview and,
 * when automatic scheduling is on, schedules it and sends the invitation.
 * Does nothing when AI interviews are off for this job. Never throws.
 */
export async function onApplicationCreated(app: Application): Promise<void> {
  try {
    await ensureIntegrationKeys();
    const config = await settingsForJob(app.careerSlug);
    if (!config.enabled) return;
    const interview = await createFromApplication(app, SYSTEM, 1);
    if (!config.autoSchedule) return;
    if (config.startRightAway) {
      // The interview starts a couple of minutes after applying, any time of
      // day, and the invitation goes out at that moment: the link in it opens
      // the interview at once, never "too early". Questions are prepared
      // straight away (and on start, if still missing).
      const startsAt = new Date(Date.now() + Math.max(0, config.inviteDelayMinutes) * 60_000);
      startsAt.setSeconds(0, 0);
      if (startsAt.getTime() < Date.now()) startsAt.setTime(startsAt.getTime() + 60_000);
      // Open for `linkOpenDays` days, until 11:59 pm India time on the last one (as on GrowthValley).
      await scheduleInterview(interview.id, startsAt, SYSTEM, { inviteAt: startsAt, closesAt: endOfDayAfter(startsAt, config.linkOpenDays) });
      return;
    }
    await scheduleInterview(interview.id, nextWorkingSlot(new Date(), {
      delayHours: config.scheduleDelayHours,
      startHour: config.workdayStartHour,
      endHour: config.workdayEndHour,
      skipSundays: config.skipSundays,
      durationMinutes: config.durationMinutes,
    }), SYSTEM);
  } catch (e) {
    console.error("[ai-interview] could not start the interview workflow:", e instanceof Error ? e.message : e);
  }
}

async function createFromApplication(app: Application, by: string, attempt: number, mode?: InterviewMode): Promise<InterviewRecord> {
  const config = await settingsForJob(app.careerSlug);
  const interview = await createInterview({
    applicationId: app.id,
    careerSlug: app.careerSlug,
    attempt,
    mode,
    position: app.position,
    experienceType: classifyExperience(app.experience, config.fresherBelowYears),
    config,
    createdBy: by,
    candidate: {
      name: app.name,
      email: app.email,
      phone: app.phone,
      location: app.location,
      experience: app.experience,
      currentCompany: app.currentCompany ?? "",
      skills: app.skills ?? "",
      education: app.education ?? "",
      whatsappOptIn: app.whatsappOptIn === true,
      timeZone: safeTimeZone(app.timeZone),
    },
  });
  await audit({ interviewId: interview.id, applicationId: app.id, candidateName: app.name, action: "created", by, detail: `${interview.experienceType} interview, attempt ${attempt}` });
  return interview;
}

/** HR creates an interview for an application that has none (or asks for another one). */
export async function createForApplication(applicationId: string, by: string, startsAt: Date | null, mode?: InterviewMode): Promise<InterviewRecord> {
  const app = await getApplication(applicationId);
  if (!app) throw new Error("That application no longer exists.");
  const prev = await latestForApplication(applicationId);
  if (prev && ["scheduled", "in_progress", "interrupted", "accommodation", "unscheduled"].includes(prev.status)) {
    throw new Error("This applicant already has an open AI interview. Reschedule or cancel it instead.");
  }
  const interview = await createFromApplication(app, by, (prev?.attempt ?? 0) + 1, mode);
  if (startsAt) return (await scheduleInterview(interview.id, startsAt, by)) ?? interview;
  return interview;
}

/**
 * Sets (or changes) the interview time. Issues a new link (the old one stops
 * working), releases the device lock, replaces the reminders, updates the
 * calendar and notifies the candidate. An interrupted interview continues
 * where it stopped.
 */
export async function scheduleInterview(
  id: string,
  startsAt: Date,
  by: string,
  /** inviteAt: send the invitation at this time instead of now (reminders due by then are skipped); closesAt: when the link closes, instead of joinWindowHours after the start */
  opts: { inviteAt?: Date; closesAt?: Date } = {}
): Promise<InterviewRecord | null> {
  const current = await getInterview(id);
  if (!current) throw new Error("That interview no longer exists.");
  if (["completed", "cancelled"].includes(current.status)) throw new Error("A completed or cancelled interview can't be scheduled. Request another assessment instead.");
  // An open accommodation request must be answered first, or a new time would send a video interview and drop the request.
  if (current.status === "accommodation") throw new Error("The candidate asked for another way to interview. Answer the request first (allow a written interview, or keep video), then pick a time.");
  // A new time issues a new link, which would cut off a candidate mid-interview.
  if (current.status === "in_progress") throw new Error("The candidate is taking this interview right now. Reschedule it after it ends or is interrupted.");
  const reschedule = current.schedule !== null;
  const version = (current.schedule?.version ?? 0) + 1;
  const closesAt = opts.closesAt && opts.closesAt > startsAt ? opts.closesAt : new Date(startsAt.getTime() + current.config.joinWindowHours * 3600_000);
  const token = newToken();
  const resumes = current.answers.length > 0;
  const status = resumes ? "interrupted" : "scheduled";
  const updated = await updateInterview(id, {
    $set: {
      schedule: { startsAt, closesAt, version },
      tokenHash: hashToken(token),
      tokenEnc: encryptText(token, "link"),
      device: null,
      status,
    },
    // The interview continues: its recording is no longer up for deletion.
    $unset: { "recording.deleteAfter": "" },
  }, { status: { $nin: ["in_progress", "completed", "cancelled", "accommodation"] } });
  if (!updated) {
    const now = await getInterview(id);
    if (now?.status === "in_progress") throw new Error("The candidate is taking this interview right now. Reschedule it after it ends or is interrupted.");
    return null;
  }
  await cancelJobs(id, ["reminder:", "close:", "plan:"]);

  const kind: NotificationKind = reschedule ? "rescheduled" : "invite";
  await queueNotification(updated, kind, {}, "", opts.inviteAt);
  const now = Date.now();
  const inviteAt = opts.inviteAt?.getTime();
  for (const offset of updated.config.reminders) {
    const due = reminderDueAt(startsAt, offset);
    // Skip reminders whose time has passed (except "at the start", which is sent when due).
    if (due.getTime() < now - 60_000) continue;
    // A delayed invitation already says "starts now": no reminder at (or before) the same moment.
    if (inviteAt !== undefined && due.getTime() <= inviteAt + 60_000) continue;
    for (const channel of channelsFor(updated)) {
      await enqueue(`reminder:${id}:v${version}:${offset}:${channel}`, "notify", id, due, { kind: "reminder", channel, offset, version, logId: randomUUID() });
    }
  }
  // A right-away link starts when the invitation goes out, so every reminder
  // "before the start" is already past. Remind a candidate who hasn't taken it
  // yet before the link closes instead (only offsets of an hour or more: a
  // shorter one leaves no time for the interview itself).
  if (inviteAt !== undefined) {
    for (const offset of updated.config.reminders) {
      if (offset < 60) continue;
      const due = new Date(closesAt.getTime() - offset * 60_000);
      if (due.getTime() <= inviteAt + 60_000 || due.getTime() < now - 60_000) continue;
      for (const channel of channelsFor(updated)) {
        await enqueue(`reminder:${id}:v${version}:close${offset}:${channel}`, "notify", id, due, { kind: "reminder", channel, offset, closing: true, version, logId: randomUUID() });
      }
    }
  }
  if (updated.config.channels.calendar) await enqueue(`calendar:${id}:v${version}`, "calendar", id, new Date(), { action: "upsert", version });
  await enqueue(`close:${id}:v${version}`, "close_window", id, closesAt, { version });
  // Prepare the questions in advance, so the interview starts at once.
  if (!updated.questions.length) await enqueue(`plan:${id}:v${version}`, "plan", id, new Date(Math.max(now, startsAt.getTime() - 6 * 3600_000)), {}, 3);
  await audit({
    interviewId: id, applicationId: updated.applicationId, candidateName: updated.candidate.name,
    // Read by HR in the audit trail: India time, not raw UTC timestamps.
    action: reschedule ? "rescheduled" : "scheduled", by, detail: `${formatInZone(startsAt, "Asia/Kolkata")} (link open until ${formatInZone(closesAt, "Asia/Kolkata")})`,
  });
  return updated;
}

const channelsFor = (i: InterviewRecord): ("email" | "whatsapp")[] => [
  ...(i.config.channels.email ? (["email"] as const) : []),
  ...(i.config.channels.whatsapp && i.candidate.whatsappOptIn ? (["whatsapp"] as const) : []),
];

export async function queueNotification(i: InterviewRecord, kind: NotificationKind, extra: { reason?: string; offset?: ReminderOffset }, keySuffix = "", at?: Date) {
  const version = i.schedule?.version ?? 0;
  const channels = kind === "hr_evaluation" ? (["email"] as const) : isEmailOnlyKind(kind) ? channelsFor(i).filter((c) => c === "email") : channelsFor(i);
  for (const channel of channels) {
    const key = `notify:${i.id}:${kind}:v${version}:${channel}${keySuffix}`;
    await enqueue(key, "notify", i.id, at ?? new Date(), { kind, channel, ...extra, version, logId: randomUUID() });
  }
}

export async function cancelInterview(id: string, by: string, reason: string): Promise<InterviewRecord | null> {
  const before = await getInterview(id);
  if (!before) return null;
  const updated = await updateInterview(
    id,
    { $set: { status: "cancelled", device: null } },
    { status: { $in: ["unscheduled", "scheduled", "accommodation", "interrupted", "missed", "expired"] } }
  );
  if (!updated) throw new Error("Only an interview that hasn't started (or was interrupted) can be cancelled.");
  // Every pending job except a recording purge already set (expired or missed earlier).
  await cancelJobs(id, ["notify:", "reminder:", "calendar:", "close:", "plan:", "evaluate:"]);
  await scheduleRecordingPurge(updated);
  if (before.schedule) {
    await queueNotification(updated, "cancelled", { reason: reason.trim().slice(0, 300) });
    if (before.calendar.eventId) await enqueue(`calendar:${id}:cancel`, "calendar", id, new Date(), { action: "cancel" });
  }
  await audit({ interviewId: id, applicationId: updated.applicationId, candidateName: updated.candidate.name, action: "cancelled", by, detail: reason.slice(0, 500) });
  return updated;
}

/** HR "Send reminder now". */
export async function sendReminderNow(id: string, by: string) {
  const i = await getInterview(id);
  if (!i || !i.schedule || !["scheduled", "interrupted", "accommodation"].includes(i.status)) throw new Error("Reminders go only to scheduled interviews.");
  await queueNotification(i, "reminder", {}, `:manual:${Date.now()}`);
  await audit({ interviewId: id, applicationId: i.applicationId, candidateName: i.candidate.name, action: "reminder_sent", by });
}

/** HR lets the candidate continue on another device (after a lost cookie, a new laptop…). */
export async function releaseDevice(id: string, by: string) {
  const i = await updateInterview(id, { $set: { device: null } });
  if (i) await audit({ interviewId: id, applicationId: i.applicationId, candidateName: i.candidate.name, action: "device_released", by });
}

/** Accommodation: the candidate answers in writing, without camera or microphone. */
export async function setMode(id: string, mode: InterviewMode, by: string, note = "") {
  const i = await getInterview(id);
  if (!i) throw new Error("That interview no longer exists.");
  const set: Record<string, unknown> = { mode };
  if (i.status === "accommodation") {
    // The link already closed while HR was deciding: it shows as missed/unfinished, waiting for a new time.
    const closed = !i.schedule || i.schedule.closesAt.getTime() <= Date.now();
    set.status = closed ? (i.answers.length ? "expired" : "missed") : i.answers.length ? "interrupted" : "scheduled";
    set["accommodation.resolvedAt"] = new Date();
    set["accommodation.resolution"] = mode === "text" ? `Written interview allowed. ${note}`.trim() : note || "Video interview kept.";
  }
  const updated = await updateInterview(id, { $set: set });
  await audit({ interviewId: id, applicationId: i.applicationId, candidateName: i.candidate.name, action: mode === "text" ? "text_mode_allowed" : "video_mode_set", by, detail: note });
  return updated;
}

// --- context for the AI -------------------------------------------------------------------------------

async function readResume(applicationId: string): Promise<Buffer | null> {
  try {
    const r = await openResume(applicationId);
    if (!r) return null;
    const parts: Uint8Array[] = [];
    const reader = r.stream.getReader();
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      parts.push(value);
    }
    return Buffer.concat(parts);
  } catch {
    return null;
  }
}

export async function contextFor(i: InterviewRecord): Promise<InterviewContext> {
  const [career, app, resumePdf] = await Promise.all([
    i.careerSlug ? getCareerForAdmin(i.careerSlug).then((c) => c ?? builtInRecords.find((b) => b.slug === i.careerSlug) ?? null) : null,
    getApplication(i.applicationId),
    readResume(i.applicationId),
  ]);
  return {
    position: i.position,
    experienceType: i.experienceType,
    job: career
      ? {
          summary: career.summary,
          responsibilities: career.responsibilities,
          requirements: career.requirements,
          qualifications: career.qualifications ?? [],
          experienceText: formatExperience(career.experienceMin, career.experienceMax),
        }
      : null,
    candidate: {
      experience: i.candidate.experience,
      currentCompany: i.candidate.currentCompany,
      skills: i.candidate.skills,
      education: i.candidate.education,
      coverLetter: app?.coverLetter ?? "",
    },
    resumePdf,
    config: i.config,
  };
}

/** Generates the questions and the test once; a second call (or a race) keeps the first plan. */
export async function ensurePlan(id: string): Promise<InterviewRecord> {
  const i = await getInterview(id);
  if (!i) throw new Error("That interview no longer exists.");
  if (i.questions.length) return i;
  const plan = await planInterview(await contextFor(i));
  const questions: InterviewQuestion[] = plan.questions.map((q) => ({ ...q, id: shortId() }));
  const mcq = plan.mcq.length ? { questions: plan.mcq.map((m) => ({ ...m, id: shortId() })) } : null;
  const updated = await updateInterview(id, { $set: { questions, mcq, planModel: plan.model } }, { "questions.0": { $exists: false } });
  if (updated) {
    await audit({ interviewId: id, applicationId: i.applicationId, candidateName: i.candidate.name, action: "questions_generated", by: SYSTEM, detail: `${questions.length} questions, ${mcq?.questions.length ?? 0} test questions (${plan.model})` });
    return updated;
  }
  return (await getInterview(id))!;
}

const shortId = () => randomUUID().replace(/-/g, "").slice(0, 10);

// --- the candidate's session ------------------------------------------------------------------------------

/** The question to answer now: the first one without an answer. */
export function currentQuestion(i: Pick<InterviewRecord, "questions" | "answers">): InterviewQuestion | null {
  const answered = new Set(i.answers.map((a) => a.questionId));
  return i.questions.find((q) => !answered.has(q.id)) ?? null;
}

/** Every question answered and the test (if any) submitted: only "finish" is left. */
export function nothingLeft(i: Pick<InterviewRecord, "questions" | "answers" | "mcq">): boolean {
  return i.questions.length > 0 && !currentQuestion(i) && (!i.mcq || Boolean(i.mcq.submittedAt));
}

/**
 * When the link really closes for this interview. The scheduled close applies
 * to starting it; an interview already under way keeps a grace period (its
 * length plus the test plus 30 minutes from the first start), so a candidate
 * who started near the end of the window isn't cut off mid-question.
 */
export function effectiveClosesAt(i: Pick<InterviewRecord, "schedule" | "startedAt" | "status" | "config">): Date | null {
  if (!i.schedule) return null;
  const running = i.status === "in_progress" || i.status === "interrupted";
  if (!running || !i.startedAt) return i.schedule.closesAt;
  const grace = i.startedAt.getTime() + (i.config.durationMinutes + i.config.mcqMinutes + 30) * 60_000;
  return new Date(Math.max(i.schedule.closesAt.getTime(), grace));
}

export type AnswerInput = { questionId: string; text: string; input: InterviewAnswer["input"]; startedAt: Date; skipped: boolean; offsetMs?: number; segment?: number };

/**
 * Saves the answer to the current question and returns the interview after it
 * (with a follow-up question added when the AI asks one). Ignores an answer to
 * any other question, so a double submit or a stale tab can't skip ahead.
 */
export async function submitAnswer(i: InterviewRecord, a: AnswerInput): Promise<InterviewRecord> {
  const q = currentQuestion(i);
  if (!q || q.id !== a.questionId) return i;
  const answer: InterviewAnswer = {
    questionId: q.id,
    text: a.text.trim().slice(0, ANSWER_MAX),
    input: a.input,
    startedAt: a.startedAt,
    endedAt: new Date(),
    ...(a.offsetMs !== undefined ? { offsetMs: a.offsetMs } : {}),
    ...(a.offsetMs !== undefined && a.segment !== undefined ? { segment: a.segment } : {}),
    ...(a.skipped ? { skipped: true } : {}),
  };
  const saved = await updateInterview(
    i.id,
    { $push: { answers: answer }, $set: { lastActivityAt: new Date() } },
    { status: "in_progress", "answers.questionId": { $ne: q.id } }
  );
  if (!saved) return (await getInterview(i.id)) ?? i;

  // A follow-up, while the budget and the time allow (never a follow-up to a follow-up).
  const overTime = saved.startedAt && Date.now() > saved.startedAt.getTime() + saved.config.durationMinutes * 60_000;
  const remaining = saved.config.maxFollowUps - saved.followUpsUsed;
  if (!q.followUpOf && !overTime && remaining > 0) {
    const text = await followUp(await contextFor(saved), q, answer, remaining);
    if (text) {
      const at = saved.questions.findIndex((x) => x.id === q.id) + 1;
      const fq: InterviewQuestion = { id: shortId(), section: q.section, text, intent: `Follow-up to: ${q.text}`, followUpOf: q.id };
      const withFollowUp = await updateInterview(saved.id, { $push: { questions: { $each: [fq], $position: at } }, $inc: { followUpsUsed: 1 } }, { status: "in_progress" });
      if (withFollowUp) return withFollowUp;
    }
  }
  return saved;
}

/** Starts the timed test. Calling it again returns the same deadline. */
export async function startTest(i: InterviewRecord): Promise<InterviewRecord> {
  if (!i.mcq || i.mcq.startedAt) return i;
  const now = new Date();
  const deadline = new Date(now.getTime() + i.config.mcqMinutes * 60_000);
  return (await updateInterview(i.id, { $set: { "mcq.startedAt": now, "mcq.deadline": deadline } }, { "mcq.startedAt": { $exists: false } })) ?? ((await getInterview(i.id)) as InterviewRecord);
}

/** Scores the test. Answers arriving more than 60 s after the deadline count as unanswered. */
export async function submitTest(i: InterviewRecord, chosen: Record<string, number | null>, auto: boolean): Promise<InterviewRecord> {
  if (!i.mcq || i.mcq.submittedAt) return i;
  const late = i.mcq.deadline ? Date.now() > i.mcq.deadline.getTime() + 60_000 : false;
  const answers: Record<string, number | null> = {};
  let correct = 0;
  for (const q of i.mcq.questions) {
    const v = late ? null : chosen[q.id];
    const ok = typeof v === "number" && Number.isInteger(v) && v >= 0 && v < q.options.length;
    answers[q.id] = ok ? v : null;
    if (ok && v === q.correctIndex) correct++;
  }
  const score = i.mcq.questions.length ? Math.round((correct / i.mcq.questions.length) * 1000) / 10 : 0;
  return (
    (await updateInterview(
      i.id,
      { $set: { "mcq.answers": answers, "mcq.score": score, "mcq.submittedAt": new Date(), "mcq.autoSubmitted": auto || late } },
      { "mcq.submittedAt": { $exists: false } }
    )) ?? ((await getInterview(i.id)) as InterviewRecord)
  );
}

/**
 * Sets the recording's deletion date (retention period from now) and queues
 * the purge, for an interview that ended any way other than completing it:
 * cancelled, expired or missed. Does nothing without a recording, when the
 * retention period is "keep", or when a date is already set. A reschedule
 * clears the date again (scheduleInterview), and the old purge job then finds
 * no date and leaves the recording alone.
 */
async function scheduleRecordingPurge(i: InterviewRecord): Promise<void> {
  if (i.config.retentionDays <= 0 || i.recording.deletedAt || i.recording.deleteAfter || i.recording.chunks <= 0) return;
  const deleteAfter = new Date(Date.now() + i.config.retentionDays * 86400_000);
  const set = await updateInterview(i.id, { $set: { "recording.deleteAfter": deleteAfter } }, { "recording.deleteAfter": { $exists: false } });
  if (set) await enqueue(`purge:${i.id}:${deleteAfter.getTime()}`, "purge_recordings", i.id, deleteAfter, {}, 5);
}

/** Ends the interview: evaluation, the candidate's thank-you, and the recording's deletion date. */
export async function completeInterview(i: InterviewRecord, by = "candidate"): Promise<InterviewRecord | null> {
  const deleteAfter = i.config.retentionDays > 0 ? new Date(Date.now() + i.config.retentionDays * 86400_000) : undefined;
  const done = await updateInterview(
    i.id,
    { $set: { status: "completed", completedAt: new Date(), "evaluation.state": "pending", ...(deleteAfter ? { "recording.deleteAfter": deleteAfter } : {}) } },
    { status: { $in: ["in_progress", "interrupted", "expired"] } }
  );
  if (!done) return null;
  await cancelJobs(i.id, ["reminder:", "close:"]);
  await enqueue(`evaluate:${i.id}:${done.evaluation.attempts}`, "evaluate", i.id, new Date(), {}, 3);
  if (by === "candidate") await queueNotification(done, "completed", {});
  if (deleteAfter) await enqueue(`purge:${i.id}:${deleteAfter.getTime()}`, "purge_recordings", i.id, deleteAfter, {}, 5);
  await audit({ interviewId: i.id, applicationId: i.applicationId, candidateName: i.candidate.name, action: "completed", by, detail: `${done.answers.length} answers` });
  return done;
}

// --- evaluation -------------------------------------------------------------------------------------------------

/** An evaluation marked running longer than this is treated as crashed (the job may claim it again). */
// Longer than one evaluation can take: the Claude client allows 9 minutes per
// try and retries 3 times (ai.ts), so a slow but healthy run (~36 min worst
// case) is never claimed a second time. A run whose process died is retried
// after this, by the job's next attempt or HR's "Evaluate again".
const EVALUATION_STALE_MS = 40 * 60_000;

export async function runEvaluation(id: string): Promise<void> {
  // Claimed atomically: two evaluate jobs (a retry and HR's "Evaluate again") never run at the same time.
  const now = new Date();
  const i = await updateInterview(
    id,
    { $set: { "evaluation.state": "running", "evaluation.runningSince": now }, $inc: { "evaluation.attempts": 1 } },
    { status: "completed", $or: [{ "evaluation.state": { $ne: "running" } }, { "evaluation.runningSince": { $lt: new Date(now.getTime() - EVALUATION_STALE_MS) } }, { "evaluation.runningSince": { $exists: false } }] }
  );
  if (!i) {
    const cur = await getInterview(id);
    if (cur?.status === "completed") throw new PermanentJobError("Another evaluation of this interview is already running.");
    throw new PermanentJobError("Only completed interviews are evaluated.");
  }
  try {
    const ctx = await contextFor(i);
    // A test that was part of the interview but never submitted (the interview
    // ended early) counts as 0, so skipping it can never raise the overall score.
    const testSkipped = Boolean(i.mcq && i.mcq.questions.length && !i.mcq.submittedAt);
    const test = i.mcq?.submittedAt && typeof i.mcq.score === "number"
      ? { score: i.mcq.score, detail: `${i.mcq.questions.length} questions${i.mcq.autoSubmitted ? ", submitted automatically when the time ran out" : ""}.` }
      : testSkipped
        ? { score: 0, detail: "Not taken: the interview ended before the test." }
        : null;
    const technicalNotes = i.flags
      .filter((f) => f.kind === "camera_lost" || f.kind === "mic_lost" || f.kind === "resumed" || f.kind === "offline")
      .map((f) => `${f.kind.replace("_", " ")} at ${f.at.toISOString()}`);
    if (!ctx.resumePdf) technicalNotes.push("The resume could not be read.");
    const raw = await evaluateInterview(ctx, { questions: i.questions, answers: i.answers, test, technicalNotes });

    // Overall and section scores are computed here, from the AI's per-criterion and per-question scores.
    const scores = Object.fromEntries(CRITERIA_KEYS.map((k) => [k, raw.criteria[k].score]));
    const overall = overallScore(scores, i.config.criteriaWeights, test ? { score: test.score, weight: i.config.mcqWeight } : null);
    const sections: Partial<Record<SectionKey, number>> = {};
    for (const s of SECTION_KEYS) {
      const qs = raw.questions.filter((r) => i.questions.find((q) => q.id === r.questionId)?.section === s);
      if (qs.length) sections[s] = Math.round((qs.reduce((t, r) => t + r.score, 0) / qs.length) * 100) / 10;
    }
    const result: EvaluationResult = {
      overall,
      criteria: raw.criteria,
      sections,
      questions: raw.questions,
      technicalAssessment: raw.technicalAssessment,
      communicationAssessment: raw.communicationAssessment,
      problemSolvingAssessment: raw.problemSolvingAssessment,
      strengths: raw.strengths,
      weaknesses: raw.weaknesses,
      skillGaps: raw.skillGaps,
      training: raw.training,
      summary: raw.summary,
      aiRecommendation: raw.recommendation,
      recommendation: consistentRecommendation(raw.recommendation, overall, i.config.passingScore),
      recommendationReason: raw.recommendationReason,
      caveats: testSkipped
        ? [...raw.caveats, i.config.mcqWeight > 0
          ? "The test was not taken (the interview ended before it): it counts as 0 in the overall score."
          : "The test was not taken (the interview ended before it). The test has no weight in the overall score."]
        : raw.caveats,
      ...(test ? { testScore: test.score } : {}),
      passingScore: i.config.passingScore,
    };
    // Evaluation history: the previous result is kept (last 5), so HR can see how a re-evaluation changed the scores.
    const previous = i.evaluation.result
      ? { $push: { "evaluation.history": { $each: [{ at: i.evaluation.at ?? new Date(), model: i.evaluation.model ?? "", overall: i.evaluation.result.overall, recommendation: i.evaluation.result.recommendation }], $slice: -5 } } }
      : {};
    const saved = await updateInterview(id, {
      $set: { "evaluation.state": "done", "evaluation.result": result, "evaluation.model": raw.model, "evaluation.at": new Date() },
      $unset: { "evaluation.error": "", "evaluation.runningSince": "" },
      ...previous,
    });
    await audit({ interviewId: id, applicationId: i.applicationId, candidateName: i.candidate.name, action: "evaluated", by: SYSTEM, detail: `${overall}/100, ${result.recommendation} (${raw.model})` });
    if (saved && i.config.notifyHrOnEvaluation) await queueNotification(saved, "hr_evaluation", {}, `:${saved.evaluation.attempts}`);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    await updateInterview(id, { $set: { "evaluation.state": "failed", "evaluation.error": message.slice(0, 500) } });
    await audit({ interviewId: id, applicationId: i.applicationId, candidateName: i.candidate.name, action: "evaluation_failed", by: SYSTEM, detail: message });
    throw e;
  }
}

/** HR "Evaluate again" (after a failure, or with what a partial interview has). */
export async function requestEvaluation(id: string, by: string) {
  const i = await getInterview(id);
  if (!i) throw new Error("That interview no longer exists.");
  if (i.status !== "completed") {
    // Never close an interview the candidate is taking right now.
    if (i.status === "in_progress") throw new Error("The candidate is taking this interview right now. Evaluate it after it ends or is interrupted.");
    if (!["interrupted", "expired"].includes(i.status)) {
      throw new Error(i.status === "cancelled" ? "A cancelled interview isn't evaluated. Request another assessment instead." : "Only an interview that was taken (fully or in part) can be evaluated.");
    }
    if (!i.answers.length) throw new Error("There are no answers to evaluate yet.");
    // A partial interview (interrupted or expired): close it as it is, then evaluate.
    const done = await completeInterview(i, by);
    if (!done) throw new Error("The interview changed meanwhile. Reload the page and try again.");
    return;
  }
  if (i.evaluation.state === "running") throw new Error("The evaluation is already running.");
  // One queued at a time (a double click, or bulk on interviews already waiting).
  const queued = (await listJobs(id)).some((j) => j.kind === "evaluate" && (j.state === "pending" || j.state === "running"));
  if (queued) throw new Error("An evaluation is already queued.");
  await updateInterview(id, { $set: { "evaluation.state": "pending" } });
  await enqueue(`evaluate:${id}:${i.evaluation.attempts}:${Date.now()}`, "evaluate", id, new Date(), {}, 3);
  await audit({ interviewId: id, applicationId: i.applicationId, candidateName: i.candidate.name, action: "evaluation_requested", by });
}

// --- HR review --------------------------------------------------------------------------------------------------

const DECISION_STATUS: Partial<Record<HrDecision, ApplicationStatus>> = { shortlist: "shortlisted", reject: "rejected", next_round: "next-round" };

/** Records HR's decision, moves the application to the matching stage, and keeps the audit trail. */
export async function applyDecision(id: string, decision: HrDecision, note: string, by: string, stage?: string): Promise<void> {
  const i = await getInterview(id);
  if (!i) throw new Error("That interview no longer exists.");
  let status: ApplicationStatus | undefined = DECISION_STATUS[decision];
  if (decision === "move_stage") {
    if (!isApplicationStatus(stage)) throw new Error("Choose the stage to move the applicant to.");
    status = stage;
  }
  const record = { kind: decision, by, at: new Date(), note: note.trim().slice(0, 3000), ...(status ? { stage: status } : {}) };
  // The steps that can fail run first, so a refused decision leaves nothing half-saved.
  if (status) {
    const ok = await updateApplication(i.applicationId, { status });
    if (!ok) throw new Error("The application no longer exists, so the decision wasn't saved.");
  }
  if (decision === "reassess") await createForApplication(i.applicationId, by, null);
  await updateInterview(id, { $push: { "hr.decisions": record } });
  await audit({ interviewId: id, applicationId: i.applicationId, candidateName: i.candidate.name, action: `decision:${decision}`, by, detail: [status && `stage ${status}`, note].filter(Boolean).join(" · ") });
}

export async function overrideRecommendation(id: string, rec: Recommendation | null, reason: string, by: string) {
  const i = await getInterview(id);
  if (!i) throw new Error("That interview no longer exists.");
  if (rec && reason.trim().length < 5) throw new Error("Give a reason for the override.");
  await updateInterview(id, rec ? { $set: { "hr.recommendationOverride": rec, "hr.overrideReason": reason.trim().slice(0, 1000) } } : { $unset: { "hr.recommendationOverride": "", "hr.overrideReason": "" } });
  await audit({ interviewId: id, applicationId: i.applicationId, candidateName: i.candidate.name, action: rec ? "recommendation_overridden" : "override_removed", by, detail: rec ? `${i.evaluation.result?.recommendation ?? "none"} → ${rec}: ${reason}` : undefined });
}

export async function addComment(id: string, text: string, by: string) {
  const i = await getInterview(id);
  if (!i) throw new Error("That interview no longer exists.");
  await updateInterview(id, { $push: { "hr.comments": { by, at: new Date(), text: text.trim().slice(0, 3000) } } });
  await audit({ interviewId: id, applicationId: i.applicationId, candidateName: i.candidate.name, action: "comment", by });
}

/** Deletes the recording now (data request, or HR's choice). The transcript and scores stay. */
export async function deleteInterviewRecording(id: string, by: string) {
  const i = await getInterview(id);
  if (!i) throw new Error("That interview no longer exists.");
  // Mark it first, so uploads stop; then delete, and sweep once more for a chunk that was mid-upload.
  await updateInterview(id, { $set: { "recording.deletedAt": new Date() } });
  let n = await deleteRecording(id);
  await new Promise((r) => setTimeout(r, 1500));
  n += await deleteRecording(id);
  await audit({ interviewId: id, applicationId: i.applicationId, candidateName: i.candidate.name, action: "recording_deleted", by, detail: `${n} chunks` });
}

// --- job handlers --------------------------------------------------------------------------------------------------

async function onNotify(job: Job) {
  const i = await getInterview(job.interviewId);
  if (!i) return;
  const p = job.payload as unknown as NotifyJob & { version?: number };
  // A reminder for an old time, or for an interview that is no longer waiting, is dropped.
  // The same for an invitation or a "new time" message: one queued before a
  // cancel or another reschedule (or retried after one) must not go out with a dead link.
  if (p.kind === "reminder" || p.kind === "invite" || p.kind === "rescheduled") {
    if (!i.schedule || (typeof p.version === "number" && p.version !== i.schedule.version)) return;
    if (!["scheduled", "interrupted", "accommodation"].includes(i.status)) return;
  }
  // The "pick a new time" email only while the interview is still missed (HR may have rescheduled or cancelled it).
  if (p.kind === "missed" && i.status !== "missed") return;
  await sendNotification(i, p);
}

async function onCalendar(job: Job) {
  const i = await getInterview(job.interviewId);
  if (!i) return;
  const action = job.payload.action as "upsert" | "cancel";
  const eventId = i.calendar.eventId ?? calendarEventId(i.id);
  const log = { id: `cal-${job._id}`, interviewId: i.id, applicationId: i.applicationId, candidateName: i.candidate.name, channel: "calendar" as const, recipient: i.candidate.email };
  try {
    if (action === "cancel") {
      await cancelEvent(eventId);
      await updateInterview(i.id, { $set: { "calendar.status": "cancelled" } });
      await logNotification({ ...log, kind: "calendar_cancel", status: "sent", providerId: eventId });
      return;
    }
    if (!i.schedule || job.payload.version !== i.schedule.version || i.status === "cancelled") return;
    const link = interviewLink(i) ?? "";
    const r = await upsertEvent({
      eventId,
      summary: `AI interview: ${i.position}, ${i.candidate.name}`,
      description: `First-round AI interview for ${i.position}.\n\nCandidate's private link (only for ${i.candidate.name}): ${link}\n\nUse Chrome or Edge with a camera and microphone. Duration about ${i.config.durationMinutes} minutes.\n\nHR: ${adminInterviewUrl(i.id)}`,
      start: i.schedule.startsAt,
      end: new Date(i.schedule.startsAt.getTime() + i.config.durationMinutes * 60_000),
      timeZone: i.candidate.timeZone,
      attendee: { email: i.candidate.email, name: i.candidate.name },
      location: "Online (link in the description)",
    });
    await updateInterview(i.id, { $set: { calendar: { status: "created", eventId: r.eventId, htmlLink: r.htmlLink, version: i.schedule.version } } });
    await logNotification({ ...log, kind: i.schedule.version > 1 ? "calendar_update" : "calendar_create", status: "sent", providerId: r.eventId });
    // Cancelled while the event was being written: take it off the calendar again.
    const after = await getInterview(i.id);
    if (after?.status === "cancelled") await enqueue(`calendar:${i.id}:cancel:late`, "calendar", i.id, new Date(), { action: "cancel" });
  } catch (e) {
    if (e instanceof CalendarNotConnected) {
      await updateInterview(i.id, { $set: { "calendar.status": "not_connected" } });
      await logNotification({ ...log, kind: action === "cancel" ? "calendar_cancel" : "calendar_create", status: "skipped", error: "Google Calendar is not connected (the email carries a calendar file)." });
      return;
    }
    const message = e instanceof Error ? e.message : String(e);
    await updateInterview(i.id, { $set: { "calendar.status": "failed", "calendar.error": message.slice(0, 300) } });
    await logNotification({ ...log, kind: action === "cancel" ? "calendar_cancel" : "calendar_create", status: "failed", error: message });
    throw e;
  }
}

async function onCloseWindow(job: Job) {
  const i = await getInterview(job.interviewId);
  if (!i || !i.schedule || i.schedule.version !== job.payload.version) return;
  // The link was kept open longer (HR "extend"): a newer close job handles it.
  if (i.schedule.closesAt.getTime() > Date.now() + 1000) return;
  // A grace-period job: the interview may have been extended or finished since.
  if (job.payload.grace && (effectiveClosesAt(i)?.getTime() ?? 0) > Date.now() + 1000) return;
  if (i.status === "scheduled") {
    const missed = await updateInterview(i.id, { $set: { status: "missed" } }, { status: "scheduled" });
    if (missed) await scheduleRecordingPurge(missed);
    await audit({ interviewId: i.id, applicationId: i.applicationId, candidateName: i.candidate.name, action: "missed", by: SYSTEM, detail: "The link closed without the interview being started." });
    // No-show follow-up: when the candidate may pick a new time themselves, tell them so (the same link opens the picker).
    if (missed && (missed.config.candidateReschedules ?? 0) > (missed.selfReschedules ?? 0) && missed.answers.length === 0) {
      await queueNotification(missed, "missed", {});
    }
  } else if (i.status === "in_progress" || i.status === "interrupted") {
    // Started near the end of the window: give the running interview its grace period.
    const grace = effectiveClosesAt(i);
    if (grace && grace.getTime() > Date.now() + 1000) {
      await enqueue(`close:${i.id}:v${i.schedule.version}:g${grace.getTime()}`, "close_window", i.id, grace, { version: i.schedule.version, grace: true });
      return;
    }
    // Everything was answered but the page closed before "Submit": complete it, so it is evaluated.
    if (nothingLeft(i)) {
      await completeInterview(i, SYSTEM);
      return;
    }
    const expired = await updateInterview(i.id, { $set: { status: "expired" } }, { status: { $in: ["in_progress", "interrupted"] } });
    if (expired) await scheduleRecordingPurge(expired);
    await audit({ interviewId: i.id, applicationId: i.applicationId, candidateName: i.candidate.name, action: "expired", by: SYSTEM, detail: `${i.answers.length} of ${i.questions.length} questions answered. Reschedule to let the candidate continue, or evaluate what was answered.` });
  } else if (i.status === "accommodation") {
    // The candidate asked for another way to interview and HR hasn't answered.
    // The request still stands (it stays under "Accommodation" for HR), but the
    // link has closed: HR must allow a written interview and reschedule, or cancel.
    await audit({ interviewId: i.id, applicationId: i.applicationId, candidateName: i.candidate.name, action: "accommodation_unanswered", by: SYSTEM, detail: "The link closed while the accommodation request was waiting. Allow a written interview and reschedule, or cancel." });
    await notifyHr(i, `Unanswered interview accommodation request: ${i.candidate.name}`, `${i.candidate.name} (${i.position}) asked for an alternative to the video interview, and the interview link has now closed without an answer.\n\nOpen the interview to allow a written interview and pick a new time, or cancel it:\n${adminInterviewUrl(i.id)}`);
  }
}

/** A plain email to HR (best effort: failures are logged, never thrown). */
async function notifyHr(i: InterviewRecord, subject: string, text: string) {
  try {
    const s = await getSiteSettings();
    const to = s.hr.email || s.email;
    if (!to) return;
    await sendMail({ to, subject, text, html: `<pre style="font-family:Arial,sans-serif;white-space:pre-wrap">${escapeHtml(text)}</pre>` });
  } catch (e) {
    console.error(`[ai-interview] HR email for ${i.id} failed:`, e instanceof Error ? e.message : e);
  }
}

async function onPlan(job: Job) {
  const i = await getInterview(job.interviewId);
  if (!i || i.questions.length || ["cancelled", "completed"].includes(i.status)) return;
  await ensurePlan(i.id);
}

async function onPurge(job: Job) {
  const i = await getInterview(job.interviewId);
  if (!i || i.recording.deletedAt) return;
  // No date (cleared by a reschedule) or a later one (a newer purge job will run): keep it.
  if (!i.recording.deleteAfter || i.recording.deleteAfter.getTime() > Date.now()) return;
  await deleteInterviewRecording(i.id, SYSTEM);
}

registerJobHandler("notify", onNotify);
registerJobHandler("calendar", onCalendar);
registerJobHandler("close_window", onCloseWindow);
registerJobHandler("evaluate", (job) => runEvaluation(job.interviewId));
registerJobHandler("purge_recordings", onPurge);
registerJobHandler("plan", onPlan);
