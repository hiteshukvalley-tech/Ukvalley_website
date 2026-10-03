import Link from "@/components/site/intent-link";
import {
  Code, Smartphone, LayoutDashboard, Megaphone,
  ShieldCheck, Blocks, Palette, Cloud, ArrowRight, ArrowUpRight, Check,
  Gauge, Search, Layers, FileCode2, type LucideIcon,
} from "lucide-react";
import { SectionHeading } from "./section-heading";
import { Reveal } from "./reveal";
import { Tilt } from "./tilt";
import { Marked } from "./marked";
import { getServices } from "@/lib/services-store";
import { countVars, fill } from "@/lib/home-schema";
import { defaultHome, type HomeContent } from "@/lib/home-defaults";
import { ukText } from "@/lib/texts";

const icons: Record<string, LucideIcon> = {
  code: Code,
  smartphone: Smartphone,
  layoutDashboard: LayoutDashboard,
  megaphone: Megaphone,
  shieldCheck: ShieldCheck,
  blocks: Blocks,
  palette: Palette,
  cloud: Cloud,
};

/* Icons for the web-build standards on the flagship tile, by position. */
const standardIcons: LucideIcon[] = [Gauge, Search, Layers, FileCode2];

/**
 * Service constellation — the "one accountable core" diagram at the
 * heart of the bento grid. Eight service nodes orbit the core.
 * Decorative, aria-hidden.
 */
function CoreConstellation({ count }: { count: number }) {
  // One node per service line, spaced evenly on a circle around the core
  // (starting at 12 o'clock) so no two nodes ever overlap.
  const RADIUS = 38;
  const nodes = Array.from({ length: count }, (_, i) => {
    const angle = (-90 + (360 / count) * i) * (Math.PI / 180);
    return {
      x: +(50 + RADIUS * Math.cos(angle)).toFixed(2),
      y: +(50 + RADIUS * Math.sin(angle)).toFixed(2),
    };
  });
  return (
    <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden>
      {nodes.map((n, i) => (
        <g key={i}>
          <line x1="50" y1="50" x2={n.x} y2={n.y} className="stroke-uk-blue/22" strokeWidth="0.4" />
          <circle cx={n.x} cy={n.y} r="2.4" className="fill-uk-blue" opacity={0.85} />
          <circle cx={n.x} cy={n.y} r="5" fill="none" className="stroke-uk-blue/25" strokeWidth="0.5" />
        </g>
      ))}
      <circle cx="50" cy="50" r="7" className="fill-uk-yellow" />
      <circle cx="50" cy="50" r="11" fill="none" className="stroke-uk-yellow/50" strokeWidth="0.6" />
      <text x="50" y="52.4" textAnchor="middle" className="fill-uk-heading font-heading text-[3.6px] font-bold dark:fill-[#070511]">{ukText("UKV")}</text>
    </svg>
  );
}

/**
 * Services bento. Cards come from Admin → Services; the surrounding text
 * from Admin → Home page → Services (the /services page uses the defaults).
 */
