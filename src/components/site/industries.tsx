"use client";

import { useEffect, useRef, useState } from "react";
import Link from "@/components/site/intent-link";
import {
  Landmark, HeartPulse, ShoppingBag, Building, Factory, Truck, Wheat, HardHat,
  GraduationCap, Plane, Clapperboard, Zap, HeartHandshake, Briefcase, Users,
  ArrowRight, ArrowUpRight, Check, CircleAlert, ShieldCheck,
} from "lucide-react";
import { SectionHeading } from "./section-heading";
import { Reveal } from "./reveal";
import { gsap } from "gsap";
import type { Industry } from "@/lib/site-data";
import type { HomeContent } from "@/lib/home-defaults";
import { Tx } from "@/components/site/texts-context";

const icons: Record<string, React.ComponentType<{ className?: string }>> = {
  landmark: Landmark,
  heartPulse: HeartPulse,
  shoppingBag: ShoppingBag,
  building: Building,
  factory: Factory,
  truck: Truck,
  wheat: Wheat,
  hardHat: HardHat,
  graduationCap: GraduationCap,
  plane: Plane,
  clapperboard: Clapperboard,
  zap: Zap,
  heartHandshake: HeartHandshake,
  briefcase: Briefcase,
  users: Users,
};

/* Default section heading — the homepage renders these verbatim; the
   /industries page passes its own via props to avoid duplicating the
   page hero's wording. */
const DEFAULT_TITLE = (
  <>
    Verticals where we have{" "}
    <span className="text-uk-blue">shipped real systems.</span>
  </>
);

const DEFAULT_LABELS = {
  buttonSuffix: "products & consulting",
  slowLabel: "What slows teams down",
  rulesLabel: "Built for the rules",
};

/**
 * Industry switchboard — master-detail instead of a card wall. Pick a
 * sector on the left; the right panel morphs with a GSAP crossfade.
 * Whole panel links to the sector's detail page.
 * `heading` — the /industries page renders its own PageHero, so it opts out.
 * `eyebrow` / `title` / `description` — optional overrides for the section
 * heading, so a page can reword it without touching the homepage.
 */
