import type { LeadStatus } from "@/lib/leads-store";

const badge: Record<LeadStatus, string> = {
  new: "bg-uk-blue/15 text-uk-blue",
  contacted: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  closed: "bg-uk-surface-3 text-uk-muted",
};

export function StatusBadge({ status, label }: { status: LeadStatus; label: string }) {
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${badge[status]}`}>{label}</span>
  );
}

export function formatLeadDate(d: Date) {
  return d.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" });
}

export function sourceLabel(source: string) {
  switch (source) {
    case "contact-page":
      return "Contact page";
    case "scoping-popup":
      return "Scoping-call popup";
    default:
      return "Website";
  }
}
