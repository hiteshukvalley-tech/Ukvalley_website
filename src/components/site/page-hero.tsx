import Image from "next/image";
import Link from "@/components/site/intent-link";
import { BrainCircuit, Server, Users, Newspaper, Blocks, UserPlus, ArrowRight } from "lucide-react";
import { Reveal } from "./reveal";
import { ScopingButton } from "./scoping-modal";
import { Breadcrumbs, type Crumb } from "./breadcrumbs";
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
 * Each main nav section gets its own decorative hero backdrop with its
 * own symbol set and colour identity:
 *  - services → "modern AI core"  (input layer + hidden synapse rings
 *    streaming prompts into the core, generated tokens out, blue + violet)
 *  - work     → "ship pipeline"  (LED server rack feeding a build stage
 *    and a live results monitor with a travelling deploy packet, blue + cyan)
 *  - solutions → "system blueprint" (module tiles with snap brackets
 *    assembling into the core under a sweeping assembly ring, blue + emerald)
 *  - company  → "team constellation" (members in orbit around the hub,
 *    broadcasting to a globe, pin and HQ block, blue + gold)
 *  - hire     → "talent network"  (candidate nodes on a pool ring with
 *    AI match-score arcs, converging into the matching engine, blue + indigo)
 *  - insights → "story stream"  (floating article cards + a sweeping
 *    trend arrow, blue + violet)
 * All are pure SVG/CSS (no images, no JS), adapt to dark mode through
 * token overrides, and disable under prefers-reduced-motion.
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
 * Shared placement for the decorative canvas on the right side. From 2xl the
 * offset is measured from the 80rem content column, not the viewport edge,
 * so on wide screens (or a zoomed-out browser) the artwork stays beside the
 * copy instead of drifting off to the far right.
 */
const CANVAS =
  "pointer-events-none absolute -right-16 top-1/2 hidden aspect-square h-[min(40rem,100%)] -translate-y-1/2 lg:block xl:-right-24 2xl:right-[calc((100%-80rem)/2-10rem)]";

/**
 * The area the decorative artwork may draw in: the hero minus a band at
 * the top reserved for the fixed site header (≈73px tall) plus breathing
 * room. Canvases centre inside it and scale down to its height, so no
 * artwork ever runs up into the header or its "Book a scoping call"
 * button, whatever the hero's height. The top edge is a soft mask fade
 * rather than a hard clip, so soft glows dissolve instead of leaving a
 * visible straight line.
 */
const ART_ZONE =
  "pointer-events-none absolute inset-x-0 bottom-4 top-24 [mask-image:linear-gradient(to_bottom,transparent,#000_2.5rem)]";

/** Glass tile at the canvas centre — icon swaps per section. Sits on a
    soft brand-gradient halo so the core reads as the glowing heart. */
function CoreChip({ icon: Icon }: { icon: typeof BrainCircuit }) {
  return (
    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
      <div
        className="absolute -inset-9 rounded-full bg-gradient-to-tr from-uk-blue/25 via-uk-blue/10 to-uk-yellow/20 blur-xl dark:from-uk-blue/40 dark:via-transparent dark:to-uk-yellow/25"
        aria-hidden
      />
      <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-uk-blue/35 bg-white/80 shadow-[0_0_28px_rgba(49,0,255,0.28)] backdrop-blur dark:border-uk-blue/30 dark:bg-uk-card/80 dark:shadow-[0_0_36px_rgba(104,77,255,0.45)]">
        <span className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-uk-blue/10" aria-hidden />
        <Icon className="h-7 w-7 text-uk-blue" strokeWidth={1.6} />
        <span className="absolute -right-1 -top-1 flex h-3 w-3" aria-hidden>
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-uk-yellow/50" />
          <span className="relative inline-flex h-3 w-3 rounded-full bg-uk-yellow shadow-glow-yellow" />
        </span>
      </div>
    </div>
  );
}

/** Tiny cross accents scattered inside a canvas. */
function PlusMark({ className }: { className: string }) {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className={`absolute ${className}`} aria-hidden>
      <path d="M7 0v14M0 7h14" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}

/** Four-point sparkle — the AI "generation" mark. */
function Sparkle({ x, y, size, className }: { x: number; y: number; size: number; className: string }) {
  const s = size;
  return (
    <path
      d={`M${x} ${y - s} L${x + s * 0.26} ${y - s * 0.26} L${x + s} ${y} L${x + s * 0.26} ${y + s * 0.26} L${x} ${y + s} L${x - s * 0.26} ${y + s * 0.26} L${x - s} ${y} L${x - s * 0.26} ${y - s * 0.26} Z`}
      className={className}
    />
  );
}

/* ── Image canvas: artwork in a glowing circular frame ──────────────────
   Per-image CSS grade (see `heroArtwork`) + a shared indigo→blue colour
   wash pull the artwork onto the site palette. Pure CSS, so the original
   files stay untouched. `className` places the frame: beside the copy on
   wide screens, centred under it on narrower ones. */
function ImageCanvas({ art, className, preload }: { art: HeroArtwork; className: string; preload?: boolean }) {
  return (
    <div className={cn("pointer-events-none aspect-square", className)} aria-hidden>
      {/* soft brand glow behind the frame — indigo core, yellow edge */}
      <div className="absolute -inset-12 rounded-full bg-[radial-gradient(circle_at_40%_40%,rgba(49,0,255,0.35),rgba(104,77,255,0.18)_45%,rgba(255,245,0,0.12)_70%,transparent_78%)] blur-2xl dark:bg-[radial-gradient(circle_at_40%_40%,rgba(104,77,255,0.45),rgba(40,123,255,0.22)_45%,rgba(255,245,0,0.14)_70%,transparent_78%)]" />

      {/* two counter-rotating orbits with travelling dots */}
      <div className="hero-orbit absolute -inset-7 rounded-full border border-dashed border-uk-blue/35 [animation-duration:60s]">
        <span className="absolute left-1/2 top-0 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-uk-yellow shadow-glow-yellow" />
      </div>
      <div className="hero-orbit-rev absolute -inset-14 rounded-full border border-uk-blue/15 [animation-duration:90s]">
        <span className="absolute bottom-[14.6%] right-[14.6%] h-2 w-2 translate-x-1/2 translate-y-1/2 rounded-full bg-uk-blue shadow-glow-blue-sm dark:bg-uk-blue-bright" />
      </div>

      {/* the circular artwork, with a brand gradient rim */}
      <div className="relative h-full w-full rounded-full bg-gradient-to-br from-[#3100FF] via-[#684DFF] via-60% to-[#fff500] p-[3px] shadow-[0_30px_80px_-20px_rgba(49,0,255,0.55)]">
        <div className="relative h-full w-full overflow-hidden rounded-full bg-[#070511]">
          {/* graded artwork — per-image hue shift, rich saturation and
              contrast; slow zoom drift. `sizes` is set well above the
              rendered circle so the object-cover crop is always cut from a
              full-resolution file (no upscaling blur on Retina screens),
              and quality 95 keeps fine lines and text crisp. */}
          <Image
            src={ukText(art.src)}
            alt=""
            fill
            sizes="(min-width: 1280px) 64rem, 48rem"
            quality={95}
            className={`hero-image-drift object-cover ${art.focus} ${art.grade}`}
            preload={preload}
          />
          {/* brand tint — soft-light keeps the artwork's own contrast and
              detail while nudging its colours toward indigo/blue (a
              `color` blend flattened the image into one muddy hue) */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#3100FF]/40 via-[#684DFF]/15 to-[#287BFF]/30 mix-blend-soft-light" />
          {/* yellow bloom on the subject + a soft brand glow */}
          <div className={`absolute inset-0 mix-blend-screen ${art.bloom}`} />
          {/* faint glass glint on the top-left edge only */}
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.07)_0%,transparent_28%)]" />
          {/* thin inner vignette so the edge meets the rim cleanly */}
          <div className="absolute inset-0 rounded-full shadow-[inset_0_0_36px_8px_rgba(7,5,17,0.55)]" />
        </div>
      </div>

      {/* floating glass stat chips — tie the artwork to the page's message */}
      <div className="glass absolute -left-10 top-[18%] hidden items-center xl:flex gap-2.5 rounded-2xl px-3.5 py-2.5 shadow-float xl:-left-14">
        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-[#3100FF] to-[#684DFF] font-heading text-sm font-bold text-white">
          {ukText(art.stat.value)}
        </span>
        <span className="flex flex-col leading-tight">
          <span className="text-xs font-bold text-uk-heading">{ukText(art.stat.label)}</span>
          <span className="text-[0.65rem] text-uk-muted">{ukText(art.stat.sub)}</span>
        </span>
      </div>
      <div className="glass absolute -right-4 bottom-[12%] hidden items-center xl:flex gap-2.5 rounded-2xl px-3.5 py-2.5 shadow-float xl:-right-8">
        <span className="relative flex h-2.5 w-2.5" aria-hidden>
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-uk-yellow/70" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-uk-yellow shadow-glow-yellow" />
        </span>
        <span className="flex flex-col leading-tight">
          <span className="text-xs font-bold text-uk-heading">{ukText(art.badge.label)}</span>
          <span className="text-[0.65rem] text-uk-muted">{ukText(art.badge.sub)}</span>
        </span>
      </div>
    </div>
  );
}

