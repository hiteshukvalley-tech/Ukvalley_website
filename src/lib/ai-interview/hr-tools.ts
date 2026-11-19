import "server-only";
import { randomUUID } from "node:crypto";
import { escapeHtml, hasMailer, sendMail } from "@/lib/mailer";
import { getSiteSettings } from "@/lib/settings";
import { enqueue } from "./jobs";
import { applyDecision, cancelInterview, queueNotification, requestEvaluation, scheduleInterview, sendReminderNow } from "./lifecycle";
import { interviewLink } from "./notify";
import { audit, getInterview, logNotification, updateInterview, type InterviewRecord } from "./store";
import {
  BULK_MAX, EXTEND_HOURS, formatInZone, HR_MESSAGE_BODY_MAX, HR_MESSAGE_SUBJECT_MAX, OPEN_STATUSES, isWorkingSlot, nextWorkingSlot, workingSlots,
  type BulkAction, type SlotRules,
} from "./types";

// HR's quick actions on one interview, the bulk actions on many, and the
// candidate's own "pick another time". Server-only. Built on lifecycle.ts:
// every change goes through the same functions (and the same audit trail)
// as the rest of the module.

const must = async (id: string): Promise<InterviewRecord> => {
  const i = await getInterview(id);
  if (!i) throw new Error("That interview no longer exists.");
  return i;
};
const who = (i: InterviewRecord) => ({ interviewId: i.id, applicationId: i.applicationId, candidateName: i.candidate.name });
const rulesOf = (i: InterviewRecord): SlotRules => ({
  startHour: i.config.workdayStartHour,
  endHour: i.config.workdayEndHour,
  skipSundays: i.config.skipSundays,
  durationMinutes: i.config.durationMinutes,
});

/** Schedules at the next free working slot (the same rule as new applications). */
export async function autoSchedule(id: string, by: string): Promise<InterviewRecord> {
  const i = await must(id);
  // Only interviews that need a time: moving a scheduled one would kill the link the candidate already has.
  if (!["unscheduled", "missed", "expired"].includes(i.status)) {
    throw new Error(i.status === "scheduled" || i.status === "interrupted" ? "Already has a time. Use Reschedule to move it." : "Only an interview that isn't scheduled, was missed or expired can be scheduled automatically.");
  }
  const at = nextWorkingSlot(new Date(), { ...rulesOf(i), delayHours: Math.min(i.config.scheduleDelayHours, 48) });
  const updated = await scheduleInterview(id, at, by);
  if (!updated) throw new Error("The interview could not be scheduled.");
  return updated;
}

/**
 * Keeps the link open longer. A missed or expired interview opens again (the
 * candidate can start or continue with the same link), and its recording is no
 * longer up for deletion.
 */
export async function extendLinkWindow(id: string, hours: number, by: string): Promise<InterviewRecord> {
  if (!(EXTEND_HOURS as readonly number[]).includes(hours)) throw new Error("Choose how many hours to add.");
  const i = await must(id);
  if (!i.schedule) throw new Error("Schedule the interview first.");
  if (!["scheduled", "accommodation", "interrupted", "in_progress", "missed", "expired"].includes(i.status)) {
    throw new Error("Only an interview that hasn't finished can be kept open longer.");
  }
  // From the current close time, or from now when it has already passed.
  const base = Math.max(i.schedule.closesAt.getTime(), Date.now());
  const closesAt = new Date(base + hours * 3600_000);
  const reopen: Record<string, unknown> = {};
  if (i.status === "missed") reopen.status = "scheduled";
  if (i.status === "expired") reopen.status = "interrupted";
  const updated = await updateInterview(
    id,
    { $set: { "schedule.closesAt": closesAt, ...reopen }, ...(reopen.status ? { $unset: { "recording.deleteAfter": "" } } : {}) },
    { status: i.status, "schedule.version": i.schedule.version }
  );
  if (!updated) throw new Error("The interview changed meanwhile. Reload the page and try again.");
  await enqueue(`close:${id}:v${i.schedule.version}:x${closesAt.getTime()}`, "close_window", id, closesAt, { version: i.schedule.version });
  await audit({ ...who(i), action: "link_extended", by, detail: `+${hours} h, open until ${formatInZone(closesAt, "Asia/Kolkata")}${reopen.status ? ` (reopened from ${i.status})` : ""}` });
  return updated;
}

