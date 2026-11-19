"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin-session";
import { hasDatabaseUrl } from "@/lib/db/client";
import { isApplicationStatus } from "@/lib/applications-validation";
import {
  addComment, applyDecision, cancelInterview, createForApplication, deleteInterviewRecording, overrideRecommendation,
  releaseDevice, requestEvaluation, scheduleInterview, sendReminderNow, setMode,
} from "@/lib/ai-interview/lifecycle";
import { requeue } from "@/lib/ai-interview/jobs";
import { disconnect } from "@/lib/ai-interview/google-calendar";
import {
  deleteJobOverride, getAiSettings, readJobOverrideForm, readSettingsForm, readTemplatesForm, saveAiSettings, saveJobOverride,
  type FieldErrors,
} from "@/lib/ai-interview/settings-store";
import { audit, getInterview, getNotification, logNotification } from "@/lib/ai-interview/store";
import { HR_COMMENT_MAX, isHrDecision, isRecommendation } from "@/lib/ai-interview/types";

// Server actions for Admin → AI interviews. Every action checks the
// "ai-interviews" section itself (a team member without it can't call them
// directly), and every change to an interview lands in its audit trail.
// (Panel-wide actions such as settings or Google Calendar have no interview to log against.)

export type ActionResult = { ok: true; message: string } | { ok: false; message: string; errors?: FieldErrors };

const AREA = "ai-interviews";
const NO_DB: ActionResult = { ok: false, message: "The database is not configured (MONGODB_URI)." };
const msg = (e: unknown) => (e instanceof Error ? e.message : "Something went wrong.");

function refresh(id?: string) {
  revalidatePath("/admin/ai-interviews", "layout");
  if (id) revalidatePath(`/admin/ai-interviews/${id}`);
}

/** "2026-11-24T11:00" from a datetime-local field, read as India time (+05:30) unless a zone offset is given. */
function readStart(raw: FormDataEntryValue | null): Date | null {
  const v = String(raw ?? "").trim();
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(v)) return null;
  const d = new Date(`${v}:00+05:30`);
  return Number.isNaN(d.getTime()) ? null : d;
}

export async function rescheduleAction(_: ActionResult | null, f: FormData): Promise<ActionResult> {
  const me = await requireAdmin(AREA);
  if (!hasDatabaseUrl()) return NO_DB;
  const id = String(f.get("id") ?? "");
  const start = readStart(f.get("startsAt"));
  if (!start) return { ok: false, message: "Pick a valid date and time.", errors: { startsAt: "Pick a valid date and time." } };
  if (start.getTime() < Date.now() - 5 * 60_000) return { ok: false, message: "Pick a time in the future.", errors: { startsAt: "Pick a time in the future." } };
  try {
    await scheduleInterview(id, start, me.email);
    refresh(id);
    return { ok: true, message: "Interview scheduled. The candidate gets a new link." };
  } catch (e) {
    return { ok: false, message: msg(e) };
  }
}

export async function cancelAction(_: ActionResult | null, f: FormData): Promise<ActionResult> {
  const me = await requireAdmin(AREA);
  if (!hasDatabaseUrl()) return NO_DB;
  const id = String(f.get("id") ?? "");
  try {
    await cancelInterview(id, me.email, String(f.get("reason") ?? "").slice(0, 300));
    refresh(id);
    return { ok: true, message: "Interview cancelled. The candidate has been told." };
  } catch (e) {
    return { ok: false, message: msg(e) };
  }
}

export async function reminderAction(id: string): Promise<ActionResult> {
  const me = await requireAdmin(AREA);
  if (!hasDatabaseUrl()) return NO_DB;
  try {
    await sendReminderNow(id, me.email);
    refresh(id);
    return { ok: true, message: "Reminder queued." };
  } catch (e) {
    return { ok: false, message: msg(e) };
  }
}

export async function createInterviewAction(_: ActionResult | null, f: FormData): Promise<ActionResult> {
  const me = await requireAdmin(AREA);
  if (!hasDatabaseUrl()) return NO_DB;
  const applicationId = String(f.get("applicationId") ?? "");
  const start = f.get("startsAt") ? readStart(f.get("startsAt")) : null;
  if (f.get("startsAt") && !start) return { ok: false, message: "Pick a valid date and time." };
  if (start && start.getTime() < Date.now() - 5 * 60_000) return { ok: false, message: "Pick a time in the future." };
  try {
    const i = await createForApplication(applicationId, me.email, start, f.get("textMode") === "on" ? "text" : undefined);
    refresh(i.id);
    return { ok: true, message: start ? "AI interview scheduled and the invitation queued." : "AI interview created. Schedule it to send the invitation." };
  } catch (e) {
    return { ok: false, message: msg(e) };
  }
}