/* ── Services: modern AI core — synapse rings feeding the neural core ─── */
function NeuralCanvas() {
  return (
    <div className={CANVAS} aria-hidden>
      {/* ambient colour wash — blue + violet identity */}
      <div className="absolute left-[4%] top-[6%] h-64 w-64 rounded-full bg-uk-blue/20 blur-[110px] dark:bg-uk-blue/30" />
      <div className="absolute bottom-[4%] right-[6%] h-56 w-56 rounded-full bg-[#287BFF]/15 blur-[110px] dark:bg-[#287BFF]/25" />

      <svg viewBox="0 0 400 400" className="absolute inset-0 h-full w-full">
        <defs>
          <linearGradient id="nFlowL" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#2400C7" />
            <stop offset="55%" stopColor="#3100FF" />
            <stop offset="100%" stopColor="#fff500" />
          </linearGradient>
          <linearGradient id="nFlowD" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#fff500" />
            <stop offset="55%" stopColor="#684DFF" />
            <stop offset="100%" stopColor="#287BFF" />
          </linearGradient>
          <radialGradient id="nFieldL" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0%" stopColor="#3100FF" stopOpacity="0.10" />
            <stop offset="70%" stopColor="#287BFF" stopOpacity="0.05" />
            <stop offset="100%" stopColor="#287BFF" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="nFieldD" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0%" stopColor="#684DFF" stopOpacity="0.16" />
            <stop offset="70%" stopColor="#287BFF" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#287BFF" stopOpacity="0" />
          </radialGradient>
          <filter id="nGlow" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="2.6" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* soft inference field behind the whole network */}
        <circle cx="200" cy="200" r="176" fill="url(#nFieldL)" className="dark:hidden" />
        <circle cx="200" cy="200" r="176" fill="url(#nFieldD)" className="hidden dark:block" />

        {/* concentric inference rings — the "thinking" radii */}
        <circle cx="200" cy="200" r="158" fill="none" stroke="currentColor" strokeWidth="1.1" strokeDasharray="2 10" className="text-uk-blue/35 dark:text-uk-blue/25" />
        <circle cx="200" cy="200" r="112" fill="none" stroke="currentColor" strokeWidth="1.2" strokeDasharray="16 9" className="text-[#287BFF]/40 dark:text-[#8A70FF]/30" />

        {/* synapse links — input layer → hidden layer → core → outputs */}
        <g fill="none" stroke="currentColor" strokeWidth="1.1" className="text-uk-blue/28 dark:text-uk-blue/18">
          <path d="M200 64 C200 92 200 118 200 138" />
          <path d="M71 120 C88 120 104 121 110 121" />
          <path d="M71 288 C88 288 104 287 110 287" />
          <path d="M70 196 C90 178 106 152 112 132" />
          <path d="M70 212 C90 230 106 256 112 276" />
          <path d="M234 190 C248 178 256 166 261 152" />
          <path d="M234 210 C248 222 256 234 261 248" />
          <path d="M200 358 C200 310 200 280 200 262" />
        </g>
        {/* glowing neural data streams — inner ring into the core, and
            generated tokens out to the output chips */}
        <g fill="none" stroke="url(#nFlowL)" strokeWidth="2.2" filter="url(#nGlow)" className="flow-dash dark:hidden">
          <path d="M279 121 C258 138 246 150 236 166" />
          <path d="M121 121 C142 138 154 150 164 166" />
          <path d="M121 279 C142 262 154 250 164 234" />
          <path d="M279 279 C258 262 246 250 236 234" />
          <path d="M200 64 C200 96 200 120 200 142" />
          <path d="M200 358 C200 304 200 280 200 258" />
          <path d="M234 190 C248 178 256 166 261 152" />
          <path d="M234 210 C248 222 256 234 261 248" />
        </g>
        <g fill="none" stroke="url(#nFlowD)" strokeWidth="1.8" filter="url(#nGlow)" className="flow-dash hidden dark:block">
          <path d="M279 121 C258 138 246 150 236 166" />
          <path d="M121 121 C142 138 154 150 164 166" />
          <path d="M121 279 C142 262 154 250 164 234" />
          <path d="M279 279 C258 262 246 250 236 234" />
          <path d="M200 64 C200 96 200 120 200 142" />
          <path d="M200 358 C200 304 200 280 200 258" />
          <path d="M234 190 C248 178 256 166 261 152" />
          <path d="M234 210 C248 222 256 234 261 248" />
        </g>

        {/* inner-ring nodes (hidden layer) — violet */}
        <g className="fill-uk-blue/15 dark:fill-uk-blue/25">
          <circle cx="279" cy="121" r="11" />
          <circle cx="121" cy="121" r="11" />
          <circle cx="121" cy="279" r="11" />
          <circle cx="279" cy="279" r="11" />
        </g>
        <g className="fill-[#287BFF]/75 dark:fill-[#8A70FF]/60">
          <circle cx="279" cy="121" r="4.5" />
          <circle cx="121" cy="121" r="4.5" />
          <circle cx="121" cy="279" r="4.5" />
          <circle cx="279" cy="279" r="4.5" />
        </g>
        {/* outer-ring nodes (input layer) — blue */}
        <g className="fill-uk-blue/15 dark:fill-uk-blue/25">
          <circle cx="200" cy="64" r="12" />
          <circle cx="200" cy="358" r="12" />
          <circle cx="60" cy="120" r="12" />
          <circle cx="60" cy="204" r="12" />
          <circle cx="60" cy="288" r="12" />
        </g>
        <g className="fill-uk-blue/75 dark:fill-uk-blue/55">
          <circle cx="200" cy="64" r="5" />
          <circle cx="200" cy="358" r="5" />
          <circle cx="60" cy="120" r="5" />
          <circle cx="60" cy="204" r="5" />
          <circle cx="60" cy="288" r="5" />
        </g>
        {/* gold activation nodes between the rings */}
        <g className="fill-[#fff500]/90 dark:fill-uk-yellow/75">
          <circle cx="160" cy="160" r="3" />
          <circle cx="244" cy="240" r="3" />
          <circle cx="245" cy="158" r="3" />
        </g>

        {/* generated output tokens streaming out of the core */}
        <g className="dark:hidden">
          <rect x="250" y="134" width="46" height="20" rx="10" className="fill-white/70 stroke-[#287BFF]/45" strokeWidth="1.2" />
          <rect x="250" y="246" width="46" height="20" rx="10" className="fill-white/70 stroke-uk-blue/40" strokeWidth="1.2" />
        </g>
        <g className="hidden dark:block">
          <rect x="250" y="134" width="46" height="20" rx="10" className="fill-uk-card/70 stroke-[#8A70FF]/35" strokeWidth="1.2" />
          <rect x="250" y="246" width="46" height="20" rx="10" className="fill-uk-card/70 stroke-uk-blue/30" strokeWidth="1.2" />
        </g>
        <g strokeLinecap="round">
          <line x1="259" y1="144" x2="287" y2="144" stroke="currentColor" strokeWidth="3" className="text-[#287BFF]/50 dark:text-[#8A70FF]/35" />
          <line x1="259" y1="256" x2="283" y2="256" stroke="currentColor" strokeWidth="3" className="text-uk-blue/45 dark:text-uk-blue/30" />
        </g>

        {/* sparkles — generation marks */}
        <g className="fill-[#fff500]/85 dark:fill-uk-yellow/70">
          <Sparkle x={150} y={105} size={7} className="fill-[#fff500]/85 dark:fill-uk-yellow/70" />
          <Sparkle x={262} y={302} size={6} className="fill-[#fff500]/85 dark:fill-uk-yellow/70" />
        </g>
        <Sparkle x={112} y={222} size={5} className="fill-[#287BFF]/70 dark:fill-[#8A70FF]/60" />

        {/* travelling signals — prompts streaming into the core */}
        <circle r="7" className="ncortex-a fill-[#287BFF]/20 dark:fill-uk-yellow/25" />
        <circle r="2.5" className="ncortex-a fill-[#287BFF] dark:fill-uk-yellow" />
        <circle r="7" className="ncortex-b fill-uk-blue/20 dark:fill-[#684DFF]/25" />
        <circle r="2.5" className="ncortex-b fill-uk-blue dark:fill-[#684DFF]" />
      </svg>

      <span className="node-pulse absolute left-[50%] top-[16%] h-2.5 w-2.5 rounded-full bg-uk-blue" />
      <span className="node-pulse absolute left-[70%] top-[69.5%] h-2 w-2 rounded-full bg-[#fff500] dark:bg-uk-yellow" />

      {/* single slow orbit sweeping the whole network */}
      <div className="hero-orbit absolute left-1/2 top-1/2 h-[23rem] w-[23rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-uk-blue/30 dark:border-uk-blue/20 [animation-duration:40s]">
        <span className="absolute left-1/2 top-0 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-uk-yellow shadow-[0_0_16px_rgba(255, 245, 0,0.7)]" />
      </div>

      <PlusMark className="left-[8%] top-[14%] text-uk-blue/35 dark:text-uk-blue/25" />
      <PlusMark className="bottom-[10%] right-[10%] text-[#287BFF]/40 dark:text-[#8A70FF]/30" />

      <CoreChip icon={BrainCircuit} />
    </div>
  );
}

