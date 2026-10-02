import { Activity } from "lucide-react";
import { Reveal } from "./reveal";
import { StatCounter } from "./stat-counter";
import { deliveryStats } from "@/lib/site-data";
import type { HomeContent } from "@/lib/home-defaults";
import { cn } from "@/lib/utils";

/**
 * Delivery scoreboard — operating figures refreshed each quarter from the
 * delivery tracker. Rendered as a KPI row of stat tiles; the values that
 * parse as numbers count up on scroll, the rest render as-is.
 * `content` — the home page passes its admin-edited version (Admin → Home
 * page → Delivery scoreboard); other pages use the built-in figures.
 */
export function ByTheNumbers({
  title = "Delivery scoreboard",
  limit,
  className,
  content,
}: {
  title?: string;
  /** Show only the first N tiles (default: all). */
  limit?: number;
  className?: string;
  content?: HomeContent["numbers"];
}) {
  const source = content ?? { badge: title, title: "How we are performing right now", ...deliveryStats };
  const items = limit ? source.items.slice(0, limit) : source.items;
  return (
    <section className={cn("relative bg-uk-surface-2 section-py", className)}>
      <div className="relative mx-auto max-w-7xl px-5 lg:px-8">
        <Reveal className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-uk-blue/30 bg-uk-blue/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.22em] text-uk-blue">
              <span className="relative flex h-2 w-2" aria-hidden>
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-uk-blue/40" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-uk-blue" />
              </span>
              {source.badge}
            </span>
            <h2 className="mt-4 font-heading text-2xl font-bold text-uk-heading sm:text-3xl">
              {source.title}
            </h2>
          </div>
          {(source.updated || source.cadence) && (
            <p className="inline-flex items-center gap-1.5 text-xs text-uk-muted">
              <Activity className="h-3.5 w-3.5 text-uk-blue" />
              {[source.updated && `Updated ${source.updated}`, source.cadence].filter(Boolean).join(" · ")}
            </p>
          )}
        </Reveal>

        <Reveal
          staggerChildren
          className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-3xl border border-uk-line bg-uk-line sm:grid-cols-3 lg:grid-cols-4"
        >
          {items.map((s, i) => (
            <div key={`${s.label}-${i}`} className="flex flex-col gap-1.5 bg-uk-card px-4 py-7">
              <StatCounter
                value={s.value}
                className="font-heading text-3xl font-bold leading-none text-uk-blue sm:text-4xl"
              />
              <span className="mt-1 text-sm font-semibold text-uk-heading">{s.label}</span>
              <span className="text-xs text-uk-gray">{s.sub}</span>
            </div>
          ))}
        </Reveal>
      </div>
    </section>
  );
}