export async function decisionAction(_: ActionResult | null, f: FormData): Promise<ActionResult> {
  const me = await requireAdmin(AREA);
  if (!hasDatabaseUrl()) return NO_DB;
  const id = String(f.get("id") ?? "");
  const kind = f.get("decision");
  const note = String(f.get("note") ?? "").slice(0, HR_COMMENT_MAX);
  if (!isHrDecision(kind)) return { ok: false, message: "Choose a decision." };
  if (kind === "comment" && !note.trim()) return { ok: false, message: "Write a comment." };
  const stage = String(f.get("stage") ?? "");
  if (kind === "move_stage" && !isApplicationStatus(stage)) return { ok: false, message: "Choose the stage." };
  try {
    if (kind === "comment") await addComment(id, note, me.email);
    else await applyDecision(id, kind, note, me.email, stage || undefined);
    refresh(id);
    revalidatePath("/admin/applications", "layout");
    return { ok: true, message: kind === "comment" ? "Comment added." : "Decision saved." };
  } catch (e) {
    return { ok: false, message: msg(e) };
  }
}

export async function overrideAction(_: ActionResult | null, f: FormData): Promise<ActionResult> {
  const me = await requireAdmin(AREA);
  if (!hasDatabaseUrl()) return NO_DB;
  const id = String(f.get("id") ?? "");
  const rec = f.get("recommendation");
  try {
    await overrideRecommendation(id, isRecommendation(rec) ? rec : null, String(f.get("reason") ?? ""), me.email);
    refresh(id);
    return { ok: true, message: isRecommendation(rec) ? "Recommendation overridden." : "Override removed." };
  } catch (e) {
    return { ok: false, message: msg(e) };
  }
}

export async function interviewToolAction(id: string, tool: "evaluate" | "release" | "text_mode" | "video_mode" | "delete_recording"): Promise<ActionResult> {
  const me = await requireAdmin(AREA);
  if (!hasDatabaseUrl()) return NO_DB;
  try {
    if (tool === "evaluate") await requestEvaluation(id, me.email);
    else if (tool === "release") await releaseDevice(id, me.email);
    else if (tool === "text_mode") await setMode(id, "text", me.email);
    else if (tool === "video_mode") await setMode(id, "video", me.email);
    // Named explicitly: a server action's arguments come from the browser, so an unknown value must never reach a destructive branch.
    else if (tool === "delete_recording") await deleteInterviewRecording(id, me.email);
    else return { ok: false, message: "Unknown action." };
    refresh(id);
    const done = { evaluate: "Evaluation queued.", release: "Unlocked: the candidate can continue in another browser.", text_mode: "Written interview allowed.", video_mode: "Video interview set.", delete_recording: "Recording deleted." };
    return { ok: true, message: done[tool] };
  } catch (e) {
    return { ok: false, message: msg(e) };
  }
}

/** Sends a failed notification again (its job runs again now). */
export async function retryNotificationAction(logId: string): Promise<ActionResult> {
  const me = await requireAdmin(AREA);
  if (!hasDatabaseUrl()) return NO_DB;
  try {
    const log = await getNotification(logId);
    if (!log) return { ok: false, message: "That notification no longer exists." };
    const i = await getInterview(log.interviewId);
    if (!i) return { ok: false, message: "That interview no longer exists." };
    // The job key is not on the log line; requeue by searching the interview's jobs for this log id.
    const { listJobs } = await import("@/lib/ai-interview/jobs");
    const job = (await listJobs(i.id)).find((j) => j.payload.logId === logId || `cal-${j._id}` === logId);
    if (!job) return { ok: false, message: "This notification can't be sent again." };
    await requeue(job._id);
    await logNotification({ id: logId, interviewId: log.interviewId, applicationId: log.applicationId, candidateName: log.candidateName, channel: log.channel, kind: log.kind, recipient: log.recipient, status: "queued", attempts: 0 });
    await audit({ interviewId: i.id, applicationId: i.applicationId, candidateName: i.candidate.name, action: "notification_retried", by: me.email, detail: `${log.channel} ${log.kind}` });
    revalidatePath("/admin/ai-interviews/notifications");
    return { ok: true, message: "Queued to send again." };
  } catch (e) {
    return { ok: false, message: msg(e) };
  }
}