/* ── Work: server stack — LED bars beaming into module tiles ──────────── */
function CircuitCanvas() {
  return (
    <div className={CANVAS} aria-hidden>
      {/* ambient colour wash — blue + cyan identity */}
      <div className="absolute left-[4%] top-[6%] h-64 w-64 rounded-full bg-uk-blue/20 blur-[110px] dark:bg-uk-blue/30" />
      <div className="absolute bottom-[4%] right-[6%] h-56 w-56 rounded-full bg-[#fff500]/15 blur-[110px] dark:bg-[#fff500]/25" />

      <svg viewBox="0 0 400 400" className="absolute inset-0 h-full w-full">
        <defs>
          <linearGradient id="wBeamL" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#2400C7" />
            <stop offset="55%" stopColor="#3100FF" />
            <stop offset="100%" stopColor="#fff500" />
          </linearGradient>
          <linearGradient id="wBeamD" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#fff500" />
            <stop offset="55%" stopColor="#684DFF" />
            <stop offset="100%" stopColor="#287BFF" />
          </linearGradient>
          <linearGradient id="wTileL" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fff500" stopOpacity="0.14" />
            <stop offset="100%" stopColor="#3100FF" stopOpacity="0.04" />
          </linearGradient>
          <linearGradient id="wTileD" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fff500" stopOpacity="0.20" />
            <stop offset="100%" stopColor="#3100FF" stopOpacity="0.06" />
          </linearGradient>
          <filter id="wGlow" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="2.6" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* server bars with LEDs and drive slots */}
        <g className="dark:hidden">
          <rect x="30" y="70" width="150" height="36" rx="10" fill="url(#wTileL)" stroke="currentColor" strokeWidth="1.4" className="text-uk-blue/45" />
          <rect x="30" y="120" width="150" height="36" rx="10" fill="url(#wTileL)" stroke="currentColor" strokeWidth="1.4" className="text-uk-blue/45" />
          <rect x="30" y="170" width="150" height="36" rx="10" fill="url(#wTileL)" stroke="currentColor" strokeWidth="1.4" className="text-uk-blue/45" />
        </g>
        <g className="hidden dark:block">
          <rect x="30" y="70" width="150" height="36" rx="10" fill="url(#wTileD)" stroke="currentColor" strokeWidth="1.4" className="text-uk-blue/30" />
          <rect x="30" y="120" width="150" height="36" rx="10" fill="url(#wTileD)" stroke="currentColor" strokeWidth="1.4" className="text-uk-blue/30" />
          <rect x="30" y="170" width="150" height="36" rx="10" fill="url(#wTileD)" stroke="currentColor" strokeWidth="1.4" className="text-uk-blue/30" />
        </g>
        <g>
          <circle cx="48" cy="88" r="3" className="fill-[#fff500]/90 dark:fill-uk-yellow/80" />
          <circle cx="60" cy="88" r="2.5" className="fill-uk-blue/70 dark:fill-uk-blue/55" />
          <line x1="130" y1="88" x2="166" y2="88" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" className="text-uk-blue/40 dark:text-uk-blue/25" />
          <circle cx="48" cy="138" r="3" className="fill-uk-blue/70 dark:fill-uk-blue/55" />
          <circle cx="60" cy="138" r="2.5" className="fill-[#fff500]/90 dark:fill-uk-yellow/80" />
          <line x1="130" y1="138" x2="166" y2="138" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" className="text-uk-blue/40 dark:text-uk-blue/25" />
          <circle cx="48" cy="188" r="3" className="fill-uk-blue/70 dark:fill-uk-blue/55" />
          <circle cx="60" cy="188" r="2.5" className="fill-uk-blue/70 dark:fill-uk-blue/55" />
          <line x1="130" y1="188" x2="166" y2="188" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" className="text-uk-blue/40 dark:text-uk-blue/25" />
        </g>

        {/* pipeline beams — deploys flowing from the rack to build & prod */}
        <g stroke="url(#wBeamL)" strokeWidth="2.2" fill="none" filter="url(#wGlow)" className="flow-dash dark:hidden">
          <path d="M180 88 C210 88 226 98 238 110" />
          <path d="M180 138 C214 138 228 160 236 186" />
          <path d="M180 188 C212 188 226 200 234 214" />
        </g>
        <g stroke="url(#wBeamD)" strokeWidth="1.8" fill="none" filter="url(#wGlow)" className="flow-dash hidden dark:block">
          <path d="M180 88 C210 88 226 98 238 110" />
          <path d="M180 138 C214 138 228 160 236 186" />
          <path d="M180 188 C212 188 226 200 234 214" />
        </g>

        {/* build stage — compile & package */}
        <g className="dark:hidden">
          <rect x="240" y="84" width="56" height="56" rx="14" fill="url(#wTileL)" stroke="currentColor" strokeWidth="1.4" className="text-[#fff500]/50" />
        </g>
        <g className="hidden dark:block">
          <rect x="240" y="84" width="56" height="56" rx="14" fill="url(#wTileD)" stroke="currentColor" strokeWidth="1.4" className="text-[#fff500]/40" />
        </g>
        <g strokeLinecap="round">
          <line x1="252" y1="106" x2="284" y2="106" stroke="currentColor" strokeWidth="3" className="text-uk-blue/40 dark:text-uk-blue/30" />
          <line x1="252" y1="118" x2="272" y2="118" stroke="currentColor" strokeWidth="3" className="text-uk-blue/25 dark:text-uk-blue/20" />
        </g>
        {/* shipped check badge on the build stage */}
        <circle cx="236" cy="140" r="10" className="fill-[#fff500] dark:fill-uk-yellow" />
        <path d="M231 140 l3.5 3.5 l7 -7" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="text-uk-surface" />
        {/* build → live results link */}
        <path d="M268 140 V186" fill="none" strokeWidth="1.2" strokeDasharray="3 5" stroke="currentColor" className="text-uk-blue/40 dark:text-uk-blue/28" />
        <polygon points="268,190 263,180 273,180" className="fill-uk-blue/70 dark:fill-uk-blue/55" />

        {/* live results monitor — the measured outcome */}
        <g className="dark:hidden">
          <rect x="232" y="190" width="64" height="84" rx="12" fill="url(#wTileL)" stroke="currentColor" strokeWidth="1.4" className="text-uk-blue/45" />
        </g>
        <g className="hidden dark:block">
          <rect x="232" y="190" width="64" height="84" rx="12" fill="url(#wTileD)" stroke="currentColor" strokeWidth="1.4" className="text-uk-blue/30" />
        </g>
        <g strokeLinecap="round">
          <line x1="244" y1="206" x2="272" y2="206" stroke="currentColor" strokeWidth="3" className="text-uk-blue/40 dark:text-uk-blue/30" />
        </g>
        <circle cx="284" cy="204" r="3" className="fill-[#fff500]/90 dark:fill-uk-yellow/75" />
        <g>
          <rect x="244" y="240" width="8" height="24" rx="2" className="fill-uk-blue/50 dark:fill-uk-blue/40" />
          <rect x="256" y="230" width="8" height="34" rx="2" className="fill-[#fff500]/55 dark:fill-[#fff500]/45" />
          <rect x="268" y="220" width="8" height="44" rx="2" className="fill-[#fff500]/85 dark:fill-uk-yellow/70" />
          <line x1="244" y1="266" x2="284" y2="266" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" className="text-uk-blue/30 dark:text-uk-blue/22" />
        </g>

        {/* travelling deploy packet — a build shipping to production */}
        <circle r="7" className="wpipeline fill-uk-blue/20 dark:fill-uk-yellow/25" />
        <circle r="2.5" className="wpipeline fill-uk-blue dark:fill-uk-yellow" />

        {/* hex-nut accents */}
        <g fill="none" strokeWidth="1.4">
          <polygon points="262,48 270.7,53 270.7,63 262,68 253.3,63 253.3,53" className="stroke-[#fff500]/50 dark:stroke-[#fff500]/40" />
          <polygon points="214,256 220.9,260 220.9,268 214,272 207.1,268 207.1,260" className="stroke-[#fff500]/45 dark:stroke-[#fff500]/35" />
        </g>
      </svg>

      <span className="node-pulse absolute left-[70%] top-[51%] h-2.5 w-2.5 rounded-full bg-[#fff500] dark:bg-uk-yellow" />
      <span className="node-pulse absolute left-[45%] top-[50%] h-2 w-2 rounded-full bg-uk-blue" />

      <PlusMark className="left-[10%] top-[58%] text-uk-blue/35 dark:text-uk-blue/25" />
      <PlusMark className="bottom-[8%] left-[52%] text-[#fff500]/45 dark:text-[#fff500]/30" />

      <CoreChip icon={Server} />
    </div>
  );
}

/* ── Company: team constellation — members in orbit around the core,
      broadcasting to clients worldwide ──────────────────────────────────── */
