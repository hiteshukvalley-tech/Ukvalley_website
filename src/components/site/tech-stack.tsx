"use client";

import { SectionHeading } from "./section-heading";
import { Reveal } from "./reveal";
import { Marked } from "./marked";
import type { TechCategory } from "@/lib/tech-stack-validation";
import type { HomeContent } from "@/lib/home-defaults";
import type { LucideIcon } from "lucide-react";
import {
  Monitor,
  Smartphone,
  Server,
  Database,
  Cloud,
  Code2,
  FlaskConical,
} from "lucide-react";
import { cn } from "@/lib/utils";

const iconMap: Record<string, LucideIcon> = {
  monitor: Monitor,
  smartphone: Smartphone,
  server: Server,
  database: Database,
  cloud: Cloud,
  flaskConical: FlaskConical,
};

/* Each category gets a distinct accent gradient — drawn from the Dark
   Aurora ramp (indigo #3100FF · bright indigo #684DFF · electric blue
   #287BFF · cyan #fff500) so the section stays on-identity. */
const accentMap: Record<string, string> = {
  Frontend: "from-[#3100FF] to-[#fff500]",
  Mobile: "from-[#3100FF] to-[#684DFF]",
  Backend: "from-[#287BFF] to-[#684DFF]",
  Database: "from-[#287BFF] to-[#fff500]",
  "Cloud & Infra": "from-[#684DFF] to-[#fff500]",
  "Testing & QA": "from-[#2400C7] to-[#287BFF]",
};

const bgAccentMap: Record<string, string> = {
  Frontend: "bg-gradient-to-br from-[#3100FF]/[0.07] to-[#fff500]/[0.03]",
  Mobile: "bg-gradient-to-br from-[#3100FF]/[0.07] to-[#684DFF]/[0.03]",
  Backend: "bg-gradient-to-br from-[#287BFF]/[0.07] to-[#684DFF]/[0.03]",
  Database: "bg-gradient-to-br from-[#287BFF]/[0.07] to-[#fff500]/[0.03]",
  "Cloud & Infra": "bg-gradient-to-br from-[#684DFF]/[0.07] to-[#fff500]/[0.03]",
  "Testing & QA": "bg-gradient-to-br from-[#2400C7]/[0.07] to-[#287BFF]/[0.03]",
};

const borderAccentMap: Record<string, string> = {
  Frontend: "hover:border-uk-blue/50",
  Mobile: "hover:border-[#684DFF]/50",
  Backend: "hover:border-[#287BFF]/50",
  Database: "hover:border-[#fff500]/50",
  "Cloud & Infra": "hover:border-[#684DFF]/50",
  "Testing & QA": "hover:border-[#287BFF]/50",
};

/**
 * Per-language brand tint — applied to tech pills in dark mode only
 * (light mode keeps the neutral pill). Each language gets a colour close
 * to its brand identity so the pills read as real technologies, not
 * washed-out white blocks.
 */
const pillDarkColorMap: Record<string, string> = {
  // Frontend
  React: "dark:border-cyan-300/40 dark:bg-cyan-400/10 dark:text-cyan-300",
  "Next.js": "dark:border-zinc-300/40 dark:bg-zinc-300/10 dark:text-zinc-100",
  Angular: "dark:border-red-300/40 dark:bg-red-400/10 dark:text-red-300",
  "Vue.js": "dark:border-emerald-300/40 dark:bg-emerald-400/10 dark:text-emerald-300",
  TypeScript: "dark:border-blue-300/40 dark:bg-blue-400/10 dark:text-blue-300",
  "Tailwind CSS": "dark:border-sky-300/40 dark:bg-sky-400/10 dark:text-sky-300",
  Redux: "dark:border-purple-300/40 dark:bg-purple-400/10 dark:text-purple-300",
  // Mobile
  Flutter: "dark:border-sky-300/40 dark:bg-sky-400/10 dark:text-sky-300",
  Kotlin: "dark:border-violet-300/40 dark:bg-violet-400/10 dark:text-violet-300",
  "React Native": "dark:border-cyan-300/40 dark:bg-cyan-400/10 dark:text-cyan-300",
  Swift: "dark:border-orange-300/40 dark:bg-orange-400/10 dark:text-orange-300",
  // Backend
  "Node.js": "dark:border-green-300/40 dark:bg-green-400/10 dark:text-green-300",
  Python: "dark:border-blue-300/40 dark:bg-blue-400/10 dark:text-blue-300",
  Django: "dark:border-emerald-300/40 dark:bg-emerald-400/10 dark:text-emerald-300",
  Laravel: "dark:border-red-300/40 dark:bg-red-400/10 dark:text-red-300",
  PHP: "dark:border-indigo-300/40 dark:bg-indigo-400/10 dark:text-indigo-300",
  Java: "dark:border-orange-300/40 dark:bg-orange-400/10 dark:text-orange-300",
  GraphQL: "dark:border-pink-300/40 dark:bg-pink-400/10 dark:text-pink-300",
  REST: "dark:border-slate-300/40 dark:bg-slate-400/10 dark:text-slate-300",
  // Database
  MongoDB: "dark:border-green-300/40 dark:bg-green-400/10 dark:text-green-300",
  PostgreSQL: "dark:border-blue-300/40 dark:bg-blue-400/10 dark:text-blue-300",
  MySQL: "dark:border-teal-300/40 dark:bg-teal-400/10 dark:text-teal-300",
  Redis: "dark:border-red-300/40 dark:bg-red-400/10 dark:text-red-300",
  // Cloud & Infra
  AWS: "dark:border-amber-300/40 dark:bg-amber-400/10 dark:text-amber-300",
  Azure: "dark:border-blue-300/40 dark:bg-blue-400/10 dark:text-blue-300",
  Docker: "dark:border-sky-300/40 dark:bg-sky-400/10 dark:text-sky-300",
  Terraform: "dark:border-purple-300/40 dark:bg-purple-400/10 dark:text-purple-300",
  "CI/CD": "dark:border-slate-300/40 dark:bg-slate-400/10 dark:text-slate-300",
  // Testing & QA
  Jest: "dark:border-rose-300/40 dark:bg-rose-400/10 dark:text-rose-300",
  Playwright: "dark:border-green-300/40 dark:bg-green-400/10 dark:text-green-300",
  Cypress: "dark:border-teal-300/40 dark:bg-teal-400/10 dark:text-teal-300",
  Selenium: "dark:border-lime-300/40 dark:bg-lime-400/10 dark:text-lime-300",
  Postman: "dark:border-orange-300/40 dark:bg-orange-400/10 dark:text-orange-300",
};