/** Gives the candidate one more resume after they used up the limit. */
export async function grantExtraResume(id: string, by: string): Promise<InterviewRecord> {
  const i = await must(id);
  if (i.resumes <= 0) throw new Error("The candidate hasn't used any resumes yet.");
  if (!["interrupted", "in_progress", "scheduled"].includes(i.status)) throw new Error("Only an unfinished interview can be resumed.");
  const updated = await updateInterview(id, { $inc: { resumes: -1 } }, { resumes: { $gt: 0 } });
  if (!updated) throw new Error("The interview changed meanwhile. Reload the page and try again.");
  await audit({ ...who(i), action: "resume_granted", by, detail: `${updated.resumes} of ${i.config.maxResumes} used` });
  return updated;
}

/** Throws away the prepared questions and writes new ones (only before the candidate answers anything). */
export async function regenerateQuestions(id: string, by: string): Promise<void> {
  const i = await must(id);
  if (i.answers.length) throw new Error("The candidate has already answered: the questions can't change now.");
  if (["in_progress", "completed", "cancelled"].includes(i.status)) throw new Error("The questions can only change before the interview starts.");
  const updated = await updateInterview(id, { $set: { questions: [], mcq: null }, $unset: { planModel: "" } }, { "answers.0": { $exists: false }, status: i.status });
  if (!updated) throw new Error("The interview changed meanwhile. Reload the page and try again.");
  await enqueue(`plan:${id}:regen:${Date.now()}`, "plan", id, new Date(), {}, 3);
  await audit({ ...who(i), action: "questions_regenerating", by, detail: "New questions are being written (the job's current settings)." });
}

/** Sends the invitation again, with the current link (it may have gone to spam). */
export async function resendInvitation(id: string, by: string): Promise<void> {
  const i = await must(id);
  if (!i.schedule || !["scheduled", "interrupted", "accommodation"].includes(i.status)) throw new Error("Only a scheduled interview has an invitation to send.");
  await queueNotification(i, "invite", {}, `:resend:${Date.now()}`);
  await audit({ ...who(i), action: "invitation_resent", by });
}

/** The candidate's link, for HR to pass on another way (phone, chat). Logged. */
export async function revealCandidateLink(id: string, by: string): Promise<string> {
  const i = await must(id);
  if (!(OPEN_STATUSES as readonly string[]).includes(i.status)) throw new Error("This interview has no active link.");
  const link = interviewLink(i);
  if (!link) throw new Error("This interview has no active link. Schedule it to create one.");
  await audit({ ...who(i), action: "link_viewed", by });
  return link;
}

/** HR's own email to the candidate, from the HR mail server. Logged with the notifications. */
export async function messageCandidate(id: string, subject: string, body: string, by: string): Promise<void> {
  const i = await must(id);
  const s = subject.trim().slice(0, HR_MESSAGE_SUBJECT_MAX);
  const b = body.replace(/\r\n/g, "\n").trim().slice(0, HR_MESSAGE_BODY_MAX);
  if (s.length < 3) throw new Error("Write a subject.");
  if (b.length < 5) throw new Error("Write the message.");
  if (!(await hasMailer())) throw new Error("Email isn't set up (Site settings → Email).");
  const settings = await getSiteSettings();
  const logId = randomUUID();
  const base = { id: logId, ...who(i), channel: "email" as const, kind: "hr_message" as const, recipient: i.candidate.email };
  try {
    await sendMail({
      to: i.candidate.email,
      subject: s,
      text: `${b}\n\n${settings.name}`,
      html: `<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.55;color:#1f2937;white-space:pre-wrap">${escapeHtml(b)}</div><p style="font-family:Arial,sans-serif;color:#6b7280;font-size:13px">${escapeHtml(settings.name)}</p>`,
      ...(settings.hr.email ? { replyTo: settings.hr.email } : {}),
    });
    await logNotification({ ...base, status: "sent", detail: s });
  } catch (e) {
    await logNotification({ ...base, status: "failed", error: (e instanceof Error ? e.message : String(e)).slice(0, 300), detail: s });
    throw new Error("The email couldn't be sent. Check Site settings → Email and try again.");
  }
  await audit({ ...who(i), action: "message_sent", by, detail: s });
}

// --- bulk -------------------------------------------------------------------------------------------

export type BulkResult = { done: number; skipped: { id: string; name: string; reason: string }[] };

/**
 * Runs one action on many interviews, one after another. An interview the
 * action doesn't apply to is skipped with the reason; the others still run.
 */
