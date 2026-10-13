import Link from "@/components/site/intent-link";
import { ArrowRight } from "lucide-react";
import { Reveal } from "./reveal";
import { ScopingButton } from "./scoping-modal";
import { Breadcrumbs, type Crumb } from "./breadcrumbs";
import { HeroPhoto } from "./hero-photo";
import { services, caseStudies, products, industries, stats, company, insights } from "@/lib/site-data";
import { hireRoles } from "@/lib/hire-data";
import { solutions } from "@/lib/solutions-data";
import { locations } from "@/lib/locations-data";
import { cn } from "@/lib/utils";
import { getServices } from "@/lib/services-store";
import { getSolutions } from "@/lib/solutions-store";
import { getIndustries } from "@/lib/industries-store";
import { getCaseStudies } from "@/lib/cases-store";
import { getProducts } from "@/lib/products-store";
import { getHireRoles } from "@/lib/hire-store";
import { getPosts } from "@/lib/blog-store";
import { getLocations } from "@/lib/locations-store";
import { getSiteSettings } from "@/lib/settings";
import { ukText } from "@/lib/texts";

/**
 * Inner-page hero: a full-width dark band with the section's photo behind
 * the title (a deep-indigo overlay keeps the white text readable), the
 * breadcrumb, label pill, title, description, actions and a row of key
 * figures. Each main section has its own photo (heroArtwork below); a page
 * can pass another with `image`. Admins can swap the photo in Admin → All
 * page text (listed as "Hero picture").
 */
export type PageHeroVariant =
  | "services"
  | "work"
  | "solutions"
  | "company"
  | "hire"
  | "insights";

type PageHeroProps = {
  eyebrow: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  crumbs?: Crumb[];
  children?: React.ReactNode;
  variant?: PageHeroVariant;
  /** Optional artwork shown in a circular frame on the right, in place of
      the variant's decorative SVG canvas. Use a preset from `heroArtwork`. */
  image?: HeroArtwork;
  /** Extra/overriding classes for the <h1> (e.g. a one-line size preset). */
  titleClassName?: string;
  /** Actions + key-facts strip for heroes without artwork (use a preset
      from `heroExtras`). Image heroes use their artwork's own. */
  extras?: HeroExtras;
};

/**
 * One-line title presets for single-name headings. Sizes come from
 * measuring the longest title in the Sora display face (width in em):
 *  - services: "Custom Software · CRM · ERP · HRMS" ≈ 18.3em, sharing the
 *    row with the circular artwork on lg+ screens
 *  - hire:     "Hire React Native Developers" ≈ 14.7em, sharing the row
 *    with the circular artwork on lg+ screens
 *  - solutions: "Learning Management (LMS)" ≈ 14.4em, sharing the row
 *    with the circular artwork on lg+ screens
 * Each size keeps the longest name on one line from the `sm` breakpoint
 * up; on phones the name is allowed to wrap. The title is plain text so it
 * starts flush with the breadcrumb, eyebrow and description.
 */
export const oneLineTitle = {
  services:
    "sm:whitespace-nowrap xl:whitespace-normal text-[1.75rem] sm:text-[clamp(1.5rem,4.4vw,2.1rem)] lg:text-[1.85rem] xl:text-[2.1rem] 2xl:text-[2.3rem]",
  hire: "sm:whitespace-nowrap xl:whitespace-normal text-[1.9rem] sm:text-[clamp(1.75rem,5.4vw,3.2rem)] lg:text-[2.3rem] xl:text-[2.6rem] 2xl:text-[2.8rem]",
  solutions:
    "sm:whitespace-nowrap xl:whitespace-normal text-[1.9rem] sm:text-[clamp(1.75rem,6.2vw,2.6rem)] lg:text-[2.6rem] xl:text-[3rem] 2xl:text-[3.25rem]",
};

/**
 * Artwork for the circular hero frame. Each source image has its own
 * colours, so each carries its own CSS grade that pulls it onto the Dark
 * Aurora palette (indigo #3100FF / #684DFF, electric blue #287BFF, yellow
 * #FFF500 accent). Class strings are written out in full so Tailwind can
 * see them.
 */