/**
 * Tech-stack section — bento-grid layout with category cards.
 * Each card shows the category icon, label, and tech items as pills.
 * Hover lifts the card and tints the accent gradient.
 */
/**
 * `heading` — the /tech-stack page renders its own PageHero, so it opts
 * out; the homepage keeps the section heading.
 * `content` — heading and closing note, from Admin → Home page → Tech stack
 * (the /tech-stack page passes the defaults).
 */
export function TechStack({
  categories: techStack,
  heading = true,
  content: c,
}: {
  categories: TechCategory[];
  heading?: boolean;
  content: HomeContent["tech"];
}) {
  return (
    <section id="tech" className="relative overflow-hidden bg-uk-surface section-py">
      {/* background texture */}
      <div className="absolute inset-0 bg-blueprint bg-grid-fade opacity-50" aria-hidden />

      <div className="relative mx-auto max-w-7xl px-5 lg:px-8">
        {heading && (
          <SectionHeading
            align="center"
            eyebrow={c.eyebrow}
            title={<Marked text={c.title} />}
            description={c.description || undefined}
          />
        )}

        <Reveal className={heading ? "mt-14" : undefined}>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {techStack.map((cat) => {
              const Icon = iconMap[cat.icon] ?? Code2;
              const gradient = accentMap[cat.label] ?? "from-[#3100FF] to-[#287BFF]";
              const bgGradient = bgAccentMap[cat.label] ?? "";
              const borderHover = borderAccentMap[cat.label] ?? "";

              return (
                <div
                  key={cat.label}
                  className={cn(
                    "group relative flex flex-col overflow-hidden rounded-2xl border text-left transition-all duration-300",
                    "border-uk-line bg-white dark:bg-uk-card",
                    "hover:-translate-y-1 hover:shadow-premium-lg",
                    borderHover
                  )}
                >
                  {/* Top accent bar — flush, card clips corners via overflow-hidden */}
                  <div
                    className={cn(
                      "h-1 w-full bg-gradient-to-r opacity-60 transition-opacity duration-300 group-hover:opacity-100",
                      gradient
                    )}
                    aria-hidden
                  />

                  <div className={cn("flex flex-1 flex-col p-6", bgGradient)}>
                    {/* Header row */}
                    <div className="mb-5 flex items-center gap-3">
                      <span
                        className={cn(
                          "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
                          "bg-gradient-to-br text-white shadow-lg",
                          gradient
                        )}
                      >
                        {Icon && <Icon className="h-5 w-5" strokeWidth={2.2} />}
                      </span>
                      <div>
                        <h3 className="font-heading text-lg font-bold text-uk-heading">
                          {cat.label}
                        </h3>
                        <p className="text-xs text-uk-body/70">
                          {cat.items.length} technologies
                        </p>
                      </div>
                    </div>

                    {/* Why this stack — the reasoning behind the choices */}
                    <p className="mb-4 text-sm leading-relaxed text-uk-body/80">
                      {cat.why}
                    </p>

                    {/* Tech pills — each language tinted with its brand
                        colour in dark mode; neutral in light mode */}
                    <div className="mt-auto flex flex-wrap gap-2">
                      {cat.items.map((item) => (
                        <span
                          key={item}
                          className={cn(
                            "rounded-lg border border-uk-line bg-white/80 dark:bg-white/5 px-3 py-1.5",
                            "font-heading text-sm font-medium text-uk-body",
                            "transition-all duration-200",
                            "group-hover:border-uk-blue/30 group-hover:text-uk-heading",
                            pillDarkColorMap[item] ?? ""
                          )}
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Reveal>

        {/* Bottom note */}
        {c.footnote && (
          <Reveal className="mt-10 text-center">
            <p className="mx-auto max-w-xl text-sm leading-relaxed text-uk-body/70">{c.footnote}</p>
          </Reveal>
        )}
      </div>
    </section>
  );
}