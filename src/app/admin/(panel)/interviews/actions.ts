"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin-session";
import { canUseArea } from "@/lib/admin-access";
import { hasDatabaseUrl } from "@/lib/db/client";
import { cancelInterview, getApplication, rescheduleInterview, type Application } from "@/lib/applications-store";
import { isInterviewStatus } from "@/lib/applications-validation";
import { cleanExtras, statusEmailTemplate } from "@/lib/application-status-emails";
import { emailBrand, sendManualEmail, sendStatusEmail } from "@/lib/application-emails";
import { isIsoDate, todayInIndia } from "@/lib/careers-shared";
import { interviewStartsAt, listInterviews } from "@/lib/interviews-store";
import { hasMailer } from "@/lib/mailer";
import { getSiteSettings } from "@/lib/settings";

export type InterviewActionResult = { ok: boolean; message?: string; errors?: Record<string, string> };

const NO_DB = "Database is not connected (MONGODB_URI missing).";
const dbMessage = (e: unknown) => (e instanceof Error ? e.message : "database error");
const MODES = ["Online", "Offline"];
const FIELD_MAX = 500;

function refresh(id: string) {
  revalidatePath("/admin");
  revalidatePath("/admin/interviews");
  revalidatePath(`/admin/applications/${id}`);
}

/** The details of the applicant's latest interview entry (round, interviewer, agenda…), or {}. */
function currentDetails(app: Application): Record<string, string> {
  const last = [...(app.statusEmails ?? [])].reverse().find((e) => isInterviewStatus(e.status) && e.details?.interviewDate);
  return { ...(last?.details ?? {}) };
}

/**
 * Reschedule: a new date and time (and optionally mode, venue, reason) for the
 * applicant's interview. The status becomes "Interview Rescheduled" and the
 * new details become the interview everywhere (a new day of today puts it in
 * Today's interviews). With `notify`, the applicant gets the "Interview
 * Rescheduled" email with the new details.
 */
export async function rescheduleInterviewAction(applicationId: string, formData: FormData): Promise<InterviewActionResult> {
  const id = String(applicationId);
  const user = await requireAdmin("applications");
  const text = (k: string) => String(formData.get(k) ?? "").replace(/\s+/g, " ").trim().slice(0, FIELD_MAX);
  const date = text("date");
  const time = text("time");
  const mode = text("mode");
  const venue = text("venue");
  const reason = text("reason");
  const notify = formData.get("notify") === "1";

  const errors: Record<string, string> = {};
  const today = todayInIndia();
  if (!isIsoDate(date)) errors.date = "Pick the new interview date.";
  else if (date < today) errors.date = "The new date can't be in the past.";
  if (!/^\d{2}:\d{2}$/.test(time)) errors.time = "Pick the new interview time.";
  else if (isIsoDate(date) && (interviewStartsAt({ date, time }) ?? 0) <= Date.now()) errors.time = "That time has already passed.";
  if (mode && !MODES.includes(mode)) errors.mode = "Choose Online or Offline.";
  if (notify && !(await hasMailer(user.id))) {
    errors.notify = "Email is not set up yet. Untick “Email the applicant”, or add SMTP in Settings.";
  }
  if (Object.keys(errors).length) return { ok: false, message: "Please fix the highlighted fields.", errors };
  if (!hasDatabaseUrl()) return { ok: false, message: NO_DB };

  const app = await getApplication(id).catch(() => null);
  if (!app) return { ok: false, message: "This application no longer exists." };

  // Keep the round, interviewer and agenda of the current interview; replace the schedule.
  const current = currentDetails(app);
  const details = cleanExtras("rescheduled", {
    ...current,
    interviewDate: date,
    interviewTime: time,
    interviewMode: mode || current.interviewMode || "",
    interviewVenue: venue || current.interviewVenue || "",
    rescheduleReason: reason,
  });
  const kept = Object.fromEntries(Object.entries({ ...current, ...details }).filter(([, v]) => v));
  const email = statusEmailTemplate("rescheduled", { id: app.id, name: app.name, position: app.position, appliedOn: app.createdAt });

  let emailed = false;
  let emailError = "";
  if (notify) {
    try {
      const settings = await getSiteSettings();
      await sendStatusEmail(app, {
        status: "rescheduled", email, extras: details, brand: emailBrand(settings),
        replyTo: settings.hr.email || undefined, sentBy: user.email, senderId: user.id,
      });
      emailed = true;
    } catch (e) {
      emailError = dbMessage(e);
    }
  }
  try {
    const found = await rescheduleInterview(id, {
      status: "rescheduled", subject: email.subject, edited: false, sentBy: user.email, sentAt: new Date(), details: kept, emailed,
    });
    if (!found) return { ok: false, message: "This application no longer exists." };
  } catch (e) {
    return { ok: false, message: `Could not save: ${dbMessage(e)}` };
  }
  refresh(id);
  const when = date === today ? "today" : "on the new date";
  if (emailError) return { ok: true, message: `Interview rescheduled ${when}, but the email could not be sent: ${emailError}` };
  return { ok: true, message: `Interview rescheduled ${when}.${emailed ? ` ${app.name} has been emailed.` : ""}` };
}