export type HeroArtwork = {
  src: string;
  /** Tailwind arbitrary `filter` — hue shift + saturation/contrast grade */
  grade: string;
  /** Tailwind `object-position` so the subject sits centre-circle */
  focus: string;
  /** Tailwind arbitrary background — yellow bloom placed on the subject */
  bloom: string;
  /** Top-left chip: a count or figure with a caption */
  stat: { value: string; label: string; sub: string };
  /** Bottom-right chip: a live-dot promise */
  badge: { label: string; sub: string };
} & HeroExtras;

/**
 * Actions + key-facts strip rendered under the hero copy. Image heroes
 * carry their own (via `HeroArtwork`); other sections pass a preset from
 * `heroExtras`. Facts are verifiable figures from the site data.
 */
export type HeroExtras = {
  /** Four figures — for image heroes they complement (never repeat) the
      circle's two chips */
  facts: { value: string; label: string }[];
  /** Secondary action beside the "Book a free scoping call" button */
  secondary: { label: string; href: string };
};

// Figures pulled from the site data so the hero strips never drift.
const statValue = (label: string, fallback: string) =>
  stats.find((s) => s.label === label)?.value ?? fallback;
const CLIENTS = statValue("Satisfied clients", "150+");
const PROJECTS = statValue("Projects delivered", "1,550+");
const YEARS = statValue("Years in business", "7+");
const COUNTRIES = new Set(locations.map((l) => l.country)).size;
// Average article length in minutes, from "6 min read"-style strings.
const AVG_READ = Math.round(
  insights.reduce((sum, p) => sum + (parseInt(p.readTime, 10) || 0), 0) / insights.length
);

// Holographic "AI-powered insights" dashboard around a data globe
// (Insights + Work heroes) → cyan-teal shifted to electric blue, yellow
// bloom on the globe, blue glow over the trend charts below it. The
// circular frame clips the corner watermark out of view.
const insightsArt = {
  src: "/insights-hero.jpg",
  grade: "[filter:hue-rotate(28deg)_saturate(1.55)_contrast(1.16)_brightness(1.1)]",
  focus: "object-[50%_48%]",
  bloom:
    "bg-[radial-gradient(circle_at_60%_46%,rgba(255,245,0,0.22),transparent_18%),radial-gradient(ellipse_at_32%_70%,rgba(104,77,255,0.28),transparent_45%)]",
};

// Violet-magenta network globe (Company heroes) → pull the magenta
// toward brand indigo, yellow bloom on the glowing horizon rim and a blue
// glow over the lit continents.
const globeArt = {
  src: "/company-hero.jpg",
  grade: "[filter:hue-rotate(-22deg)_saturate(1.35)_contrast(1.12)_brightness(1.1)]",
  focus: "object-[48%_50%]",
  bloom:
    "bg-[radial-gradient(ellipse_at_50%_20%,rgba(255,245,0,0.22),transparent_28%),radial-gradient(circle_at_56%_40%,rgba(40,123,255,0.28),transparent_40%)]",
};

// Developer + AI teammate at a holographic workspace (Hire heroes) —
// already on the indigo/blue palette, so only a light grade. The square
// crop centres on the neural globe between them (developer's hand left,
// robot right), with the yellow bloom on the globe itself.
const teamArt = {
  src: "/hire-hero.jpg",
  grade: "[filter:saturate(1.2)_contrast(1.12)_brightness(1.08)]",
  focus: "object-[62%_40%]",
  bloom:
    "bg-[radial-gradient(circle_at_68%_24%,rgba(255,245,0,0.24),transparent_20%),radial-gradient(ellipse_at_35%_70%,rgba(40,123,255,0.22),transparent_45%)]",
};