function CompanyCanvas() {
  return (
    <div className={CANVAS} aria-hidden>
      {/* ambient colour wash — blue + gold identity */}
      <div className="absolute left-[4%] top-[6%] h-64 w-64 rounded-full bg-uk-blue/20 blur-[110px] dark:bg-uk-blue/30" />
      <div className="absolute bottom-[4%] right-[6%] h-56 w-56 rounded-full bg-uk-yellow/15 blur-[110px] dark:bg-uk-yellow/20" />

      <svg viewBox="0 0 400 400" className="absolute inset-0 h-full w-full">
        <defs>
          <linearGradient id="cFlowL" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#2400C7" />
            <stop offset="55%" stopColor="#3100FF" />
            <stop offset="100%" stopColor="#fff500" />
          </linearGradient>
          <linearGradient id="cFlowD" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#fff500" />
            <stop offset="55%" stopColor="#684DFF" />
            <stop offset="100%" stopColor="#fff500" />
          </linearGradient>
          <linearGradient id="cCoreL" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fff500" stopOpacity="0.14" />
            <stop offset="100%" stopColor="#3100FF" stopOpacity="0.03" />
          </linearGradient>
          <linearGradient id="cCoreD" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fff500" stopOpacity="0.16" />
            <stop offset="100%" stopColor="#684DFF" stopOpacity="0.04" />
          </linearGradient>
          <filter id="cGlow" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="2.6" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* soft brand halo behind the core */}
        <circle cx="200" cy="200" r="72" fill="url(#cCoreL)" className="dark:hidden" />
        <circle cx="200" cy="200" r="72" fill="url(#cCoreD)" className="hidden dark:block" />

        {/* the orbit ellipse the team sits on */}
        <ellipse cx="200" cy="200" rx="88" ry="116" fill="none" strokeWidth="1.2" strokeDasharray="3 9" className="stroke-uk-blue/35 dark:stroke-uk-blue/25" />

        {/* broadcast beams — the team reaching outward */}
        <g fill="none" stroke="url(#cFlowL)" strokeWidth="2.2" filter="url(#cGlow)" className="flow-dash dark:hidden">
          <path d="M228 176 C248 158 260 136 268 118" />
          <path d="M228 224 C248 242 258 258 262 272" />
          <path d="M172 176 C158 154 144 132 130 116" />
        </g>
        <g fill="none" stroke="url(#cFlowD)" strokeWidth="1.8" filter="url(#cGlow)" className="flow-dash hidden dark:block">
          <path d="M228 176 C248 158 260 136 268 118" />
          <path d="M228 224 C248 242 258 258 262 272" />
          <path d="M172 176 C158 154 144 132 130 116" />
        </g>

        {/* globe — worldwide delivery */}
        <g fill="none" strokeWidth="1.3" className="stroke-uk-blue/45 dark:stroke-uk-blue/30">
          <circle cx="272" cy="96" r="20" />
          <ellipse cx="272" cy="96" rx="9" ry="20" />
          <line x1="252" y1="96" x2="292" y2="96" />
          <path d="M256 84 C262 80 282 80 288 84" />
          <path d="M256 108 C262 112 282 112 288 108" />
        </g>
        <circle cx="279" cy="88" r="3" className="fill-[#fff500]/90 dark:fill-uk-yellow/75" />

        {/* location pin — where the team ships from */}
        <path d="M264 268 c-7.2 0 -13 5.8 -13 13 c0 9.8 13 21 13 21 c0 0 13 -11.2 13 -21 c0 -7.2 -5.8 -13 -13 -13 Z" fill="none" strokeWidth="1.4" strokeLinejoin="round" className="stroke-uk-blue/50 dark:stroke-uk-blue/35" />
        <circle cx="264" cy="281" r="4" className="fill-[#fff500]/85 dark:fill-uk-yellow/70" />

        {/* HQ block — the office the team builds from */}
        <g className="dark:hidden">
          <rect x="104" y="82" width="26" height="32" rx="3" className="fill-white/60 stroke-uk-blue/45" strokeWidth="1.3" />
        </g>
        <g className="hidden dark:block">
          <rect x="104" y="82" width="26" height="32" rx="3" className="fill-uk-card/60 stroke-uk-blue/35" strokeWidth="1.3" />
        </g>
        <g className="fill-uk-blue/55 dark:fill-uk-blue/40">
          <circle cx="111" cy="91" r="2" />
          <circle cx="123" cy="91" r="2" />
          <circle cx="111" cy="101" r="2" />
          <circle cx="123" cy="101" r="2" />
        </g>
        <rect x="114" y="106" width="8" height="8" rx="1" className="fill-uk-blue/30 dark:fill-uk-blue/22" />
        <line x1="117" y1="82" x2="117" y2="76" stroke="currentColor" strokeWidth="1.2" className="text-uk-blue/40 dark:text-uk-blue/28" />
        <circle cx="117" cy="74" r="2" className="fill-[#fff500]/85 dark:fill-uk-yellow/70" />

        {/* team members seated on the orbit */}
        <g className="fill-uk-blue/12 dark:fill-uk-blue/18">
          <circle cx="200" cy="84" r="17" />
          <circle cx="288" cy="200" r="16" />
          <circle cx="112" cy="200" r="16" />
          <circle cx="128" cy="266" r="16" />
          <circle cx="200" cy="316" r="17" />
        </g>
        <g fill="none" strokeWidth="1.4" className="stroke-[#fff500]/70 dark:stroke-uk-yellow/55">
          <circle cx="200" cy="84" r="13" />
          <circle cx="288" cy="200" r="12" />
        </g>
        <g fill="none" strokeWidth="1.4" className="stroke-uk-blue/45 dark:stroke-uk-blue/32">
          <circle cx="112" cy="200" r="12" />
          <circle cx="128" cy="266" r="12" />
          <circle cx="200" cy="316" r="13" />
        </g>
        {/* head + shoulders glyphs inside each member */}
        <g className="fill-uk-blue/75 dark:fill-uk-blue/55">
          <circle cx="200" cy="80" r="3.5" />
          <circle cx="288" cy="196" r="3.5" />
          <circle cx="112" cy="196" r="3.5" />
          <circle cx="128" cy="262" r="3.5" />
          <circle cx="200" cy="312" r="3.5" />
          <path d="M194 92 a6 6 0 0 1 12 0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-uk-blue/60 dark:text-uk-blue/45" />
          <path d="M282 208 a6 6 0 0 1 12 0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-uk-blue/60 dark:text-uk-blue/45" />
          <path d="M106 208 a6 6 0 0 1 12 0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-uk-blue/60 dark:text-uk-blue/45" />
          <path d="M122 274 a6 6 0 0 1 12 0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-uk-blue/60 dark:text-uk-blue/45" />
          <path d="M194 324 a6 6 0 0 1 12 0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-uk-blue/60 dark:text-uk-blue/45" />
        </g>

        {/* travelling satellite — a project circling the team */}
        <circle r="8" className="orgbit-travel fill-uk-blue/20 dark:fill-uk-yellow/25" />
        <circle r="3" className="orgbit-travel fill-uk-blue dark:fill-uk-yellow" />

        {/* sparkles — milestones along the journey */}
        <Sparkle x={156} y={134} size={6} className="fill-[#fff500]/85 dark:fill-uk-yellow/70" />
        <Sparkle x={250} y={244} size={5} className="fill-[#fff500]/85 dark:fill-uk-yellow/70" />
      </svg>

      <span className="node-pulse absolute left-[50%] top-[21%] h-2.5 w-2.5 rounded-full bg-[#fff500] dark:bg-uk-yellow" />
      <span className="node-pulse absolute left-[72%] top-[50%] h-2 w-2 rounded-full bg-uk-blue" />

      <PlusMark className="left-[8%] top-[22%] text-uk-blue/35 dark:text-uk-blue/25" />
      <PlusMark className="bottom-[10%] right-[28%] text-uk-yellow/50 dark:text-uk-yellow/35" />

      <CoreChip icon={Users} />
    </div>
  );
}