/**
 * Cancel: marks the applicant's current interview cancelled (it stays in the
 * lists, struck out, until a new one is set). The application status is left
 * as it is. With `notify`, the applicant is emailed that it is cancelled.
 */
export async function cancelInterviewAction(applicationId: string, formData: FormData): Promise<InterviewActionResult> {
  const id = String(applicationId);
  const user = await requireAdmin("applications");
  const reason = String(formData.get("reason") ?? "").replace(/\s+/g, " ").trim().slice(0, FIELD_MAX);
  const notify = formData.get("notify") === "1";
  if (notify && !(await hasMailer(user.id))) {
    return { ok: false, message: "Email is not set up yet.", errors: { notify: "Untick “Email the applicant”, or add SMTP in Settings." } };
  }
  if (!hasDatabaseUrl()) return { ok: false, message: NO_DB };

  const app = await getApplication(id).catch(() => null);
  if (!app) return { ok: false, message: "This application no longer exists." };
  if (!currentDetails(app).interviewDate) return { ok: false, message: "This applicant has no interview to cancel." };

  try {
    await cancelInterview(id, { at: new Date(), by: user.email, ...(reason ? { reason } : {}) });
  } catch (e) {
    return { ok: false, message: `Could not cancel: ${dbMessage(e)}` };
  }
  refresh(id);
  if (!notify) return { ok: true, message: `Interview with ${app.name} cancelled.` };

  try {
    const settings = await getSiteSettings();
    await sendManualEmail(
      {
        to: app.email,
        name: app.name,
        position: app.position,
        status: app.status,
        subject: `Interview Cancelled: ${app.position} | ${settings.name || "Ukvalley Technologies"}`,
        message: `Dear ${app.name},\n\nWe regret to inform you that your interview for the position of ${app.position} has been cancelled.${reason ? `\n\nReason: ${reason}` : ""}`,
        closing: "We apologise for the inconvenience. Our HR team will contact you if a new interview is scheduled.",
      },
      { app, brand: emailBrand(settings), replyTo: settings.hr.email || undefined, sentBy: user.email, senderId: user.id }
    );
  } catch (e) {
    return { ok: true, message: `Interview cancelled, but the email could not be sent: ${dbMessage(e)}` };
  }
  return { ok: true, message: `Interview with ${app.name} cancelled and ${app.email} has been emailed.` };
}

export type UpcomingInterview = {
  applicationId: string;
  name: string;
  position: string;
  mode: string;
  venue: string;
  /** HH:MM */
  time: string;
  /** start, ms since epoch */
  startsAt: number;
};

/**
 * Today's interviews that have a time and are not cancelled, for the
 * 30-minutes-before reminder in the admin panel. Empty without access.
 */
export async function upcomingInterviewsAction(): Promise<UpcomingInterview[]> {
  const me = await requireAdmin();
  if (!canUseArea(me.role, me.access, "applications") || !hasDatabaseUrl()) return [];
  const today = todayInIndia();
  // Polled from every panel page: a database hiccup returns nothing rather than an error.
  let items: Awaited<ReturnType<typeof listInterviews>>["items"];
  try {
    ({ items } = await listInterviews({ from: today, to: today }));
  } catch {
    return [];
  }
  return items.flatMap((i) => {
    const startsAt = interviewStartsAt(i);
    if (i.cancelled || startsAt === null) return [];
    return [{ applicationId: i.applicationId, name: i.name, position: i.position, mode: i.mode, venue: i.venue, time: i.time, startsAt }];
  });
}
