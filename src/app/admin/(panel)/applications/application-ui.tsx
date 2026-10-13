import type { Application } from "@/lib/applications-store";
import { formatPostedDate } from "@/lib/careers-shared";
import { applicationStatusLabel, isInterviewStatus, type ApplicationStatus } from "@/lib/applications-validation";

const badge: Record<ApplicationStatus, string> = {
  new: "bg-uk-blue/15 text-uk-blue",
  reviewing: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  shortlisted: "bg-violet-500/15 text-violet-700 dark:text-violet-300",
  "no-show": "bg-rose-500/15 text-rose-700 dark:text-rose-300",
  "next-round": "bg-indigo-500/15 text-indigo-700 dark:text-indigo-300",
  rescheduled: "bg-cyan-500/15 text-cyan-700 dark:text-cyan-300",
  "on-hold": "bg-yellow-500/15 text-yellow-700 dark:text-yellow-300",
  selected: "bg-green-500/15 text-green-700 dark:text-green-300",
  rejected: "bg-uk-surface-3 text-uk-muted",
  "offer-issued": "bg-teal-500/15 text-teal-700 dark:text-teal-300",
  "offer-accepted": "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  "offer-declined": "bg-orange-500/15 text-orange-700 dark:text-orange-300",
  hired: "bg-emerald-600/20 text-emerald-800 dark:text-emerald-200",
  "not-joined": "bg-red-500/15 text-red-700 dark:text-red-300",
};

export function ApplicationStatusBadge({ status }: { status: ApplicationStatus }) {
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${badge[status]}`}>{applicationStatusLabel[status]}</span>
  );
}

export function formatApplicationDate(d: Date) {
  return d.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" });
}

/**
 * The interview scheduled for this applicant: from the latest interview
 * status email (shortlisted, next round or rescheduled) HR sent with a date,
 * e.g. { date: "12 Oct 2026", time: "03:30 PM", mode: "Online" }. Null when none was sent.
 */
export function scheduledInterview(a: Application): { date: string; time: string; mode: string } | null {
  const sent = [...(a.statusEmails ?? [])].reverse().find((e) => isInterviewStatus(e.status) && e.details?.interviewDate);
  if (!sent?.details) return null;
  const date = formatPostedDate(sent.details.interviewDate);
  const m = /^(\d{1,2}):(\d{2})$/.exec((sent.details.interviewTime ?? "").trim());
  const time = m ? `${String(((Number(m[1]) + 11) % 12) + 1).padStart(2, "0")}:${m[2]} ${Number(m[1]) < 12 ? "AM" : "PM"}` : "";
  return { date, time, mode: (sent.details.interviewMode ?? "").trim() };
}

export function formatBytes(n: number) {
  return n >= 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`;
}