/* ── Insights: story stream — article cards + sweeping trend arrow ────── */
function StreamCanvas() {
  return (
    <div className={CANVAS} aria-hidden>
      {/* ambient colour wash — blue + violet identity */}
      <div className="absolute left-[4%] top-[6%] h-64 w-64 rounded-full bg-uk-blue/20 blur-[110px] dark:bg-uk-blue/30" />
      <div className="absolute bottom-[4%] right-[6%] h-56 w-56 rounded-full bg-[#287BFF]/15 blur-[110px] dark:bg-[#287BFF]/25" />

      <svg viewBox="0 0 400 400" className="absolute inset-0 h-full w-full">
        <defs>
          <linearGradient id="iArrowL" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#2400C7" />
            <stop offset="55%" stopColor="#3100FF" />
            <stop offset="100%" stopColor="#287BFF" />
          </linearGradient>
          <linearGradient id="iArrowD" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#fff500" />
            <stop offset="55%" stopColor="#684DFF" />
            <stop offset="100%" stopColor="#287BFF" />
          </linearGradient>
          <linearGradient id="iAreaL" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#3100FF" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#287BFF" stopOpacity="0.07" />
          </linearGradient>
          <linearGradient id="iAreaD" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#684DFF" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#287BFF" stopOpacity="0.09" />
          </linearGradient>
          <filter id="iGlow" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="2.6" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* soft area under the trend arrow */}
        <path
          d="M40 330 L130 290 L200 300 L280 210 L340 230 L368 148 L368 340 L40 340 Z"
          fill="url(#iAreaL)"
          className="dark:hidden"
        />
        <path
          d="M40 330 L130 290 L200 300 L280 210 L340 230 L368 148 L368 340 L40 340 Z"
          fill="url(#iAreaD)"
          className="hidden dark:block"
        />

        {/* floating article cards */}
        <g transform="rotate(-3 125 142)" className="dark:hidden">
          <rect x="60" y="100" width="130" height="84" rx="12" className="fill-white/60 stroke-uk-blue/40" strokeWidth="1.4" />
        </g>
        <g transform="rotate(-3 125 142)" className="hidden dark:block">
          <rect x="60" y="100" width="130" height="84" rx="12" className="fill-uk-card/60 stroke-uk-blue/30" strokeWidth="1.4" />
        </g>
        <g transform="rotate(-3 125 142)" strokeLinecap="round">
          <line x1="78" y1="124" x2="160" y2="124" stroke="currentColor" strokeWidth="6" className="text-uk-blue/35 dark:text-uk-blue/25" />
          <line x1="78" y1="144" x2="152" y2="144" stroke="currentColor" strokeWidth="4" className="text-uk-blue/20 dark:text-uk-blue/15" />
          <line x1="78" y1="158" x2="132" y2="158" stroke="currentColor" strokeWidth="4" className="text-uk-blue/20 dark:text-uk-blue/15" />
          <circle cx="172" cy="158" r="5" className="fill-[#fff500]/85 dark:fill-uk-yellow/70" />
        </g>

        <g transform="rotate(3 290 188)" className="dark:hidden">
          <rect x="230" y="176" width="120" height="72" rx="12" className="fill-white/55 stroke-[#287BFF]/45" strokeWidth="1.4" />
        </g>
        <g transform="rotate(3 290 188)" className="hidden dark:block">
          <rect x="230" y="176" width="120" height="72" rx="12" className="fill-uk-card/60 stroke-[#8A70FF]/35" strokeWidth="1.4" />
        </g>
        <g transform="rotate(3 290 188)" strokeLinecap="round">
          <line x1="246" y1="198" x2="330" y2="198" stroke="currentColor" strokeWidth="6" className="text-[#287BFF]/40 dark:text-[#8A70FF]/30" />
          <line x1="246" y1="216" x2="306" y2="216" stroke="currentColor" strokeWidth="4" className="text-uk-blue/20 dark:text-uk-blue/15" />
          <rect x="246" y="228" width="44" height="12" rx="6" className="fill-[#287BFF]/20 dark:fill-[#8A70FF]/25" />
        </g>

        {/* mini bar chart card */}
        <g transform="rotate(-2 180 300)" className="dark:hidden">
          <rect x="110" y="262" width="140" height="78" rx="12" className="fill-white/60 stroke-uk-blue/40" strokeWidth="1.4" />
        </g>
        <g transform="rotate(-2 180 300)" className="hidden dark:block">
          <rect x="110" y="262" width="140" height="78" rx="12" className="fill-uk-card/60 stroke-uk-blue/30" strokeWidth="1.4" />
        </g>
        <g transform="rotate(-2 180 300)">
          <rect x="130" y="306" width="12" height="22" rx="3" className="fill-uk-blue/55 dark:fill-uk-blue/45" />
          <rect x="150" y="294" width="12" height="34" rx="3" className="fill-[#287BFF]/55 dark:fill-[#8A70FF]/45" />
          <rect x="170" y="284" width="12" height="44" rx="3" className="fill-[#fff500]/85 dark:fill-uk-yellow/70" />
          <line x1="196" y1="328" x2="232" y2="328" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="text-uk-blue/25 dark:text-uk-blue/20" />
        </g>

        {/* sweeping trend arrow (above the cards) */}
        <polyline
          points="40,330 130,290 200,300 280,210 340,230 368,148"
          fill="none"
          stroke="url(#iArrowL)"
          strokeWidth="3"
          strokeLinejoin="round"
          strokeLinecap="round"
          filter="url(#iGlow)"
          className="dark:hidden"
        />
        <polyline
          points="40,330 130,290 200,300 280,210 340,230 368,148"
          fill="none"
          stroke="url(#iArrowD)"
          strokeWidth="2.2"
          strokeLinejoin="round"
          strokeLinecap="round"
          filter="url(#iGlow)"
          className="hidden dark:block"
        />
        <polygon points="368,148 369.8,164.5 356.6,159.9" className="fill-[#287BFF]/85 dark:fill-[#8A70FF]/80" />
        {/* data points with halos on the arrow */}
        <g className="fill-uk-blue/15 dark:fill-uk-blue/25">
          <circle cx="130" cy="290" r="8" />
          <circle cx="280" cy="210" r="8" />
        </g>
        <g className="fill-uk-blue/75 dark:fill-uk-blue/55">
          <circle cx="130" cy="290" r="3" />
          <circle cx="280" cy="210" r="3" />
        </g>
        <g className="fill-[#fff500]/20 dark:fill-uk-yellow/20">
          <circle cx="200" cy="300" r="8" />
        </g>
        <g className="fill-[#fff500]/90 dark:fill-uk-yellow/80">
          <circle cx="200" cy="300" r="3" />
        </g>

        {/* travelling data dot — rides the trend path from lower-left to upper-right */}
        <circle r="9" className="insight-travel fill-uk-blue/20 dark:fill-uk-yellow/25" />
        <circle r="3.5" className="insight-travel fill-uk-blue dark:fill-uk-yellow" />
      </svg>

      {/* trend endpoint pulse */}
      <span className="node-pulse absolute left-[92%] top-[37%] h-2.5 w-2.5 rounded-full bg-[#287BFF]" />
      <span className="node-pulse absolute left-[50%] top-[75%] h-2 w-2 rounded-full bg-[#fff500] dark:bg-uk-yellow" />

      <PlusMark className="left-[10%] top-[20%] text-uk-blue/35 dark:text-uk-blue/25" />
      <PlusMark className="bottom-[10%] right-[12%] text-[#287BFF]/40 dark:text-[#8A70FF]/30" />

      <CoreChip icon={Newspaper} />
    </div>
  );
}