export const heroArtwork = {
  // Cyan-teal neural network on a platform → shift toward indigo-blue,
  // yellow bloom on the apex node.
  services: {
    src: "/services-hero.jpg",
    grade: "[filter:hue-rotate(28deg)_saturate(1.6)_contrast(1.16)_brightness(1.08)]",
    focus: "object-[50%_40%]",
    bloom:
      "bg-[radial-gradient(circle_at_50%_22%,rgba(255,245,0,0.28),transparent_22%),radial-gradient(ellipse_at_50%_78%,rgba(104,77,255,0.30),transparent_45%)]",
    stat: { value: String(services.length), label: "Service lines", sub: "One accountable team" },
    badge: { label: "24h response SLA", sub: "In every contract" },
    facts: [
      { value: PROJECTS, label: "Projects delivered" },
      { value: CLIENTS, label: "Clients served" },
      { value: String(company.foundedYear), label: "Building since" },
      { value: "Day 1", label: "Code ownership" },
    ],
    secondary: { label: "See our case studies", href: "/case-studies" },
  },
  // Violet-magenta circuit brain in a server room → pull the magenta back
  // to indigo (negative hue shift), yellow spark on the crown of the brain.
  solutions: {
    src: "/solutions-hero.jpg",
    grade: "[filter:hue-rotate(-24deg)_saturate(1.5)_contrast(1.16)_brightness(1.08)]",
    focus: "object-[50%_46%]",
    bloom:
      "bg-[radial-gradient(circle_at_52%_30%,rgba(255,245,0,0.22),transparent_20%),radial-gradient(ellipse_at_50%_52%,rgba(40,123,255,0.25),transparent_50%)]",
    stat: { value: String(solutions.length), label: "Solution patterns", sub: "Proven in production" },
    badge: { label: "Prototype by week 3", sub: "Real software, not slides" },
    facts: [
      { value: "3 days", label: "Written estimate" },
      { value: "7 days", label: "Fixed proposal" },
      { value: "Weekly", label: "Live demos" },
      { value: String(industries.length), label: "Industries served" },
    ],
    secondary: { label: "See our case studies", href: "/case-studies" },
  },
  // Same insights-dashboard artwork as the Insights section.
  work: {
    ...insightsArt,
    stat: { value: String(caseStudies.length), label: "Case studies", sub: "With measured results" },
    badge: { label: `${products.length} products live`, sub: "Our own IP in production" },
    facts: [
      { value: CLIENTS, label: "Clients served" },
      { value: PROJECTS, label: "Projects delivered" },
      { value: String(industries.length), label: "Industries" },
      { value: YEARS, label: "Years in business" },
    ],
    secondary: { label: "Explore our services", href: "/services" },
  },
  // Company pages (about, team, process, pricing, locations…). Chips
  // complement — never repeat — the company facts strip below the copy.
  company: {
    ...globeArt,
    stat: { value: String(COUNTRIES), label: "Countries served", sub: "India · Gulf · North America" },
    badge: { label: "Engineer-led since 2017", sub: "Unfunded, client-accountable" },
    facts: [
      { value: String(company.foundedYear), label: "Founded" },
      { value: CLIENTS, label: "Clients served" },
      { value: PROJECTS, label: "Projects delivered" },
      { value: "24h", label: "Response SLA" },
    ],
    secondary: { label: "See our case studies", href: "/case-studies" },
  },
  // Hire pages — chips complement the hire facts strip.
  hire: {
    ...teamArt,
    stat: { value: "3", label: "Engagement models", sub: "Full-time · part-time · hourly" },
    badge: { label: "Paid trial slice first", sub: "Judge the work, not the CV" },
    facts: [
      { value: String(hireRoles.length), label: "Specialisations" },
      { value: "48h", label: "Typical time to start" },
      { value: "1 week", label: "Replace-anytime guarantee" },
      { value: "Day 1", label: "Code ownership" },
    ],
    secondary: { label: "See pricing", href: "/pricing" },
  },
  // Blog / insights pages — chips complement the insights facts strip.
  insights: {
    ...insightsArt,
    stat: { value: String(AVG_READ), label: "Minute average read", sub: "Practical, no filler" },
    badge: { label: "Written by engineers", sub: "The team doing the work" },
    facts: [
      { value: String(insights.length), label: "Guides & articles" },
      { value: String(new Set(insights.map((p) => p.category)).size), label: "Topic areas" },
      {
        value: new Date(insights.reduce((a, b) => (a.date > b.date ? a : b)).date).toLocaleDateString("en-IN", {
          month: "short",
          year: "numeric",
        }),
        label: "Latest guide",
      },
      { value: "Free", label: "No sign-up needed" },
    ],
    secondary: { label: "Explore our services", href: "/services" },
  },
} satisfies Record<string, HeroArtwork>;