export async function runBulk(ids: readonly string[], action: BulkAction, by: string, opts: { reason?: string } = {}): Promise<BulkResult> {
  const unique = [...new Set(ids.map(String))].slice(0, BULK_MAX);
  const result: BulkResult = { done: 0, skipped: [] };
  for (const id of unique) {
    const i = await getInterview(id);
    if (!i) {
      result.skipped.push({ id, name: id, reason: "No longer exists." });
      continue;
    }
    try {
      switch (action) {
        case "remind":
          await sendReminderNow(id, by);
          break;
        case "resend_invite":
          await resendInvitation(id, by);
          break;
        case "auto_schedule":
          await autoSchedule(id, by);
          break;
        case "extend_24h":
          await extendLinkWindow(id, 24, by);
          break;
        case "evaluate":
          await requestEvaluation(id, by);
          break;
        case "shortlist":
        case "reject":
          if (i.status !== "completed") throw new Error("Not completed yet.");
          await applyDecision(id, action, opts.reason ?? "", by);
          break;
        case "cancel":
          await cancelInterview(id, by, opts.reason ?? "");
          break;
      }
      result.done++;
    } catch (e) {
      result.skipped.push({ id, name: i.candidate.name, reason: e instanceof Error ? e.message : "Failed." });
    }
  }
  return result;
}

// --- the candidate picks another time ---------------------------------------------------------------

/** How many more times this candidate may move the interview themselves (0 = not now). */
export function selfReschedulesLeft(i: InterviewRecord): number {
  const max = i.config.candidateReschedules ?? 0;
  if (max <= 0 || i.answers.length > 0 || !i.schedule) return 0;
  if (!["scheduled", "missed"].includes(i.status)) return 0;
  return Math.max(0, max - (i.selfReschedules ?? 0));
}

/** The times offered to the candidate: working slots from two hours from now, a few hours apart. */
export function selfRescheduleSlots(i: InterviewRecord, now = new Date()): Date[] {
  return selfReschedulesLeft(i) > 0 ? workingSlots(now, rulesOf(i), 8, { minLeadHours: 2, gapHours: 3, maxDays: 14 }) : [];
}

/**
 * The candidate moves their own interview. The time must be a working slot at
 * least two hours away and within two weeks (the page offers those). Issues a
 * new link (emailed, and returned so the page can move to it).
 */
export async function candidateReschedule(i: InterviewRecord, startsAt: Date, now = new Date()): Promise<{ link: string }> {
  if (selfReschedulesLeft(i) <= 0) throw new Error("This interview can't be moved from here. Please reply to the invitation email.");
  const t = startsAt.getTime();
  if (Number.isNaN(t) || t < now.getTime() + 2 * 3600_000 - 60_000 || t > now.getTime() + 14 * 86400_000 || !isWorkingSlot(startsAt, rulesOf(i))) {
    throw new Error("Please choose one of the times shown.");
  }
  // Only a time the page offered (the list is recomputed; allow for a page left open a few minutes).
  // The chain of slots depends on when the page was loaded, so check the lists it could have shown in the last 3 hours.
  const offered = new Set<number>();
  for (let back = 0; back <= 6; back++) {
    for (const d of workingSlots(new Date(now.getTime() - back * 30 * 60_000), rulesOf(i), 8, { minLeadHours: 2, gapHours: 3, maxDays: 14 })) offered.add(d.getTime());
  }
  if (!offered.has(t)) throw new Error("Please choose one of the times shown.");
  // Count it first (atomic), so a double click can't move it twice past the limit.
  const counted = await updateInterview(i.id, { $inc: { selfReschedules: 1 } }, { selfReschedules: i.selfReschedules ?? { $exists: false }, status: i.status });
  if (!counted) throw new Error("The interview changed meanwhile. Please reload the page.");
  let updated: InterviewRecord | null = null;
  try {
    updated = await scheduleInterview(i.id, startsAt, "candidate");
  } catch (e) {
    await updateInterview(i.id, { $inc: { selfReschedules: -1 } });
    throw e;
  }
  const link = updated && interviewLink(updated);
  if (!link) {
    // Not moved after all: give the move back.
    if (!updated) await updateInterview(i.id, { $inc: { selfReschedules: -1 } }, { selfReschedules: { $gt: 0 } });
    throw new Error("Something went wrong. Please reload the page.");
  }
  return { link };
}