export function Industries({
  industries,
  heading = true,
  eyebrow = "Industry switchboard",
  title = DEFAULT_TITLE,
  description = "We don't claim to serve everyone. These are the sectors where we have live, proven work — with case studies for many of them.",
  labels = DEFAULT_LABELS,
}: {
  /** Published industries, in display order (from the admin-managed list). */
  industries: Industry[];
  heading?: boolean;
  eyebrow?: string;
  title?: React.ReactNode;
  description?: string;
  /** panel button and sub-headings, from Admin → Home page → Industries */
  labels?: Pick<HomeContent["industries"], "buttonSuffix" | "slowLabel" | "rulesLabel">;
}) {
  const [active, setActive] = useState(0);
  const panelRef = useRef<HTMLDivElement>(null);
  const detailRef = useRef<HTMLDivElement>(null);
  const current = industries[active];

  // On phones/tablets the 14 sector tabs stack ABOVE the detail panel, so
  // a tap changed content that was off-screen and looked like nothing
  // happened. Below lg, bring the panel into view after picking a sector.
  const select = (i: number) => {
    setActive(i);
    if (window.matchMedia("(max-width: 1023px)").matches) {
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      detailRef.current?.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
    }
  };

  // crossfade + slide the detail panel on every switch
  useEffect(() => {
    const el = panelRef.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        el,
        { opacity: 0, x: 16 },
        { opacity: 1, x: 0, duration: 0.45, ease: "power3.out" }
      );
    }, el);
    return () => ctx.revert();
  }, [active]);

  // Nothing published (every industry is a draft): show no section at all.
  if (!current) return null;

  return (
    <section id="industries" className="relative overflow-hidden bg-uk-surface-2 section-py">
      <div className="absolute inset-0 bg-blueprint opacity-40" aria-hidden />
      <div className="relative mx-auto max-w-7xl pl-[max(1.25rem,env(safe-area-inset-left))] pr-[max(1.25rem,env(safe-area-inset-right))] lg:px-8">
        {heading && (
          <SectionHeading
            align="center"
            eyebrow={eyebrow}
            title={title}
            description={description}
          />
        )}

        <Reveal className={heading ? "mt-14" : undefined}>
          <div className="grid grid-cols-1 overflow-hidden rounded-3xl border border-uk-line bg-uk-card shadow-premium-lg lg:grid-cols-[0.9fr_1.1fr]">
            {/* selector column */}
            <div
              role="tablist"
              aria-label="Industries"
              className="flex flex-col divide-y divide-uk-line border-b border-uk-line lg:border-b-0 lg:border-r"
            >
              {industries.map((ind, i) => {
                const Icon = icons[ind.icon];
                const selected = i === active;
                return (
                  <button
                    key={ind.slug}
                    role="tab"
                    aria-selected={selected}
                    onClick={() => select(i)}
                    className={`group relative flex items-center gap-3.5 px-6 py-4 text-left transition-colors duration-300 ${
                      selected ? "bg-uk-surface-blue" : "hover:bg-uk-surface"
                    }`}
                  >
                    {/* active rail */}
                    <span
                      className={`absolute left-0 top-0 h-full w-[3px] bg-uk-blue transition-transform duration-300 ${
                        selected ? "scale-y-100" : "scale-y-0"
                      }`}
                      aria-hidden
                    />
                    <span className="font-heading text-xs font-bold text-uk-muted/70">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span
                      className={`flex h-9 w-9 flex-none items-center justify-center rounded-lg transition-colors duration-300 ${
                        selected ? "bg-uk-blue text-uk-white" : "bg-uk-blue/10 text-uk-blue"
                      }`}
                    >
                      {Icon && <Icon className="h-4.5 w-4.5" />}
                    </span>
                    <span className={`text-sm font-semibold ${selected ? "text-uk-heading" : "text-uk-body group-hover:text-uk-heading"}`}>
                      <Tx>{ind.name}</Tx>
                    </span>
                    <ArrowUpRight
                      className={`ml-auto h-4 w-4 flex-none transition-all duration-300 ${
                        selected ? "text-uk-blue opacity-100" : "opacity-0 group-hover:opacity-60"
                      }`}
                    />
                  </button>
                );
              })}
            </div>

            {/* detail panel */}
            {/* scroll-mt clears the fixed header when scrolled into view */}
            <div ref={detailRef} className="relative min-h-[21rem] scroll-mt-20 overflow-hidden bg-uk-surface-blue p-6 sm:p-10">
              <div className="absolute inset-0 bg-blueprint opacity-50" aria-hidden />
              <div className="absolute -right-16 -top-16 h-52 w-52 rounded-full bg-uk-blue/12 blur-[80px]" aria-hidden />
              <div ref={panelRef} className="relative flex h-full flex-col">
                <div className="flex items-start justify-between gap-4">
                  <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-uk-blue text-uk-white shadow-glow-blue-sm">
                    {(() => {
                      const Icon = icons[current.icon];
                      return Icon ? <Icon className="h-7 w-7" /> : null;
                    })()}
                  </span>
                  <Link
                    href={`/industries/${current.slug}`}
                    className="btn-lift inline-flex items-center gap-2 rounded-full bg-uk-blue px-4 py-2 text-sm font-semibold text-uk-white shadow-glow-blue-sm hover:bg-uk-blue-bright"
                  >
                    <Tx>{current.name.split(" ")[0]}</Tx> <Tx>{labels.buttonSuffix}</Tx>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
                <h3 className="mt-6 font-heading text-2xl font-bold text-uk-heading-strong sm:text-3xl">
                  <Tx>{current.name}</Tx>
                </h3>
                <p className="mt-3 max-w-lg text-sm leading-relaxed text-uk-muted sm:text-base">
                  <Tx>{current.overview[0]}</Tx>
                </p>
                <ul className="mt-5 flex flex-wrap gap-2.5">
                  {current.outcomes.map((o) => (
                    <li
                      key={o}
                      className="inline-flex items-center gap-1.5 rounded-full border border-uk-blue/20 bg-white dark:bg-uk-card px-3 py-1.5 text-xs font-medium text-uk-body"
                    >
                      <Check className="h-3.5 w-3.5 text-uk-blue" />
                      <Tx>{o}</Tx>
                    </li>
                  ))}
                </ul>

                {/* Proof metrics — measured results from live deployments */}
                {current.proof && (
                  <div className="mt-5 grid max-w-md grid-cols-3 gap-3 rounded-2xl border border-uk-blue/15 bg-uk-blue/[0.06] p-4">
                    {current.proof.map((s) => (
                      <div key={s.label} className="flex flex-col gap-0.5">
                        <span className="font-heading text-lg font-bold text-uk-blue sm:text-xl"><Tx>{s.value}</Tx></span>
                        <span className="text-[0.7rem] leading-tight text-uk-muted"><Tx>{s.label}</Tx></span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Sector challenges — what we walk in and fix */}
                {current.challenges.length > 0 && (
                  <div className="mt-5 max-w-lg">
                    <p className="text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-uk-muted">
                      <Tx>{labels.slowLabel}</Tx>
                    </p>
                    <ul className="mt-2.5 grid grid-cols-1 gap-x-4 gap-y-1.5 sm:grid-cols-2">
                      {current.challenges.map((c) => (
                        <li key={c} className="flex items-start gap-2 text-xs leading-snug text-uk-body">
                          <CircleAlert className="mt-0.5 h-3.5 w-3.5 flex-none text-uk-blue" />
                          <Tx>{c}</Tx>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Compliance touchpoints — the rules we build for */}
                {current.compliance.length > 0 && (
                  <div className="mt-5 max-w-lg">
                    <p className="flex items-center gap-1.5 text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-uk-muted">
                      <ShieldCheck className="h-3.5 w-3.5 text-uk-blue" />
                      <Tx>{labels.rulesLabel}</Tx>
                    </p>
                    <ul className="mt-2.5 flex flex-wrap gap-2">
                      {current.compliance.map((c) => (
                        <li
                          key={c}
                          className="inline-flex items-center rounded-full border border-uk-blue/20 bg-white dark:bg-uk-card px-3 py-1 text-[0.7rem] font-medium text-uk-body"
                        >
                          <Tx>{c}</Tx>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Featured case study — the proof behind the claims */}
                {current.featuredCase && (
                  <Link
                    href={current.featuredCase.href}
                    className="group/case mt-auto inline-flex w-fit items-center gap-2 rounded-full border border-uk-line bg-white pt-2 pb-2 pr-4 pl-3 text-xs font-semibold text-uk-blue transition-colors hover:border-uk-blue/50 hover:text-uk-blue-bright dark:bg-uk-card"
                  >
                    <span className="flex h-5 w-5 flex-none items-center justify-center rounded-full bg-uk-blue/12 text-[0.6rem] font-bold text-uk-blue">
                      CS
                    </span>
                    <Tx>{current.featuredCase.title}</Tx>
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover/case:translate-x-0.5" />
                  </Link>
                )}
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}