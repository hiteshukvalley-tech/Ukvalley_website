import { CircleAlert } from "lucide-react";
import {
  experienceTypeLabel, interviewStatusLabel, recommendationLabel,
  type ExperienceType, type InterviewStatus, type Recommendation,
} from "@/lib/ai-interview/types";

// Small pieces shared by the AI interview admin pages. Statuses and
// recommendations always show a text label next to the colour.

const statusTone: Record<InterviewStatus, string> = {
  unscheduled: "bg-uk-surface-2 text-uk-body",
  scheduled: "bg-uk-blue/12 text-uk-blue",
  accommodation: "bg-amber-500/15 text-amber-800 dark:text-amber-300",
  in_progress: "bg-uk-blue/12 text-uk-blue",
  interrupted: "bg-amber-500/15 text-amber-800 dark:text-amber-300",
  completed: "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300",
  missed: "bg-red-500/12 text-red-700 dark:text-red-300",
  expired: "bg-red-500/12 text-red-700 dark:text-red-300",
  cancelled: "bg-uk-surface-2 text-uk-muted",
};

export function StatusBadge({ status }: { status: InterviewStatus }) {
  return <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusTone[status]}`}>{interviewStatusLabel[status]}</span>;
}

const recTone: Record<Recommendation, string> = {
  strongly_recommended: "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300",
  recommended: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  hold: "bg-amber-500/15 text-amber-800 dark:text-amber-300",
  not_recommended: "bg-red-500/12 text-red-700 dark:text-red-300",
};

export function RecommendationBadge({ rec, overridden }: { rec: Recommendation | null; overridden?: boolean }) {
  if (!rec) return <span className="text-xs text-uk-muted">—</span>;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${recTone[rec]}`}>
      {recommendationLabel[rec]}
      {overridden && <span className="font-normal opacity-80">(HR)</span>}
    </span>
  );
}

export const ExperienceBadge = ({ type }: { type: ExperienceType }) => (
  <span className="inline-flex rounded-full border border-uk-line px-2 py-0.5 text-xs text-uk-body">{experienceTypeLabel[type]}</span>
);

/** A 0–100 score as a number and a thin bar. */
export function Score({ value, passing }: { value: number | null | undefined; passing?: number }) {
  if (typeof value !== "number") return <span className="text-xs text-uk-muted">—</span>;
  const below = typeof passing === "number" && value < passing;
  return (
    <span className="inline-flex items-center gap-2" title={passing !== undefined ? `Passing score ${passing}` : undefined}>
      <span className="font-heading text-sm font-bold tabular-nums text-uk-heading">{value}</span>
      <span className="h-1.5 w-14 overflow-hidden rounded-full bg-uk-surface-2" aria-hidden>
        <span className={`block h-full rounded-full ${below ? "bg-uk-muted" : "bg-uk-blue"}`} style={{ width: `${Math.max(2, Math.min(100, value))}%` }} />
      </span>
    </span>
  );
}

export const fmt = (d: Date | null | undefined) =>
  d ? new Date(d).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" }) : "—";

export function DbError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <div role="alert" className="mb-6 flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-800 dark:text-amber-300">
      <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{message}</span>
    </div>
  );
}

/**
 * Horizontal bars for one measure across categories (one hue, values printed
 * beside each bar, so the chart reads without colour). Each bar has a hover
 * title, and the numbers are in the markup for screen readers.
 */
export function BarList({ rows, unit = "", empty = "No data yet." }: { rows: { label: string; value: number; hint?: string }[]; unit?: string; empty?: string }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  if (!rows.length || rows.every((r) => r.value === 0)) return <p className="py-6 text-center text-sm text-uk-muted">{empty}</p>;
  return (
    <ul className="space-y-2.5">
      {rows.map((r) => (
        <li key={r.label} className="grid grid-cols-[minmax(0,9rem)_1fr_auto] items-center gap-3 text-sm" title={`${r.label}: ${r.value}${unit}${r.hint ? ` · ${r.hint}` : ""}`}>
          <span className="truncate text-uk-body">{r.label}</span>
          <span className="h-3 rounded-r bg-uk-surface-2" aria-hidden>
            <span className="block h-full rounded-r bg-uk-blue" style={{ width: `${(r.value / max) * 100}%`, minWidth: r.value ? 4 : 0 }} />
          </span>
          <span className="tabular-nums font-medium text-uk-heading">
            {r.value}
            {unit}
            {r.hint && <span className="ml-1 font-normal text-uk-muted">{r.hint}</span>}
          </span>
        </li>
      ))}
    </ul>
  );
}

export const Panel = ({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) => (
  <section className="rounded-2xl border border-uk-line bg-uk-card p-5">
    <div className="mb-4 flex items-center justify-between gap-3">
      <h2 className="font-heading text-base font-semibold text-uk-heading">{title}</h2>
      {action}
    </div>
    {children}
  </section>
);