/** Runs a failed background job again (Notifications → Failed background jobs). */
export async function retryJobAction(key: string): Promise<ActionResult> {
  const me = await requireAdmin(AREA);
  if (!hasDatabaseUrl()) return NO_DB;
  const { getJob } = await import("@/lib/ai-interview/jobs");
  const job = await getJob(String(key));
  if (!job || job.state !== "failed") return { ok: false, message: "That job isn't waiting for a retry any more." };
  const i = await getInterview(job.interviewId);
  if (!i) return { ok: false, message: "That interview no longer exists." };
  await requeue(job._id);
  await audit({ interviewId: i.id, applicationId: i.applicationId, candidateName: i.candidate.name, action: "job_retried", by: me.email, detail: job._id });
  revalidatePath("/admin/ai-interviews/notifications");
  return { ok: true, message: "Queued to run again." };
}

// --- settings ---------------------------------------------------------------------------------------

export async function saveSettingsAction(_: ActionResult | null, f: FormData): Promise<ActionResult> {
  const me = await requireAdmin(AREA);
  if (!hasDatabaseUrl()) return NO_DB;
  const { settings, templates } = await getAiSettings();
  const s = readSettingsForm(f, settings);
  const t = readTemplatesForm(f, templates);
  const errors = { ...s.errors, ...t.errors };
  if (Object.keys(errors).length) return { ok: false, message: "Please fix the highlighted fields.", errors };
  try {
    await saveAiSettings(s.value, t.value, me.email);
    refresh();
    return { ok: true, message: s.value.enabled ? "Saved. AI interviews are on for new applications." : "Saved. AI interviews are off." };
  } catch (e) {
    return { ok: false, message: msg(e) };
  }
}

export async function saveJobOverrideAction(_: ActionResult | null, f: FormData): Promise<ActionResult> {
  const me = await requireAdmin(AREA);
  if (!hasDatabaseUrl()) return NO_DB;
  const slug = String(f.get("careerSlug") ?? "").trim();
  if (!/^[a-z0-9-]{1,80}$/.test(slug)) return { ok: false, message: "Choose a job opening." };
  if (f.get("remove") === "1") {
    try {
      await deleteJobOverride(slug);
    } catch (e) {
      return { ok: false, message: msg(e) };
    }
    refresh();
    return { ok: true, message: "This job now uses the general settings." };
  }
  const { settings } = await getAiSettings();
  const o = readJobOverrideForm(f, settings);
  if (Object.keys(o.errors).length) return { ok: false, message: "Please fix the highlighted fields.", errors: o.errors };
  try {
    await saveJobOverride(slug, o.value, me.email);
    refresh();
    return { ok: true, message: "Settings for this job saved." };
  } catch (e) {
    return { ok: false, message: msg(e) };
  }
}

export async function disconnectGoogleAction(): Promise<ActionResult> {
  await requireAdmin(AREA);
  if (!hasDatabaseUrl()) return NO_DB;
  try {
    await disconnect();
  } catch (e) {
    return { ok: false, message: msg(e) };
  }
  refresh();
  return { ok: true, message: "Google Calendar disconnected." };
}

/** Re-writes every interview's normalized model collections (questions, answers, scores…). */
export async function rebuildModelsAction(): Promise<ActionResult> {
  await requireAdmin(AREA);
  if (!hasDatabaseUrl()) return NO_DB;
  try {
    const { reconcileModels } = await import("@/lib/ai-interview/models-store");
    const { col } = await import("@/lib/ai-interview/store");
    // Mark everything as behind, then sync in batches (a few hundred interviews take seconds).
    await col().updateMany({}, { $unset: { modelsSyncedAt: "" } });
    let total = 0;
    for (let n = await reconcileModels(200); n > 0; n = await reconcileModels(200)) total += n;
    refresh();
    return { ok: true, message: `Data models rebuilt for ${total} interview${total === 1 ? "" : "s"}.` };
  } catch (e) {
    return { ok: false, message: msg(e) };
  }
}

