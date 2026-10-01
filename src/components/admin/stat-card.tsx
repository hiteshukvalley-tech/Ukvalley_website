import Link from "@/components/site/intent-link";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/** Number tile used on the dashboard. Renders as a link when `href` is set. */
export function StatCard({
  label,
  value,
  icon: Icon,
  hint,
  href,
}: {
  label: string;
  value: number | string;
  icon: LucideIcon;
  hint?: string;
  /** Only pass for pages that already exist. */
  href?: string;
}) {
  const body = (
    <>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-uk-muted">{label}</span>
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-uk-surface-blue text-uk-blue">
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <p className="mt-3 font-heading text-3xl font-bold text-uk-heading">{value}</p>
      {hint && <p className="mt-1 text-xs text-uk-muted">{hint}</p>}
    </>
  );
  const cls = cn(
    "block rounded-2xl border border-uk-line bg-uk-card p-5 transition-colors",
    href && "hover:border-uk-blue/50"
  );
  return href ? (
    <Link href={href} className={cls}>{body}</Link>
  ) : (
    <div className={cls}>{body}</div>
  );
}