const LATEST_POST = insights.reduce((a, b) => (a.date > b.date ? a : b)).date;
const TOPIC_COUNT = new Set(insights.map((p) => p.category)).size;

export const heroExtras = {
  company: {
    facts: [
      { value: String(company.foundedYear), label: "Founded" },
      { value: CLIENTS, label: "Clients served" },
      { value: PROJECTS, label: "Projects delivered" },
      { value: "24h", label: "Response SLA" },
    ],
    secondary: { label: "See our case studies", href: "/case-studies" },
  },
  hire: {
    facts: [
      { value: String(hireRoles.length), label: "Specialisations" },
      { value: "48h", label: "Typical time to start" },
      { value: "1 week", label: "Replace-anytime guarantee" },
      { value: "Day 1", label: "Code ownership" },
    ],
    secondary: { label: "See pricing", href: "/pricing" },
  },
  insights: {
    facts: [
      { value: String(insights.length), label: "Guides & articles" },
      { value: String(TOPIC_COUNT), label: "Topic areas" },
      {
        value: new Date(LATEST_POST).toLocaleDateString("en-IN", { month: "short", year: "numeric" }),
        label: "Latest guide",
      },
      { value: "Free", label: "No sign-up needed" },
    ],
    secondary: { label: "Explore our services", href: "/services" },
  },
} satisfies Record<string, HeroExtras>;

/**
 * Figures in the hero chips that come from admin-managed content, keyed by
 * the chip label. The artwork constants above are built from the static
 * files; these live values replace them at render time, so adding or
 * removing an item in the admin updates every hero count too.
 */
async function liveHeroFigures(): Promise<{ byLabel: Record<string, string>; products: number }> {
  try {
    const [services, solutions, industries, cases, products, hire, posts, locations, settings] = await Promise.all([
      getServices(), getSolutions(), getIndustries(), getCaseStudies(), getProducts(),
      getHireRoles(), getPosts(), getLocations(), getSiteSettings(),
    ]);
    const byLabel: Record<string, string> = {
      "Service lines": String(services.length),
      "Solution patterns": String(solutions.length),
      "Industries served": String(industries.length),
      Industries: String(industries.length),
      "Case studies": String(cases.length),
      Specialisations: String(hire.length),
      "Countries served": String(new Set(locations.map((l) => l.country)).size),
      "Building since": String(settings.foundedYear),
      Founded: String(settings.foundedYear),
    };
    if (posts.length) {
      const latest = posts.reduce((a, b) => (a.date > b.date ? a : b)).date;
      byLabel["Guides & articles"] = String(posts.length);
      byLabel["Topic areas"] = String(new Set(posts.map((p) => p.category)).size);
      byLabel["Latest guide"] = new Date(latest).toLocaleDateString("en-IN", { month: "short", year: "numeric" });
      byLabel["Minute average read"] = String(
        Math.round(posts.reduce((sum, p) => sum + (parseInt(p.readTime, 10) || 0), 0) / posts.length)
      );
    }
    return { byLabel, products: products.length };
  } catch {
    return { byLabel: {}, products: -1 };
  }
}

function withLiveFigures<T extends Partial<HeroArtwork> | undefined>(
  art: T,
  live: { byLabel: Record<string, string>; products: number }
): T {
  if (!art) return art;
  const fix = <F extends { value: string; label: string }>(f: F): F =>
    live.byLabel[f.label] !== undefined ? { ...f, value: live.byLabel[f.label] } : f;
  return {
    ...art,
    ...(art.stat && { stat: fix(art.stat) }),
    ...(art.facts && { facts: art.facts.map(fix) }),
    ...(art.badge &&
      live.products >= 0 &&
      /^\d+ products live$/.test(art.badge.label) && {
        badge: { ...art.badge, label: `${live.products} products live` },
      }),
  };
}

