import Link from "@/components/site/intent-link";
import {
  Blocks,
  Lightbulb,
  Laptop,
  Building2,
  Users,
  TrendingUp,
  ArrowRight,
  Check,
  type LucideIcon,
} from "lucide-react";
import type { CSSProperties } from "react";
import { SectionHeading } from "./section-heading";
import { Reveal } from "./reveal";
import { AuroraBlobs } from "./aurora-blobs";
import { Marked } from "./marked";
import { cn } from "@/lib/utils";
import { getServices } from "@/lib/services-store";
import { getSiteSettings } from "@/lib/settings";
import { getCaseStudies } from "@/lib/cases-store";
import { getPosts } from "@/lib/blog-store";
import { getSolutions } from "@/lib/solutions-store";
import { getHireRoles } from "@/lib/hire-store";
import { fill } from "@/lib/home-schema";
import type { HomeContent } from "@/lib/home-defaults";

/** Card look — icon, gradients and silhouette — by position. Text is admin-edited. */
type CardStyle = {
  icon: LucideIcon;
  /** Icon-tile gradient — Dark Aurora ramp */
  tile: string;
  /** Rim gradient (organic outline around the card) */
  rim: string;
  /** Interior wash colour behind the icon */
  tint: string;
  /** Organic silhouette variant (see .explore-card--* in globals.css) */
  shape: "a" | "b" | "c" | "d" | "e" | "f";
};

const INDIGO_RIM = "linear-gradient(140deg, #3100FF, #684DFF 52%, #287BFF)";
const BLUE_RIM = "linear-gradient(140deg, #287BFF, #684DFF 50%, #fff500)";
const YELLOW_RIM = "linear-gradient(140deg, #fff500, #287BFF 55%, #684DFF)";

const cardStyles: CardStyle[] = [
  { icon: Blocks, tile: "from-[#3100FF] to-[#684DFF]", rim: INDIGO_RIM, tint: "rgba(104, 77, 255, 0.16)", shape: "a" },
  { icon: Lightbulb, tile: "from-[#3100FF] to-[#287BFF]", rim: BLUE_RIM, tint: "rgba(104, 77, 255, 0.14)", shape: "b" },
  { icon: Laptop, tile: "from-[#684DFF] to-[#3100FF]", rim: YELLOW_RIM, tint: "rgba(40, 123, 255, 0.14)", shape: "c" },
  { icon: Building2, tile: "from-[#684DFF] to-[#287BFF]", rim: INDIGO_RIM, tint: "rgba(49, 0, 255, 0.12)", shape: "d" },
  { icon: Users, tile: "from-[#287BFF] to-[#684DFF]", rim: BLUE_RIM, tint: "rgba(104, 77, 255, 0.14)", shape: "e" },
  { icon: TrendingUp, tile: "from-[#2400C7] to-[#287BFF]", rim: YELLOW_RIM, tint: "rgba(40, 123, 255, 0.12)", shape: "f" },
];

/**
 * Explore blob cards — organic glowing-rim navigation cards. Each card
 * carries a proof figure, a short overview and three concrete highlights
 * so visitors know exactly what sits behind each door. Text comes from
 * Admin → Home page → Explore cards; {tokens} become live counts.
 */
export async function ExploreBlobs({ content: c }: { content: HomeContent["explore"] }) {
  const [services, caseStudies, insights, solutions, hireRoles, settings] = await Promise.all([
    getServices(), getCaseStudies(), getPosts(), getSolutions(), getHireRoles(), getSiteSettings(),
  ]);
  const vars = {
    services: services.length,
    solutions: solutions.length,
    caseStudies: caseStudies.length,
    articles: insights.length,
    hireRoles: hireRoles.length,
    foundedYear: settings.foundedYear,
  };
  const cards = c.cards.map((card, i) => ({
    ...cardStyles[i % cardStyles.length],
    label: fill(card.label, vars),
    href: card.href,
    description: fill(card.description, vars),
    stat: { value: fill(card.statValue, vars), label: fill(card.statLabel, vars) },
    highlights: [card.highlight1, card.highlight2, card.highlight3].filter(Boolean).map((h) => fill(h, vars)),
    cta: fill(card.cta, vars),
  }));
  return (
    <section className="relative overflow-hidden bg-uk-surface section-py">
      {/* Drifting aurora blobs behind the cards */}
      <AuroraBlobs
        blobs={[
          { left: "-8%", top: "-12%", size: "26rem", tone: "indigo", shape: "a", delay: "0s" },
          { left: "78%", top: "6%", size: "20rem", tone: "cyan", shape: "b", delay: "-7s" },
          { left: "4%", top: "80%", size: "18rem", tone: "blue", shape: "c", delay: "-13s" },
          { left: "72%", top: "72%", size: "24rem", tone: "indigo", shape: "b", delay: "-4s" },
        ]}
      />

      <div className="relative mx-auto max-w-7xl px-5 lg:px-8">
        <SectionHeading
          align="center"
          eyebrow={c.eyebrow}
          title={<Marked text={c.title} />}
          description={c.description || undefined}
        />

        <Reveal
          staggerChildren
          className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
        >
          {cards.map((card, i) => {
            const Icon = card.icon;
            return (
              <Link
                key={`${card.label}-${i}`}
                href={card.href}
                className={cn(
                  "explore-card group p-8 sm:p-9",
                  `explore-card--${card.shape}`
                )}
              >
                <span
                  className="explore-card-rim"
                  style={{ background: card.rim }}
                  aria-hidden
                />
                <span className="explore-card-core" aria-hidden>
                  <span
                    className="explore-card-tint"
                    style={{ "--tint": card.tint } as CSSProperties}
                  />
                </span>

                {/* Icon + proof figure */}
                <span className="relative z-10 flex items-start justify-between gap-4">
                  <span
                    className={cn(
                      "flex h-14 w-14 flex-none items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-glow-blue-sm",
                      "transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-6",
                      card.tile
                    )}
                  >
                    <Icon className="h-7 w-7" strokeWidth={2} />
                  </span>
                  {(card.stat.value || card.stat.label) && (
                    <span className="flex flex-col items-end text-right">
                      <span className="font-heading text-3xl font-bold leading-none text-uk-blue">
                        {card.stat.value}
                      </span>
                      <span className="mt-1.5 max-w-[8rem] text-[0.7rem] font-semibold uppercase leading-tight tracking-wider text-uk-muted">
                        {card.stat.label}
                      </span>
                    </span>
                  )}
                </span>

                {/* Title + overview */}
                <span className="relative z-10 mt-7 font-heading text-xl font-bold text-uk-heading">
                  {card.label}
                </span>
                <span className="relative z-10 mt-2 text-sm leading-relaxed text-uk-muted">
                  {card.description}
                </span>

                {/* What's behind the door */}
                {card.highlights.length > 0 && (
                  <span className="relative z-10 mt-5 flex flex-col gap-2 border-t border-uk-line pt-5">
                    {card.highlights.map((h, hi) => (
                      <span key={`${h}-${hi}`} className="flex items-center gap-2 text-sm font-medium text-uk-body">
                        <span className="flex h-5 w-5 flex-none items-center justify-center rounded-full bg-uk-blue/10 text-uk-blue">
                          <Check className="h-3 w-3" strokeWidth={3} />
                        </span>
                        {h}
                      </span>
                    ))}
                  </span>
                )}

                {/* CTA */}
                <span className="relative z-10 mt-auto flex items-center gap-2 pt-6 text-sm font-semibold text-uk-blue">
                  {card.cta}
                  <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1.5" />
                </span>
              </Link>
            );
          })}
        </Reveal>
      </div>
    </section>
  );
}
