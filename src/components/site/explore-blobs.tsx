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
import { cn } from "@/lib/utils";
import { getServices } from "@/lib/services-store";
import { company, stats } from "@/lib/site-data";
import { getSiteSettings } from "@/lib/settings";
import { getCaseStudies } from "@/lib/cases-store";
import { getPosts } from "@/lib/blog-store";
import { getSolutions } from "@/lib/solutions-store";
import { getHireRoles } from "@/lib/hire-store";

type ExploreCard = {
  label: string;
  href: string;
  description: string;
  /** Headline proof figure shown top-right of the card */
  stat: { value: string; label: string };
  /** Three concrete highlights — what the visitor will find behind the door */
  highlights: string[];
  /** Footer call-to-action text */
  cta: string;
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
const CYAN_RIM = "linear-gradient(140deg, #fff500, #287BFF 55%, #684DFF)";

// Figures are derived from the site's data files so the cards never drift
// out of sync with the pages they link to.
const clientsStat = stats.find((s) => s.label === "Satisfied clients")?.value ?? "150+";
const projectsStat = stats.find((s) => s.label === "Projects delivered")?.value ?? "1,550+";

const staticCards: ExploreCard[] = [
  {
    label: "Services",
    href: "/services",
    description:
      "Web, mobile, custom software, cloud, marketing and security — one accountable team from scoping call to long-term support.",
    stat: { value: "", label: "Service lines" },
    highlights: ["Web & mobile apps", "CRM · ERP · HRMS", "Cloud, DevOps & security"],
    cta: "Explore services",
    icon: Blocks,
    tile: "from-[#3100FF] to-[#684DFF]",
    rim: INDIGO_RIM,
    tint: "rgba(104, 77, 255, 0.16)",
    shape: "a",
  },
  {
    label: "Solutions",
    href: "/solutions",
    description:
      "Production-proven systems we customise to your workflow — not templates you have to bend your business around.",
    stat: { value: "0", label: "Ready-to-build systems" }, // count filled in from the database below
    highlights: ["CRM & ERP platforms", "POS & e-commerce", "Loan origination & LMS"],
    cta: "Browse solutions",
    icon: Lightbulb,
    tile: "from-[#3100FF] to-[#287BFF]",
    rim: BLUE_RIM,
    tint: "rgba(104, 77, 255, 0.14)",
    shape: "b",
  },
  {
    label: "Work",
    href: "/case-studies",
    description:
      "Anonymised engagements that name the constraint, the approach, the stack and the measured result — numbers, not adjectives.",
    stat: { value: "0", label: "Case studies" }, // count filled in from the database below
    highlights: ["65% faster loan processing", "−34% monthly cloud spend", "200 stores on one POS"],
    cta: "See the results",
    icon: Laptop,
    tile: "from-[#684DFF] to-[#3100FF]",
    rim: CYAN_RIM,
    tint: "rgba(40, 123, 255, 0.14)",
    shape: "c",
  },
  {
    label: "Company",
    href: "/about",
    description:
      "An engineer-led, unfunded team based in Maharashtra, India. The architects who scope your project are the ones who build it.",
    stat: { value: String(company.foundedYear), label: "Building since" },
    highlights: [`${clientsStat} clients served`, `${projectsStat} projects delivered`, "24-hour response SLA"],
    cta: "Meet the team",
    icon: Building2,
    tile: "from-[#684DFF] to-[#287BFF]",
    rim: INDIGO_RIM,
    tint: "rgba(49, 0, 255, 0.12)",
    shape: "d",
  },
  {
    label: "Hire",
    href: "/hire",
    description:
      "Dedicated engineers verified on live production work — embedded in your tools, with code and repos in your ownership.",
    stat: { value: "48h", label: "Typical time to start" },
    highlights: ["0 specialisations", "Paid trial slice first", "Replace-anytime guarantee"], // count filled in below
    cta: "Hire engineers",
    icon: Users,
    tile: "from-[#287BFF] to-[#684DFF]",
    rim: BLUE_RIM,
    tint: "rgba(104, 77, 255, 0.14)",
    shape: "e",
  },
  {
    label: "Insights",
    href: "/blog",
    description:
      "Plain-English buyer's guides and engineering notes from the team doing the work — practical frames, no SEO filler.",
    stat: { value: "0", label: "Guides & articles" }, // count filled in from the database below
    highlights: ["Buyer's guides & pricing", "Engineering playbooks", "Growth & operations"],
    cta: "Read insights",
    icon: TrendingUp,
    tile: "from-[#2400C7] to-[#287BFF]",
    rim: CYAN_RIM,
    tint: "rgba(40, 123, 255, 0.12)",
    shape: "f",
  },
];

/**
 * Explore blob cards — six organic glowing-rim navigation cards. Each
 * card carries a proof figure, a short overview and three concrete
 * highlights so visitors know exactly what sits behind each door.
 */
export async function ExploreBlobs() {
  const [services, caseStudies, insights, solutions, hireRoles, settings] = await Promise.all([
    getServices(), getCaseStudies(), getPosts(), getSolutions(), getHireRoles(), getSiteSettings(),
  ]);
  // Proof figures that come from admin-managed content.
  const counts: Record<string, number> = {
    "/services": services.length,
    "/case-studies": caseStudies.length,
    "/blog": insights.length,
    "/solutions": solutions.length,
  };
  const cards = staticCards.map((c) => {
    if (c.href === "/about") {
      return { ...c, stat: { ...c.stat, value: String(settings.foundedYear) } };
    }
    if (c.href === "/hire") {
      return { ...c, highlights: [`${hireRoles.length} specialisations`, ...c.highlights.slice(1)] };
    }
    return c.href in counts ? { ...c, stat: { ...c.stat, value: String(counts[c.href]) } } : c;
  });
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
          eyebrow="Explore"
          title={
            <>
              Where would you like to <span className="text-uk-blue">go next</span>?
            </>
          }
          description="Six quick paths through everything we build, ship and support — each with the numbers behind it. Pick a door."
        />

        <Reveal
          staggerChildren
          className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
        >
          {cards.map((card) => {
            const Icon = card.icon;
            return (
              <Link
                key={card.label}
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
                  <span className="flex flex-col items-end text-right">
                    <span className="font-heading text-3xl font-bold leading-none text-uk-blue">
                      {card.stat.value}
                    </span>
                    <span className="mt-1.5 max-w-[8rem] text-[0.7rem] font-semibold uppercase leading-tight tracking-wider text-uk-muted">
                      {card.stat.label}
                    </span>
                  </span>
                </span>

                {/* Title + overview */}
                <span className="relative z-10 mt-7 font-heading text-xl font-bold text-uk-heading">
                  {card.label}
                </span>
                <span className="relative z-10 mt-2 text-sm leading-relaxed text-uk-muted">
                  {card.description}
                </span>

                {/* What's behind the door */}
                <span className="relative z-10 mt-5 flex flex-col gap-2 border-t border-uk-line pt-5">
                  {card.highlights.map((h) => (
                    <span key={h} className="flex items-center gap-2 text-sm font-medium text-uk-body">
                      <span className="flex h-5 w-5 flex-none items-center justify-center rounded-full bg-uk-blue/10 text-uk-blue">
                        <Check className="h-3 w-3" strokeWidth={3} />
                      </span>
                      {h}
                    </span>
                  ))}
                </span>

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
