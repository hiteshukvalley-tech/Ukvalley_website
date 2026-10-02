// Default home page text — exactly what the page showed before it became
// editable. Shown until a section is saved in Admin → Home page, and again
// after "Restore defaults". Field names match HOME_SECTIONS in home-schema.ts.
import { deliveryStats, heroStats, stats } from "@/lib/site-data";
import type { HomeSectionKey } from "@/lib/home-schema";

// Every key in HOME_SECTIONS must have content here (and nothing else).
type Sections<T extends Record<HomeSectionKey, unknown>> = T;

type Stat = { value: string; label: string };
type StatSub = Stat & { sub: string };

export type HomeContent = Sections<{
  hero: {
    badge: string; headline: string; description: string;
    primaryCta: string; secondaryCta: string; secondaryHref: string;
    trustNote: string; ratingNote: string; panelTitle: string; chips: string[];
    stats: Stat[]; meshEyebrow: string; meshText: string;
  };
  trust: { label: string; brands: string[] };
  explore: {
    eyebrow: string; title: string; description: string;
    cards: {
      label: string; href: string; description: string; statValue: string; statLabel: string;
      highlight1: string; highlight2: string; highlight3: string; cta: string;
    }[];
  };
  services: {
    eyebrow: string; title: string; description: string;
    coreBadge: string; coreText: string; workflowLabel: string; workflowSteps: string[];
    chips: string[]; proof: Stat[]; standardsLabel: string; standards: { title: string; sub: string }[];
    ctaBadge: string; ctaTitle: string; ctaText: string; ctaPoints: string[]; ctaLink: string;
  };
  why: {
    eyebrow: string; title: string; description: string;
    stats: StatSub[]; items: { title: string; desc: string; detail: string }[];
  };
  numbers: { badge: string; title: string; updated: string; cadence: string; items: StatSub[] };
  products: { eyebrow: string; title: string; description: string; linkLabel: string };
  caseStudies: { eyebrow: string; title: string; description: string; linkLabel: string; footnote: string };
  industries: { eyebrow: string; title: string; description: string };
  process: { eyebrow: string; title: string; description: string; badge: string };
  engagement: { eyebrow: string; title: string; description: string; ctaLabel: string };
  tech: { eyebrow: string; title: string; description: string; footnote: string };
  testimonials: { eyebrow: string; title: string; description: string };
  insights: {
    eyebrow: string; title: string; description: string; linkLabel: string;
    libraryBadge: string; libraryTitle: string; libraryText: string; libraryCta: string;
  };
  faq: { eyebrow: string; title: string; description: string };
  cta: { badge: string; title: string; description: string; buttonLabel: string; note: string };
}>;