/* ── Solutions: system blueprint — module tiles assembling into the core ─ */
function SolutionsCanvas() {
  return (
    <div className={CANVAS} aria-hidden>
      {/* ambient colour wash — blue + emerald identity */}
      <div className="absolute left-[4%] top-[6%] h-64 w-64 rounded-full bg-uk-blue/20 blur-[110px] dark:bg-uk-blue/30" />
      <div className="absolute bottom-[4%] right-[6%] h-56 w-56 rounded-full bg-[#287BFF]/15 blur-[110px] dark:bg-[#fff500]/20" />

      <svg viewBox="0 0 400 400" className="absolute inset-0 h-full w-full">
        <defs>
          <linearGradient id="sFlowL" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#2400C7" />
            <stop offset="55%" stopColor="#3100FF" />
            <stop offset="100%" stopColor="#287BFF" />
          </linearGradient>
          <linearGradient id="sFlowD" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#fff500" />
            <stop offset="55%" stopColor="#684DFF" />
            <stop offset="100%" stopColor="#fff500" />
          </linearGradient>
          <linearGradient id="sTileL" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#287BFF" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#3100FF" stopOpacity="0.04" />
          </linearGradient>
          <linearGradient id="sTileD" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fff500" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#3100FF" stopOpacity="0.06" />
          </linearGradient>
          <filter id="sGlow" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="2.6" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* segmented assembly ring — modules snapping into place */}
        <g className="assem-ring" style={{ transformOrigin: "200px 200px" }}>
          <circle cx="200" cy="200" r="132" fill="none" strokeWidth="1.5" strokeDasharray="70 344.7" className="stroke-[#287BFF]/40 dark:stroke-[#fff500]/28" />
          <circle cx="200" cy="200" r="144" fill="none" strokeWidth="1.2" strokeDasharray="50 402.4" className="stroke-uk-blue/30 dark:stroke-uk-blue/22" />
        </g>

        {/* module tiles — the building blocks of a solution */}
        <g className="dark:hidden">
          <rect x="34" y="58" width="128" height="46" rx="10" fill="url(#sTileL)" stroke="currentColor" strokeWidth="1.4" className="text-uk-blue/45" />
          <rect x="34" y="296" width="128" height="46" rx="10" fill="url(#sTileL)" stroke="currentColor" strokeWidth="1.4" className="text-uk-blue/45" />
          <rect x="228" y="84" width="64" height="52" rx="12" fill="url(#sTileL)" stroke="currentColor" strokeWidth="1.4" className="text-[#287BFF]/55" />
          <rect x="228" y="264" width="64" height="52" rx="12" fill="url(#sTileL)" stroke="currentColor" strokeWidth="1.4" className="text-uk-blue/45" />
        </g>
        <g className="hidden dark:block">
          <rect x="34" y="58" width="128" height="46" rx="10" fill="url(#sTileD)" stroke="currentColor" strokeWidth="1.4" className="text-uk-blue/30" />
          <rect x="34" y="296" width="128" height="46" rx="10" fill="url(#sTileD)" stroke="currentColor" strokeWidth="1.4" className="text-uk-blue/30" />
          <rect x="228" y="84" width="64" height="52" rx="12" fill="url(#sTileD)" stroke="currentColor" strokeWidth="1.4" className="text-[#fff500]/40" />
          <rect x="228" y="264" width="64" height="52" rx="12" fill="url(#sTileD)" stroke="currentColor" strokeWidth="1.4" className="text-uk-blue/30" />
        </g>
        {/* UI lines inside the tiles */}
        <g strokeLinecap="round">
          <line x1="50" y1="76" x2="118" y2="76" stroke="currentColor" strokeWidth="4" className="text-uk-blue/40 dark:text-uk-blue/30" />
          <line x1="50" y1="90" x2="98" y2="90" stroke="currentColor" strokeWidth="3" className="text-uk-blue/22 dark:text-uk-blue/16" />
          <line x1="50" y1="314" x2="118" y2="314" stroke="currentColor" strokeWidth="4" className="text-uk-blue/40 dark:text-uk-blue/30" />
          <line x1="50" y1="328" x2="98" y2="328" stroke="currentColor" strokeWidth="3" className="text-uk-blue/22 dark:text-uk-blue/16" />
          <line x1="244" y1="106" x2="278" y2="106" stroke="currentColor" strokeWidth="4" className="text-[#287BFF]/50 dark:text-[#fff500]/35" />
          <line x1="244" y1="120" x2="268" y2="120" stroke="currentColor" strokeWidth="3" className="text-uk-blue/22 dark:text-uk-blue/16" />
          <line x1="244" y1="286" x2="278" y2="286" stroke="currentColor" strokeWidth="4" className="text-uk-blue/40 dark:text-uk-blue/30" />
          <line x1="244" y1="300" x2="268" y2="300" stroke="currentColor" strokeWidth="3" className="text-uk-blue/22 dark:text-uk-blue/16" />
        </g>
        {/* assembled badge on the emerald tile */}
        <circle cx="288" cy="84" r="9" className="fill-[#287BFF] dark:fill-[#fff500]" />
        <path d="M283.5 84 l3 3 l6 -6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-uk-surface" />
        {/* snap brackets — modules locking into the assembly */}
        <g fill="none" strokeWidth="1.6" className="stroke-[#287BFF]/55 dark:stroke-[#fff500]/40">
          <path d="M240 84 H228 V96" />
          <path d="M280 84 H292 V96" />
          <path d="M228 124 V136 H240" />
          <path d="M292 124 V136 H280" />
        </g>
        <g fill="none" strokeWidth="1.6" className="stroke-uk-blue/45 dark:stroke-uk-blue/30">
          <path d="M240 264 H228 V276" />
          <path d="M280 264 H292 V276" />
          <path d="M228 304 V316 H240" />
          <path d="M292 304 V316 H280" />
        </g>
        {/* ready status dots on the left modules */}
        <circle cx="127" cy="76" r="2.5" className="fill-[#287BFF]/80 dark:fill-[#fff500]/65" />
        <circle cx="127" cy="314" r="2.5" className="fill-[#287BFF]/80 dark:fill-[#fff500]/65" />

        {/* flow connectors — modules assembling into the core */}
        <g fill="none" stroke="currentColor" strokeWidth="1.2" className="text-uk-blue/30 dark:text-uk-blue/20">
          <path d="M162 81 H206 V136" />
          <path d="M162 319 H206 V264" />
        </g>
        <g fill="none" stroke="url(#sFlowL)" strokeWidth="2.2" filter="url(#sGlow)" className="flow-dash dark:hidden">
          <path d="M228 110 C217 117 210 126 206 138" />
          <path d="M228 290 C217 283 210 274 206 262" />
          <path d="M206 136 C206 156 206 166 206 172" />
          <path d="M206 264 C206 244 206 234 206 228" />
        </g>
        <g fill="none" stroke="url(#sFlowD)" strokeWidth="1.8" filter="url(#sGlow)" className="flow-dash hidden dark:block">
          <path d="M228 110 C217 117 210 126 206 138" />
          <path d="M228 290 C217 283 210 274 206 262" />
          <path d="M206 136 C206 156 206 166 206 172" />
          <path d="M206 264 C206 244 206 234 206 228" />
        </g>
        {/* arrowheads where flows meet the core */}
        <polygon points="206,142 201,132 211,132" className="fill-uk-blue/70 dark:fill-uk-blue/55" />
        <polygon points="206,258 201,268 211,268" className="fill-uk-blue/70 dark:fill-uk-blue/55" />
        {/* via junctions on the elbow connectors */}
        <g className="fill-uk-blue/45 dark:fill-uk-blue/30">
          <circle cx="206" cy="81" r="3" />
          <circle cx="206" cy="319" r="3" />
        </g>

        {/* AI inference core — hex chip with a neural triad */}
        <g className="dark:hidden">
          <path d="M268 172 L289 184 L289 208 L268 220 L247 208 L247 184 Z" fill="none" stroke="#287BFF" strokeOpacity="0.55" strokeWidth="1.6" strokeLinejoin="round" />
          <g stroke="#287BFF" strokeOpacity="0.45" strokeWidth="1.6" strokeLinecap="round">
            <line x1="268" y1="166" x2="268" y2="172" />
            <line x1="295" y1="181" x2="289" y2="184" />
            <line x1="295" y1="211" x2="289" y2="208" />
            <line x1="268" y1="226" x2="268" y2="220" />
            <line x1="241" y1="211" x2="247" y2="208" />
            <line x1="241" y1="181" x2="247" y2="184" />
          </g>
        </g>
        <g className="hidden dark:block">
          <path d="M268 172 L289 184 L289 208 L268 220 L247 208 L247 184 Z" fill="none" stroke="#fff500" strokeOpacity="0.45" strokeWidth="1.6" strokeLinejoin="round" />
          <g stroke="#fff500" strokeOpacity="0.35" strokeWidth="1.6" strokeLinecap="round">
            <line x1="268" y1="166" x2="268" y2="172" />
            <line x1="295" y1="181" x2="289" y2="184" />
            <line x1="295" y1="211" x2="289" y2="208" />
            <line x1="268" y1="226" x2="268" y2="220" />
            <line x1="241" y1="211" x2="247" y2="208" />
            <line x1="241" y1="181" x2="247" y2="184" />
          </g>
        </g>
        {/* neural triad inside the chip */}
        <g stroke="currentColor" strokeWidth="1.2" className="text-[#287BFF]/55 dark:text-[#fff500]/45">
          <line x1="268" y1="189" x2="260" y2="203" />
          <line x1="268" y1="189" x2="276" y2="203" />
          <line x1="260" y1="203" x2="276" y2="203" />
        </g>
        <g className="fill-[#287BFF]/80 dark:fill-[#fff500]/65">
          <circle cx="268" cy="189" r="3" />
          <circle cx="260" cy="203" r="3" />
          <circle cx="276" cy="203" r="3" />
        </g>

        {/* integration chain — small nodes feeding the blueprint */}
        <g className="fill-uk-blue/70 dark:fill-uk-blue/55">
          <circle cx="118" cy="205" r="3.5" />
          <circle cx="140" cy="205" r="3.5" />
          <circle cx="162" cy="205" r="3.5" />
        </g>
        <g stroke="currentColor" strokeWidth="1.2" className="text-uk-blue/35 dark:text-uk-blue/22">
          <line x1="121" y1="205" x2="137" y2="205" />
          <line x1="143" y1="205" x2="159" y2="205" />
        </g>

        {/* travelling assembly sparks — modules snapping into the core */}
        <circle r="7" className="assem-a fill-[#287BFF]/20 dark:fill-[#fff500]/25" />
        <circle r="2.5" className="assem-a fill-[#287BFF] dark:fill-[#fff500]" />
        <circle r="7" className="assem-b fill-uk-blue/20 dark:fill-[#684DFF]/25" />
        <circle r="2.5" className="assem-b fill-uk-blue dark:fill-[#684DFF]" />
      </svg>

      <span className="node-pulse absolute left-[65%] top-[27%] h-2.5 w-2.5 rounded-full bg-[#287BFF] dark:bg-[#fff500]" />
      <span className="node-pulse absolute left-[40%] top-[50%] h-2 w-2 rounded-full bg-uk-blue" />

      <PlusMark className="left-[10%] top-[58%] text-uk-blue/35 dark:text-uk-blue/25" />
      <PlusMark className="bottom-[8%] right-[8%] text-[#287BFF]/45 dark:text-[#fff500]/30" />

      <CoreChip icon={Blocks} />
    </div>
  );
}

/* ── Hire: talent network — candidates with AI match-score arcs
      converging into the matching engine ─────────────────────────────── */
