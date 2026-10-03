import { applicationStatusLabel, type ApplicationStatus } from "@/lib/applications-validation";

const badge: Record<ApplicationStatus, string> = {
  new: "bg-uk-blue/15 text-uk-blue",
  reviewing: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  shortlisted: "bg-violet-500/15 text-violet-700 dark:text-violet-300",
  rejected: "bg-uk-surface-3 text-uk-muted",
  hired: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
};

export function ApplicationStatusBadge({ status }: { status: ApplicationStatus }) {
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${badge[status]}`}>{applicationStatusLabel[status]}</span>
  );
}

export function formatApplicationDate(d: Date) {
  return d.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" });
}

export function formatBytes(n: number) {
  return n >= 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`;
}