// --- quick actions on one interview, bulk actions (hr-tools.ts) -------------------------------------

export type QuickTool = "resend_invite" | "grant_resume" | "regenerate" | "auto_schedule";

export async function quickToolAction(id: string, tool: QuickTool): Promise<ActionResult> {
  const me = await requireAdmin(AREA);
  if (!hasDatabaseUrl()) return NO_DB;
  try {
    const tools = await import("@/lib/ai-interview/hr-tools");
    if (tool === "resend_invite") await tools.resendInvitation(String(id), me.email);
    else if (tool === "grant_resume") await tools.grantExtraResume(String(id), me.email);
    else if (tool === "regenerate") await tools.regenerateQuestions(String(id), me.email);
    else if (tool === "auto_schedule") await tools.autoSchedule(String(id), me.email);
    else return { ok: false, message: "Unknown action." };
    refresh(String(id));
    const done: Record<QuickTool, string> = {
      resend_invite: "Invitation queued again.",
      grant_resume: "The candidate can resume one more time.",
      regenerate: "New questions are being written. Reload in a minute.",
      auto_schedule: "Scheduled at the next free time. The candidate gets the link.",
    };
    return { ok: true, message: done[tool] };
  } catch (e) {
    return { ok: false, message: msg(e) };
  }
}

export async function extendLinkAction(id: string, hours: number): Promise<ActionResult> {
  const me = await requireAdmin(AREA);
  if (!hasDatabaseUrl()) return NO_DB;
  try {
    const { extendLinkWindow } = await import("@/lib/ai-interview/hr-tools");
    const i = await extendLinkWindow(String(id), Number(hours), me.email);
    refresh(String(id));
    return { ok: true, message: `The link stays open until ${i.schedule?.closesAt.toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "short" })} (India time).` };
  } catch (e) {
    return { ok: false, message: msg(e) };
  }
}

/** The candidate's link, to copy. Every view is in the audit trail. */
export async function revealLinkAction(id: string): Promise<ActionResult & { link?: string }> {
  const me = await requireAdmin(AREA);
  if (!hasDatabaseUrl()) return NO_DB;
  try {
    const { revealCandidateLink } = await import("@/lib/ai-interview/hr-tools");
    const link = await revealCandidateLink(String(id), me.email);
    refresh(String(id));
    return { ok: true, message: "Link copied.", link };
  } catch (e) {
    return { ok: false, message: msg(e) };
  }
}

export async function messageCandidateAction(_: ActionResult | null, f: FormData): Promise<ActionResult> {
  const me = await requireAdmin(AREA);
  if (!hasDatabaseUrl()) return NO_DB;
  try {
    const { messageCandidate } = await import("@/lib/ai-interview/hr-tools");
    const id = String(f.get("id") ?? "");
    await messageCandidate(id, String(f.get("subject") ?? ""), String(f.get("body") ?? ""), me.email);
    refresh(id);
    return { ok: true, message: "Email sent to the candidate." };
  } catch (e) {
    return { ok: false, message: msg(e) };
  }
}

export async function bulkAction(ids: string[], action: string, reason = ""): Promise<ActionResult & { skipped?: { name: string; reason: string }[] }> {
  const me = await requireAdmin(AREA);
  if (!hasDatabaseUrl()) return NO_DB;
  const { isBulkAction, BULK_MAX } = await import("@/lib/ai-interview/types");
  if (!isBulkAction(action)) return { ok: false, message: "Choose an action." };
  const list = (Array.isArray(ids) ? ids : []).map(String).filter(Boolean);
  if (!list.length) return { ok: false, message: "Select at least one interview." };
  if (list.length > BULK_MAX) return { ok: false, message: `Select up to ${BULK_MAX} at a time.` };
  const { runBulk } = await import("@/lib/ai-interview/hr-tools");
  const r = await runBulk(list, action, me.email, { reason: String(reason).slice(0, 300) });
  refresh();
  if (action === "shortlist" || action === "reject") revalidatePath("/admin/applications", "layout");
  const message = `${r.done} done${r.skipped.length ? `, ${r.skipped.length} skipped` : ""}.`;
  return { ok: r.done > 0 || !r.skipped.length, message, skipped: r.skipped.map(({ name, reason }) => ({ name, reason })) };
}