export async function Services({ content: c = defaultHome.services }: { content?: HomeContent["services"] }) {
  const services = await getServices();
  // Nothing published (every service is a draft): show no section at all.
  if (services.length === 0) return null;
  const [first, ...rest] = services;
  const FirstIcon = icons[first.icon];
  const vars = countVars(services.length);

  return (
    <section id="services" className="relative bg-uk-surface section-py">
      <div className="absolute inset-0 bg-dots opacity-40" aria-hidden />
      <div className="relative mx-auto max-w-7xl px-5 lg:px-8">
        <div className="flex flex-col items-center">
          <SectionHeading
            align="center"
            eyebrow={ukText(c.eyebrow)}
            title={<Marked text={ukText(fill(c.title, vars))} />}
            description={ukText(fill(c.description, vars) || undefined)}
          />
        </div>

        <Reveal
          staggerChildren
          className="mt-14 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4"
        >
          {/* Engineering core — 2×2 flagship tile */}
          <Tilt className="sm:col-span-2 lg:row-span-2" max={3}>
            <div className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-uk-blue/25 bg-gradient-to-br from-white dark:from-uk-card via-uk-surface-premium to-uk-surface-blue p-7 shadow-premium-lg sm:p-8">
              <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-uk-blue/15 blur-[90px] transition-all duration-700 group-hover:bg-uk-blue/30" aria-hidden />
              {c.coreBadge && (
                <span className="badge-yellow inline-flex w-fit items-center gap-2 rounded-full px-3 py-1 text-xs uppercase tracking-widest">
                  {ukText(c.coreBadge)}
                </span>
              )}

              {/* Header block — text starts directly under the badge */}
              <div className="mt-5 flex items-start gap-5">
                <div className="hidden h-32 w-32 flex-none sm:block sm:h-36 sm:w-36">
                  <CoreConstellation count={services.length} />
                </div>
                <div className="flex flex-1 flex-col gap-2.5">
                  <div className="flex items-center gap-3">
                    <span className="flex h-12 w-12 flex-none items-center justify-center rounded-xl bg-uk-blue text-uk-white shadow-glow-blue-sm">
                      {FirstIcon && <FirstIcon className="h-6 w-6" />}
                    </span>
                    <h3 className="font-heading text-xl font-bold leading-snug text-uk-heading sm:text-2xl">
                      {ukText(first.title)}
                    </h3>
                  </div>
                  <p className="text-sm leading-relaxed text-uk-muted">{ukText(first.blurb)}</p>
                  {c.coreText && <p className="text-sm leading-relaxed text-uk-gray">{ukText(c.coreText)}</p>}
                </div>
              </div>

              {/* Delivery workflow — how every engagement runs */}
              {c.workflowSteps.length > 0 && <div className="mt-5 flex flex-wrap items-center gap-x-1 gap-y-2">
                {c.workflowLabel && (
                  <>
                    <span className="text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-uk-blue">
                      {ukText(c.workflowLabel)}
                    </span>
                    <span className="mx-1 hidden h-3 w-px bg-uk-line sm:block" aria-hidden />
                  </>
                )}
                {c.workflowSteps.map((step, i) => (
                  <span key={`${step}-${i}`} className="inline-flex items-center gap-1">
                    {i > 0 && <ArrowRight className="h-3 w-3 text-uk-blue/50" aria-hidden />}
                    <span className="rounded-md border border-uk-line bg-white/70 px-2.5 py-1 font-heading text-xs font-medium text-uk-heading dark:bg-uk-card/70">
                      {ukText(step)}
                    </span>
                  </span>
                ))}
              </div>}

              {/* Technology highlights */}
              {c.chips.length > 0 && <div className="mt-4 flex flex-wrap gap-2">
                {c.chips.map((chip, i) => (
                  <span key={`${chip}-${i}`} className="inline-flex items-center gap-1.5 rounded-full bg-uk-blue/10 px-3 py-1 text-xs font-medium text-uk-blue">
                    <span className="h-1.5 w-1.5 rounded-full bg-uk-blue" />
                    {ukText(chip)}
                  </span>
                ))}
              </div>}

              {/* Proof metrics — real delivery numbers */}
              {c.proof.length > 0 && <div className="mb-6 mt-5 grid grid-cols-3 gap-3 rounded-2xl border border-uk-blue/15 bg-uk-blue/[0.06] p-4">
                {c.proof.map((m, i) => (
                  <div key={`${m.label}-${i}`} className="flex flex-col gap-0.5">
                    <span className="font-heading text-lg font-bold text-uk-blue sm:text-xl">{ukText(m.value)}</span>
                    <span className="text-[0.7rem] leading-tight text-uk-muted">{ukText(m.label)}</span>
                  </div>
                ))}
              </div>}

              {/* Build standards — the guarantees every web build ships with
                  (mirrors the /services/web-development deliverables) */}
              {c.standards.length > 0 && <div className="mb-5">
                {c.standardsLabel && (
                  <span className="text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-uk-blue">
                    {ukText(c.standardsLabel)}
                  </span>
                )}
                <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {c.standards.map((s, i) => {
                    const Icon = standardIcons[i % standardIcons.length];
                    return (
                      <div
                        key={`${s.title}-${i}`}
                        className="flex min-w-0 items-center gap-2 rounded-lg border border-uk-line bg-white/70 px-2.5 py-1.5 dark:bg-uk-card/70"
                      >
                        <span className="flex h-6 w-6 flex-none items-center justify-center rounded-md bg-uk-blue/12 text-uk-blue">
                          <Icon className="h-3.5 w-3.5" />
                        </span>
                        <span className="truncate text-xs">
                          <span className="font-heading font-bold text-uk-heading">{ukText(s.title)}</span>
                          {s.sub && <span className="text-uk-muted"> · {ukText(s.sub)}</span>}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>}

              <ul className="mt-auto grid grid-cols-2 gap-x-6 gap-y-2 border-t border-uk-line pt-4">
                {first.bullets.map((b) => (
                  <li key={b} className="flex items-center gap-2 text-xs font-medium text-uk-body">
                    <span className="h-1.5 w-1.5 flex-none rounded-full bg-uk-yellow" />
                    {ukText(b)}
                  </li>
                ))}
              </ul>

              <Link
                href={ukText(first.href)}
                className="absolute bottom-6 right-6 inline-flex h-9 w-9 items-center justify-center rounded-full bg-uk-blue text-uk-white opacity-0 shadow-glow-blue-sm transition-all duration-300 group-hover:opacity-100"
                aria-label={`Explore ${first.title}`}
              >
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>
          </Tilt>

          {rest.map((s, i) => {
            const Icon = icons[s.icon];
            return (
              <Link
                key={s.title}
                href={ukText(s.href)}
                className="group relative flex flex-col gap-4 overflow-hidden rounded-2xl border border-uk-line card-premium card-spotlight bg-uk-card p-6"
              >
                <span className="pointer-events-none absolute inset-x-0 top-0 h-[3px] origin-left scale-x-0 bg-gradient-to-r from-uk-blue to-uk-yellow transition-transform duration-500 group-hover:scale-x-100" aria-hidden />
                <span className="absolute right-5 top-5 font-heading text-4xl font-bold text-uk-blue/8 transition-colors group-hover:text-uk-blue/20">
                  {ukText(String(i + 2).padStart(2, "0"))}
                </span>
                <span className="relative flex h-12 w-12 items-center justify-center rounded-xl bg-uk-blue/12 text-uk-blue transition-colors duration-300 group-hover:bg-uk-blue group-hover:text-uk-white">
                  {Icon && <Icon className="h-6 w-6" />}
                </span>
                <div className="flex flex-col gap-2">
                  <h3 className="font-heading text-lg font-bold leading-snug text-uk-heading">
                    {ukText(s.title)}
                  </h3>
                  <p className="text-sm leading-relaxed text-uk-muted">{ukText(s.blurb)}</p>
                </div>
                <ul className="mt-auto flex flex-col gap-2 border-t border-uk-line pt-4">
                  {s.bullets.slice(0, 3).map((b) => (
                    <li key={b} className="flex items-center gap-2 text-xs font-medium text-uk-body">
                      <span className="h-1.5 w-1.5 flex-none rounded-full bg-uk-yellow" />
                      {ukText(b)}
                    </li>
                  ))}
                </ul>
                <span className="absolute bottom-6 right-6 inline-flex h-8 w-8 items-center justify-center rounded-full bg-uk-surface-blue text-uk-blue opacity-0 transition-all duration-300 group-hover:opacity-100">
                  <ArrowRight className="h-4 w-4" />
                </span>
              </Link>
            );
          })}

          {/* CTA tile completes the bento row */}
          <Link
            href={ukText("/services")}
            className="group relative flex h-full flex-col overflow-hidden rounded-2xl bg-uk-blue p-6 shadow-glow-blue-sm transition-all duration-300 hover:-translate-y-1 hover:bg-uk-blue-bright"
          >
            <div className="absolute inset-0 bg-blueprint opacity-30" aria-hidden />
            <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-uk-white/10 blur-[80px] transition-all duration-700 group-hover:bg-uk-white/20" aria-hidden />

            {/* Header block — text starts directly at the top */}
            {c.ctaBadge && (
              <span className="relative inline-flex w-fit items-center rounded-full border border-uk-white/30 bg-uk-white/10 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-uk-white">
                {ukText(c.ctaBadge)}
              </span>
            )}
            <span className="relative mt-4 max-w-[12rem] font-heading text-lg font-bold leading-snug text-uk-white">
              {ukText(c.ctaTitle)}
            </span>
            {c.ctaText && (
              <p className="relative mt-2 text-sm leading-relaxed text-uk-white/85">{ukText(c.ctaText)}</p>
            )}

            {/* What you get in the call */}
            {c.ctaPoints.length > 0 && (
              <ul className="relative mt-4 flex flex-col gap-2 border-t border-uk-white/20 pt-4">
                {c.ctaPoints.map((item, i) => (
                  <li key={`${item}-${i}`} className="flex items-center gap-2 text-xs font-medium text-uk-white/90">
                    <Check className="h-3.5 w-3.5 flex-none text-uk-yellow" />
                    {ukText(item)}
                  </li>
                ))}
              </ul>
            )}

            <span className="relative mt-auto inline-flex items-center gap-2 pt-4 text-sm font-semibold text-uk-white">
              {ukText(c.ctaLink)}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </span>
          </Link>
        </Reveal>
      </div>
    </section>
  );
}