function HireCanvas() {
  return (
    <div className={CANVAS} aria-hidden>
      {/* ambient colour wash — blue + indigo identity */}
      <div className="absolute left-[4%] top-[6%] h-64 w-64 rounded-full bg-uk-blue/20 blur-[110px] dark:bg-uk-blue/30" />
      <div className="absolute bottom-[4%] right-[6%] h-56 w-56 rounded-full bg-[#684DFF]/15 blur-[110px] dark:bg-[#8A70FF]/22" />

      <svg viewBox="0 0 400 400" className="absolute inset-0 h-full w-full">
        <defs>
          <linearGradient id="hFlowL" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#2400C7" />
            <stop offset="55%" stopColor="#3100FF" />
            <stop offset="100%" stopColor="#684DFF" />
          </linearGradient>
          <linearGradient id="hFlowD" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#fff500" />
            <stop offset="55%" stopColor="#684DFF" />
            <stop offset="100%" stopColor="#8A70FF" />
          </linearGradient>
          <radialGradient id="hPoolL" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0%" stopColor="#3100FF" stopOpacity="0.10" />
            <stop offset="100%" stopColor="#684DFF" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="hPoolD" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0%" stopColor="#684DFF" stopOpacity="0.16" />
            <stop offset="100%" stopColor="#8A70FF" stopOpacity="0" />
          </radialGradient>
          <filter id="hGlow" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="2.6" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* soft talent-pool field */}
        <circle cx="200" cy="200" r="172" fill="url(#hPoolL)" className="dark:hidden" />
        <circle cx="200" cy="200" r="172" fill="url(#hPoolD)" className="hidden dark:block" />

        {/* the pool ring the candidates sit on */}
        <circle cx="200" cy="200" r="132" fill="none" stroke="currentColor" strokeWidth="1.2" strokeDasharray="3 9" className="text-uk-blue/35 dark:text-uk-blue/25" />

        {/* converging application paths into the core */}
        <g fill="none" stroke="currentColor" strokeWidth="1.1" className="text-uk-blue/28 dark:text-uk-blue/18">
          <path d="M290 110 C262 122 250 138 242 156" />
          <path d="M110 290 C138 278 150 262 158 244" />
          <path d="M200 332 C200 304 200 278 200 258" />
        </g>
        <g fill="none" stroke="url(#hFlowL)" strokeWidth="2.2" filter="url(#hGlow)" className="flow-dash dark:hidden">
          <path d="M110 110 C138 122 150 138 158 156" />
          <path d="M290 290 C262 278 250 262 242 244" />
          <path d="M200 68 C200 96 200 122 200 142" />
        </g>
        <g fill="none" stroke="url(#hFlowD)" strokeWidth="1.8" filter="url(#hGlow)" className="flow-dash hidden dark:block">
          <path d="M110 110 C138 122 150 138 158 156" />
          <path d="M290 290 C262 278 250 262 242 244" />
          <path d="M200 68 C200 96 200 122 200 142" />
        </g>

        {/* AI matching engine at the pool's heart */}
        <circle cx="200" cy="200" r="56" fill="none" strokeWidth="1.3" strokeDasharray="5 7" className="stroke-[#684DFF]/50 dark:stroke-[#8A70FF]/40" />
        <circle cx="200" cy="200" r="26" fill="none" strokeWidth="1.5" className="stroke-[#684DFF]/60 dark:stroke-[#8A70FF]/50" />
        <circle cx="200" cy="200" r="20" className="fill-[#684DFF]/10 dark:fill-[#8A70FF]/15" />
        {/* scanning sweep — the engine reviewing the pool */}
        <g className="radar-sweep" style={{ transformOrigin: "200px 200px" }}>
          <line x1="200" y1="200" x2="200" y2="148" stroke="url(#hFlowL)" strokeWidth="2" strokeLinecap="round" filter="url(#hGlow)" className="dark:hidden" />
          <line x1="200" y1="200" x2="200" y2="148" stroke="url(#hFlowD)" strokeWidth="2" strokeLinecap="round" filter="url(#hGlow)" className="hidden dark:block" />
        </g>
        {/* match spark */}
        <path d="M200 190 C202 197 203 198 210 200 C203 202 202 203 200 210 C198 203 197 202 190 200 C197 198 198 197 200 190 Z" className="fill-[#684DFF]/70 dark:fill-[#8A70FF]/60" />

        {/* match score on the leading candidate */}
        <g className="dark:hidden">
          <rect x="242" y="84" width="36" height="24" rx="6" className="fill-white/70 stroke-[#684DFF]/45" strokeWidth="1.2" />
        </g>
        <g className="hidden dark:block">
          <rect x="242" y="84" width="36" height="24" rx="6" className="fill-uk-card/70 stroke-[#8A70FF]/35" strokeWidth="1.2" />
        </g>
        <g>
          <rect x="248" y="94" width="5" height="8" rx="1.5" className="fill-uk-blue/55 dark:fill-uk-blue/45" />
          <rect x="256" y="90" width="5" height="12" rx="1.5" className="fill-[#684DFF]/60 dark:fill-[#8A70FF]/50" />
          <rect x="264" y="86" width="5" height="16" rx="1.5" className="fill-[#fff500]/85 dark:fill-uk-yellow/70" />
        </g>

        {/* candidate nodes — avatar rings on the pool */}
        <g fill="none" strokeWidth="1.3" className="stroke-uk-blue/35 dark:stroke-uk-blue/25">
          <circle cx="200" cy="68" r="13" />
          <circle cx="290" cy="290" r="12" />
          <circle cx="110" cy="290" r="12" />
          <circle cx="200" cy="332" r="13" />
        </g>
        <g fill="none" strokeWidth="1.3" className="stroke-[#684DFF]/45 dark:stroke-[#8A70FF]/35">
          <circle cx="290" cy="110" r="12" />
          <circle cx="110" cy="110" r="12" />
        </g>
        {/* inner person dots — head + shoulders glyphs */}
        <g className="fill-uk-blue/75 dark:fill-uk-blue/55">
          <circle cx="200" cy="64" r="3.5" />
          <circle cx="290" cy="286" r="3.5" />
          <circle cx="110" cy="286" r="3.5" />
          <circle cx="200" cy="328" r="3.5" />
          <path d="M194 76 a6 6 0 0 1 12 0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-uk-blue/60 dark:text-uk-blue/45" />
          <path d="M284 298 a6 6 0 0 1 12 0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-uk-blue/60 dark:text-uk-blue/45" />
          <path d="M104 298 a6 6 0 0 1 12 0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-uk-blue/60 dark:text-uk-blue/45" />
          <path d="M194 340 a6 6 0 0 1 12 0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-uk-blue/60 dark:text-uk-blue/45" />
        </g>
        <g className="fill-[#684DFF]/75 dark:fill-[#8A70FF]/60">
          <circle cx="290" cy="106" r="3.5" />
          <circle cx="110" cy="106" r="3.5" />
          <path d="M284 118 a6 6 0 0 1 12 0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-[#684DFF]/60 dark:text-[#8A70FF]/50" />
          <path d="M104 118 a6 6 0 0 1 12 0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-[#684DFF]/60 dark:text-[#8A70FF]/50" />
        </g>

        {/* AI match-score arcs on the leading candidates */}
        <g fill="none" strokeWidth="2" strokeLinecap="round" transform="rotate(-90 110 110)">
          <circle cx="110" cy="110" r="17" strokeDasharray="85 22" className="stroke-[#684DFF]/60 dark:stroke-[#8A70FF]/50" />
        </g>
        <g fill="none" strokeWidth="2" strokeLinecap="round" transform="rotate(-90 200 332)">
          <circle cx="200" cy="332" r="17" strokeDasharray="69 38" className="stroke-[#fff500]/80 dark:stroke-uk-yellow/70" />
        </g>

        {/* verified badge on one candidate */}
        <circle cx="122" cy="281" r="9" className="fill-[#fff500] dark:fill-uk-yellow" />
        <path d="M117.5 281 l3 3 l6 -6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-uk-heading-strong dark:text-uk-surface" />

        {/* skill-tag chips floating between candidates */}
        <g className="dark:hidden">
          <rect x="240" y="196" width="52" height="20" rx="10" className="fill-white/70 stroke-[#684DFF]/45" strokeWidth="1.2" />
          <rect x="64" y="184" width="52" height="20" rx="10" className="fill-white/70 stroke-uk-blue/40" strokeWidth="1.2" />
        </g>
        <g className="hidden dark:block">
          <rect x="240" y="196" width="52" height="20" rx="10" className="fill-uk-card/70 stroke-[#8A70FF]/35" strokeWidth="1.2" />
          <rect x="64" y="184" width="52" height="20" rx="10" className="fill-uk-card/70 stroke-uk-blue/30" strokeWidth="1.2" />
        </g>
        <g strokeLinecap="round">
          <line x1="249" y1="206" x2="281" y2="206" stroke="currentColor" strokeWidth="3" className="text-[#684DFF]/50 dark:text-[#8A70FF]/35" />
          <line x1="73" y1="194" x2="107" y2="194" stroke="currentColor" strokeWidth="3" className="text-uk-blue/45 dark:text-uk-blue/30" />
        </g>

        {/* gold connection nodes between candidates and the core */}
        <g className="fill-[#fff500]/90 dark:fill-uk-yellow/75">
          <circle cx="272" cy="238" r="3" />
          <circle cx="128" cy="162" r="3" />
          <circle cx="242" cy="292" r="3" />
        </g>

        {/* travelling applicants — applications streaming into the engine */}
        <circle r="7" className="hire-travel-a fill-[#684DFF]/20 dark:fill-[#8A70FF]/25" />
        <circle r="2.5" className="hire-travel-a fill-[#684DFF] dark:fill-[#8A70FF]" />
        <circle r="7" className="hire-travel-b fill-uk-blue/20 dark:fill-[#684DFF]/25" />
        <circle r="2.5" className="hire-travel-b fill-uk-blue dark:fill-[#684DFF]" />
      </svg>

      <span className="node-pulse absolute left-[72.5%] top-[27.5%] h-2.5 w-2.5 rounded-full bg-[#684DFF] dark:bg-[#8A70FF]" />
      <span className="node-pulse absolute left-[50%] top-[17%] h-2 w-2 rounded-full bg-[#fff500] dark:bg-uk-yellow" />

      <PlusMark className="left-[8%] top-[14%] text-uk-blue/35 dark:text-uk-blue/25" />
      <PlusMark className="bottom-[10%] right-[10%] text-[#684DFF]/45 dark:text-[#8A70FF]/30" />

      <CoreChip icon={UserPlus} />
    </div>
  );
}

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
  const strip = withLiveFigures(extras ?? image, live);
  // Company-, Hire- and Insights-section heroes always show their artwork
  // in the circular frame; the actions/facts strip still comes only from props.
  const sectionArt: Partial<Record<PageHeroVariant, HeroArtwork>> = {
    company: heroArtwork.company,
    hire: heroArtwork.hire,
    insights: heroArtwork.insights,
  };
  const art = withLiveFigures(image ?? sectionArt[variant], live);
  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-b-[2.5rem] bg-uk-surface-blue pt-32 pb-14 shadow-premium-lg lg:pt-40 lg:pb-18",
        // Image heroes: tall enough on xl that the 28rem circle + its orbit
        // rings fit fully inside the art zone below the header.
        art && "xl:min-h-[42.5rem]"
      )}
    >
      {/* ── backdrop layers (light palette, theme-adaptive) ── */}
      <div className="page-hero-gradient absolute inset-0" aria-hidden />
      <div className="absolute inset-0 bg-blueprint bg-grid-fade opacity-70" aria-hidden />
      {/* depth: a touch darker toward the bottom edge of the band */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-uk-blue/[0.06] dark:to-black/30" aria-hidden />

      {/* section-specific decorative canvas — modern AI core (services),
          ship pipeline (work), system blueprint with AI chip (solutions),
          team constellation (company), talent network with match-score arcs
          and travelling applicants (hire) or story stream (insights), each
          orbiting its glowing chip core */}
      <div className={ART_ZONE} aria-hidden>
        {art && (
          <ImageCanvas
            art={art}
            preload
            // Beside the copy only from xl: narrower, the circle would crowd
            // the heading and its orbit rings would be cut off at the right
            // edge (the in-flow copy below the content takes over there).
            // Size is capped by the art zone's height minus 8rem, leaving room
            // for the outer orbit ring (3.5rem each side) plus a margin.
            // Right offset is measured from the 80rem content column (4rem in
            // from its edge), so on wide screens or a zoomed-out browser the
            // circle stays beside the copy instead of at the viewport edge.
            className="absolute right-[max(4rem,calc((100%-80rem)/2+4rem))] top-1/2 hidden h-[min(28rem,calc(100%-8rem))] -translate-y-1/2 xl:block"
          />
        )}
        {!art && variant === "services" && <NeuralCanvas />}
        {!art && variant === "work" && <CircuitCanvas />}
        {!art && variant === "solutions" && <SolutionsCanvas />}
        {!art && variant === "company" && <CompanyCanvas />}
        {!art && variant === "hire" && <HireCanvas />}
        {!art && variant === "insights" && <StreamCanvas />}
      </div>

      {/* glow fields */}
      <div className="absolute -left-32 top-24 h-96 w-96 rounded-full bg-uk-blue/15 blur-[120px]" aria-hidden />
      <div className="absolute right-[-10%] top-1/3 h-[24rem] w-[24rem] rounded-full bg-uk-blue-bright/10 blur-[140px]" aria-hidden />
      <div className="absolute bottom-[-6rem] left-1/3 h-56 w-56 rounded-full bg-uk-yellow/10 blur-[110px]" aria-hidden />

      {/* corner register marks — engineering-drawing motif */}
      <div className="pointer-events-none absolute left-8 top-28 hidden text-uk-blue/30 lg:block" aria-hidden>
        <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
          <path d="M13 0v10M13 16v10M0 13h10M16 13h10" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      </div>
      <div className="pointer-events-none absolute bottom-10 right-8 hidden text-uk-blue/20 lg:block" aria-hidden>
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <circle cx="10" cy="10" r="9" stroke="currentColor" strokeWidth="1" />
          <circle cx="10" cy="10" r="3" className="fill-uk-yellow" />
        </svg>
      </div>

      {/* vertical hairlines framing the content column */}
      <div className="pointer-events-none absolute inset-y-10 left-1/2 hidden w-px bg-gradient-to-b from-transparent via-uk-blue/10 to-transparent lg:block" aria-hidden />

      {/* ── content ── */}
      <div className="relative mx-auto max-w-7xl pl-[max(1.25rem,env(safe-area-inset-left))] pr-[max(1.25rem,env(safe-area-inset-right))] lg:px-8">
        {crumbs && (
          <div className="mb-6">
            <Breadcrumbs items={crumbs} />
          </div>
        )}

        <Reveal className="flex flex-col gap-5">
          <span className="inline-flex w-fit items-center gap-2.5 rounded-full border border-uk-blue/20 bg-white/80 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.22em] text-uk-blue shadow-float backdrop-blur dark:bg-uk-card/80">
            <span className="relative flex h-1.5 w-1.5" aria-hidden>
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-uk-yellow/60" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-uk-yellow shadow-glow-yellow" />
            </span>
            {ukText(eyebrow)}
          </span>
          <h1
            className={cn(
              "font-heading-display max-w-4xl text-balance text-4xl font-bold leading-[1.05] tracking-tight text-uk-heading-strong sm:text-5xl lg:text-[3.6rem]",
              art && "lg:max-w-[40rem] xl:max-w-[42rem]",
              // SVG-canvas heroes: keep long titles clear of the artwork
              !art && "xl:max-w-[48rem]",
              titleClassName
            )}
          >
            {ukText(title)}
          </h1>
          {description && (
            <p className={`text-justify-prose max-w-2xl ${art ? "lg:max-w-[36rem] xl:max-w-[40rem]" : ""} text-lg leading-relaxed text-uk-muted sm:text-xl`}>
              {ukText(description)}
            </p>
          )}
          {children}

          {/* Actions + key-facts strip — puts the hero's spare height to
              work instead of leaving a blank band under short copy. */}
          {strip && (
            <>
              <div className="mt-1 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                <ScopingButton className="btn-sheen btn-lift group inline-flex h-12 w-full items-center justify-center gap-2 sm:w-auto rounded-full bg-uk-blue px-6 text-sm font-semibold text-white shadow-glow-blue-sm hover:bg-uk-blue-bright">{ukText("Book a free scoping call")}<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </ScopingButton>
                <Link
                  href={ukText(strip.secondary.href)}
                  className="btn-lift group inline-flex h-12 w-full items-center justify-center gap-2 sm:w-auto rounded-full border border-uk-line bg-white/80 px-6 text-sm font-semibold text-uk-heading backdrop-blur hover:border-uk-blue/50 hover:text-uk-blue-bright dark:bg-uk-card/80"
                >
                  {ukText(strip.secondary.label)}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>

              <dl className="mt-2 grid max-w-2xl grid-cols-2 gap-x-6 gap-y-4 border-t border-uk-line pt-5 sm:grid-cols-4 lg:max-w-[40rem]">
                {strip.facts.map((f) => (
                  <div key={f.label} className="flex flex-col gap-1">
                    <dt className="order-2 text-xs font-medium leading-tight text-uk-muted">{ukText(f.label)}</dt>
                    <dd className="order-1 font-heading text-2xl font-bold leading-none text-uk-blue">{ukText(f.value)}</dd>
                  </div>
                ))}
              </dl>
            </>
          )}
        </Reveal>

        {/* Below xl the artwork sits centred under the copy (tablets).
            Phones (Android / iOS) skip it: hidden under md in portrait,
            and in landscape via a short touch screen. Hidden with CSS, so
            the lazy image isn't downloaded there either. */}
        {art && (
          <ImageCanvas
            art={art}
            className="relative mx-auto mb-10 mt-20 w-[min(20rem,calc(100vw-9rem))] max-md:hidden xl:hidden [@media(pointer:coarse)_and_(max-height:500px)]:hidden"
          />
        )}
      </div>

      {/* glow hairline along the bottom edge — hands off to the body */}
      <div className="divider-glow absolute inset-x-0 bottom-0 mask-fade-x" aria-hidden />
    </section>
  );
}