/** The photo each main section uses when a page doesn't pass its own. */
const SECTION_ART: Record<PageHeroVariant, keyof typeof heroArtwork> = {
  services: "services",
  work: "work",
  solutions: "solutions",
  company: "company",
  hire: "hire",
  insights: "insights",
};

export async function PageHero({
  eyebrow,
  title,
  description,
  crumbs,
  children,
  variant = "services",
  image,
  titleClassName,
  extras,
}: PageHeroProps) {
  const live = await liveHeroFigures();
  const art = withLiveFigures(image ?? heroArtwork[SECTION_ART[variant] ?? "services"], live);
  // The actions + figures strip comes only from props, as before.
  const strip = withLiveFigures(extras ?? image, live);
  // Top padding = the fixed header's height (64px, 72px on lg) plus a
  // 32px / 40px gap, so the breadcrumb sits just under the header.
  return (
    <section className="page-hero-photo relative isolate overflow-hidden bg-[#0b0820] pb-10 pt-24 text-white lg:pb-14 lg:pt-28">
      <HeroPhoto src={ukText(art.src)} className={cn(art.focus, art.grade)} />

      <div className="relative mx-auto max-w-7xl pl-[max(1.25rem,env(safe-area-inset-left))] pr-[max(1.25rem,env(safe-area-inset-right))] lg:px-8">
        {crumbs && (
          // dark: the band is always dark, so the crumbs use the dark-theme colours in both themes
          <div className="dark mb-5">
            <Breadcrumbs items={crumbs} />
          </div>
        )}

        <Reveal className="flex max-w-3xl flex-col gap-5">
          <span className="inline-flex w-fit items-center gap-2.5 rounded-full border border-white/25 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.22em] text-white backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-uk-yellow" aria-hidden />
            {ukText(eyebrow)}
          </span>
          <h1
            className={cn(
              "font-heading-display text-balance text-4xl font-bold leading-[1.05] tracking-tight text-white sm:text-5xl lg:text-[3.5rem]",
              titleClassName
            )}
          >
            {ukText(title)}
          </h1>
          {description && (
            <p className="text-justify-prose max-w-2xl text-lg leading-relaxed text-white/80 sm:text-xl">
              {ukText(description)}
            </p>
          )}
          {children}

          {strip && (
            <div className="mt-1 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              <ScopingButton className="btn-sheen btn-lift group inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-uk-blue px-6 text-sm font-semibold text-white shadow-glow-blue-sm hover:bg-uk-blue-bright sm:w-auto">
                {ukText("Book a free scoping call")}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </ScopingButton>
              <Link
                href={ukText(strip.secondary.href)}
                className="btn-lift group inline-flex h-12 w-full items-center justify-center gap-2 rounded-full border border-white/40 px-6 text-sm font-semibold text-white hover:bg-white hover:text-[#0b0820] sm:w-auto"
              >
                {ukText(strip.secondary.label)}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          )}
        </Reveal>

        {/* Key figures — a bordered row of boxes under the copy */}
        {strip && strip.facts.length > 0 && (
          <Reveal className="mt-8">
            <p className="mb-3 text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-white/60">{ukText("At a glance")}</p>
            <dl className="grid grid-cols-2 overflow-hidden rounded-2xl border border-white/15 bg-white/[0.04] backdrop-blur sm:grid-cols-4">
              {strip.facts.map((fact, i) => (
                <div
                  key={fact.label}
                  className={cn(
                    "flex flex-col gap-1 p-5",
                    i % 2 === 1 && "border-l border-white/15",
                    i >= 2 && "border-t border-white/15 sm:border-t-0",
                    i >= 1 && "sm:border-l sm:border-white/15"
                  )}
                >
                  <dd className="font-heading text-3xl font-bold leading-none text-uk-yellow">{ukText(fact.value)}</dd>
                  <dt className="text-xs font-medium leading-snug text-white/75">{ukText(fact.label)}</dt>
                </div>
              ))}
            </dl>
          </Reveal>
        )}
      </div>
    </section>
  );
}