export const defaultHome: HomeContent = {
  hero: {
    badge: "Engineering systems in production · Since 2017",
    headline: "We build technology *that* helps businesses scale.",
    description:
      "Web, mobile, CRM, ERP and cloud systems for Indian SMEs and global startups — engineered to scale, with *code you own from day one* and a 24-hour response SLA.",
    primaryCta: "Book a free scoping call",
    secondaryCta: "See our work",
    secondaryHref: "#work",
    trustNote: "NDA & IP assignment before day one",
    ratingNote: "150+ clients served",
    panelTitle: "What we build for you",
    chips: ["CRM & ERP dashboards", "Custom software platforms", "Mobile & web apps"],
    stats: heroStats.map(({ value, label }) => ({ value, label })),
    meshEyebrow: "Global delivery mesh",
    meshText: "Engineering from Maharashtra, India · clients and delivery partners across four geographies",
  },
  trust: {
    label: "Trusted by 150+ businesses · Products & platforms in production",
    brands: ["Finvalley", "TeleValley", "BBNPlay", "Dream Loans", "TurfPro", "AgriChain", "MediCore", "RetailOne", "BuildRight", "LogiFlow"],
  },
  explore: {
    eyebrow: "Explore",
    title: "Where would you like to *go next*?",
    description: "Six quick paths through everything we build, ship and support — each with the numbers behind it. Pick a door.",
    cards: [
      {
        label: "Services",
        href: "/services",
        description: "Web, mobile, custom software, cloud, marketing and security — one accountable team from scoping call to long-term support.",
        statValue: "{services}",
        statLabel: "Service lines",
        highlight1: "Web & mobile apps",
        highlight2: "CRM · ERP · HRMS",
        highlight3: "Cloud, DevOps & security",
        cta: "Explore services",
      },
      {
        label: "Solutions",
        href: "/solutions",
        description: "Production-proven systems we customise to your workflow — not templates you have to bend your business around.",
        statValue: "{solutions}",
        statLabel: "Ready-to-build systems",
        highlight1: "CRM & ERP platforms",
        highlight2: "POS & e-commerce",
        highlight3: "Loan origination & LMS",
        cta: "Browse solutions",
      },
      {
        label: "Work",
        href: "/case-studies",
        description: "Anonymised engagements that name the constraint, the approach, the stack and the measured result — numbers, not adjectives.",
        statValue: "{caseStudies}",
        statLabel: "Case studies",
        highlight1: "65% faster loan processing",
        highlight2: "−34% monthly cloud spend",
        highlight3: "200 stores on one POS",
        cta: "See the results",
      },
      {
        label: "Company",
        href: "/about",
        description: "An engineer-led, unfunded team based in Maharashtra, India. The architects who scope your project are the ones who build it.",
        statValue: "{foundedYear}",
        statLabel: "Building since",
        highlight1: `${stats[0].value} clients served`,
        highlight2: `${stats[1].value} projects delivered`,
        highlight3: "24-hour response SLA",
        cta: "Meet the team",
      },
      {
        label: "Hire",
        href: "/hire",
        description: "Dedicated engineers verified on live production work — embedded in your tools, with code and repos in your ownership.",
        statValue: "48h",
        statLabel: "Typical time to start",
        highlight1: "{hireRoles} specialisations",
        highlight2: "Paid trial slice first",
        highlight3: "Replace-anytime guarantee",
        cta: "Hire engineers",
      },
      {
        label: "Insights",
        href: "/blog",
        description: "Plain-English buyer's guides and engineering notes from the team doing the work — practical frames, no SEO filler.",
        statValue: "{articles}",
        statLabel: "Guides & articles",
        highlight1: "Buyer's guides & pricing",
        highlight2: "Engineering playbooks",
        highlight3: "Growth & operations",
        cta: "Read insights",
      },
    ],
  },
  services: {
    eyebrow: "System architecture",
    title: "{Count} disciplines, *one accountable core*.",
    description:
      "{Count} service lines, one team that owns the outcome. No freelance brokers, no hand-offs to a faceless offshoring pool — the engineers who scope it build it.",
    coreBadge: "Engineering core",
    coreText:
      "From SPA dashboards and e-commerce storefronts to complex workflow engines — we ship production-grade code with shared Jira boards, weekly demos and a 24-hour SLA.",
    workflowLabel: "How we run it",
    workflowSteps: ["Discovery", "Design", "Build", "Ship", "Support"],
    chips: ["React & Next.js", "Angular & Vue", "TypeScript", "SEO-ready", "Design system included", "24h SLA"],
    proof: heroStats.slice(1, 4).map(({ value, label }) => ({ value, label })),
    standardsLabel: "Every web build ships with",
    standards: [
      { title: "LCP < 2.5s", sub: "Core Web Vitals" },
      { title: "SEO foundation", sub: "Sitemap & schema" },
      { title: "SSR / SSG", sub: "Crawlable pages" },
      { title: "Code you own", sub: "Docs + handover" },
    ],
    ctaBadge: "Free · 30 minutes · No obligation",
    ctaTitle: "Not sure which service fits?",
    ctaText: "In one short call we map your goals to the right build path — no sales pitch.",
    ctaPoints: [
      "Architecture recommendation from a senior engineer",
      "Rough estimate within 3 days",
      "Fixed proposal within 7 days",
    ],
    ctaLink: "Talk to an architect",
  },
  why: {
    eyebrow: "Why Ukvalley",
    title: "Built to be *verifiable*, not just impressive.",
    description:
      "Most small IT firms look the same because they make the same claims. We differentiate on the things you can actually check.",
    stats: stats.map(({ value, label, sub }) => ({ value, label, sub })),
    items: [
      {
        title: "Code you own from day one",
        desc: "All source, docs and repo access are yours. We work under a signed NDA and IP assignment before any line is written.",
        detail: "No lock-in, no hostage code — ever.",
      },
      {
        title: "24-hour response SLA",
        desc: "Stated publicly, written into every contract. A real architect replies — not a chatbot, not a sales queue.",
        detail: "Average first reply: under 4 hours.",
      },
      {
        title: "In-house engineers, not brokers",
        desc: "The team that scopes your project is the team that builds it. No freelance middlemen, no faceless offshoring pools.",
        detail: "100% salaried, in-house team.",
      },
      {
        title: "Real product portfolio",
        desc: "TeleValley, Finvalley, BBNPlay and more — proof we build and maintain our own IP, not just billable hours.",
        detail: "{products} products in production right now.",
      },
      {
        title: "India cost base, enterprise quality",
        desc: "Our economics run 30–40% below metro agencies, with the same stack, process and security posture.",
        detail: "ISO-grade process at SME pricing.",
      },
      {
        title: "Verifiable & registered",
        desc: "CIN, GSTIN and Udyam published on-site. A named contracting entity — not a Gmail and a stock photo.",
        detail: "{registration}",
      },
    ],
  },
  numbers: {
    badge: "Delivery scoreboard",
    title: "How we are performing right now",
    updated: deliveryStats.updated,
    cadence: deliveryStats.cadence,
    items: deliveryStats.items.slice(0, 4).map(({ value, label, sub }) => ({ value, label, sub })),
  },
  products: {
    eyebrow: "Our products",
    title: "We don't just bill hours — *we build & run our own IP.*",
    description:
      "A product portfolio in production is proof most service firms can't offer. Here's what we've shipped and maintain ourselves.",
    linkLabel: "View all products",
  },
  caseStudies: {
    eyebrow: "Case studies",
    title: "Results we're *accountable for* — with the numbers to prove it.",
    description: "A few anonymized engagements. Named clients and detailed write-ups live on the full case-study pages.",
    linkLabel: "All {count} case studies",
    footnote: "Every case study includes the constraint, the approach and the measured result.",
  },
  industries: {
    eyebrow: "Industry switchboard",
    title: "Verticals where we have *shipped real systems.*",
    description:
      "We don't claim to serve everyone. These are the sectors where we have live, proven work — and the case studies to match.",
  },
  process: {
    eyebrow: "How we work",
    title: "A process built to remove *delivery anxiety.*",
    description: "No black boxes. You get shared Jira access, a Slack channel, and a working demo every single week.",
    badge: "Pipeline live — average kickoff in 5 business days",
  },
  engagement: {
    eyebrow: "Engagement models",
    title: "{Count} ways to work with us — *pick what fits.*",
    description: "Not sure which you need? Book a free scoping call and we'll tell you — even if the answer is none of them yet.",
    ctaLabel: "Not sure which you need? Talk to us",
  },
  tech: {
    eyebrow: "Technology stack",
    title: "The tools we reach for — *and why.*",
    description: "We recommend the stack that fits your team and constraints, not the one we happen to prefer.",
    footnote:
      "We evaluate every project on its own merits — team skills, scalability needs, timeline, and budget — and pick the right tool for the job.",
  },
  testimonials: {
    eyebrow: "Testimonials",
    title: "What clients say after *the first sprint.*",
    description:
      "Collected at project milestones — launch, first quarter and year one. Client names are anonymised at their request; the numbers behind each quote live in the case studies.",
  },
  insights: {
    eyebrow: "Insights",
    title: "Practical guides from the *engineers who build.*",
    description: "No thought-leadership fluff. Frameworks, buyer's guides and postmortems you can actually use.",
    linkLabel: "Read the blog",
    libraryBadge: "The full library",
    libraryTitle: "Every guide, playbook and engineering note in one place.",
    libraryText:
      "Practical reading for whatever you're deciding right now — choosing software, pricing a build, or shipping it without surprises.",
    libraryCta: "Browse all insights",
  },
  faq: {
    eyebrow: "FAQ",
    title: "Questions buyers *actually ask.*",
    description: "Straight answers on IP, pricing, speed and what happens when things go wrong.",
  },
  cta: {
    badge: "Free · 30 minutes · No obligation",
    title: "Book a scoping call with a software architect — not a sales bot.",
    description:
      "Within 1 business hour you'll get a reply. We'll send a rough estimate in 3 days and a fixed proposal in 7.",
    buttonLabel: "Book a free scoping call",
    note: "Prefer to talk first? Phone, email and office address are on the contact page.",
  },
};
