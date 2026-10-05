import type { Metadata } from "next";
import { editableMetadata } from "@/lib/page-metadata";
import {
  ArrowRight, Award, Briefcase, Check, GraduationCap, Heart, MapPin, RotateCcw, Rocket, Sparkles,
  TrendingUp, UserCheck, Users,
} from "lucide-react";
import { Header } from "@/components/site/header";
import { Footer } from "@/components/site/footer";
import { ScrollProgress } from "@/components/site/scroll-progress";
import { PageBlocks } from "@/components/site/page-extras";
import { Marked } from "@/components/site/marked";
import { Container } from "@/components/site/container";
import { Reveal } from "@/components/site/reveal";
import { getCareers } from "@/lib/careers-store";
import { getSiteSettings } from "@/lib/settings";
import { getPageContent } from "@/lib/pages-store";
import { ApplyButton, CareerApplyProvider } from "@/components/site/career-apply";
import { CareersBoard } from "@/components/site/careers-board";
import { HeroJobSearch } from "@/components/site/hero-job-search";
import { roleInPlace } from "@/lib/careers-shared";
import { ukText } from "@/lib/texts";

// Re-render at least once a minute so admin text overrides always show up.
export const revalidate = 60;

// Title and description can be replaced in Admin → Page text (SEO fields).
export const generateMetadata = () => editableMetadata("careers", baseMetadata);
const baseMetadata: Metadata = {
  title: "Careers at Ukvalley — find your next role",
  description:
    "Open roles at Ukvalley Technologies — Pune, Nagpur and remote across India: React/Next.js, Flutter, backend, QA and design. Engineer-led, with real ownership. See how hiring works and apply in minutes.",
  alternates: { canonical: "https://ukvalley.com/careers" },
};

const pathways = [
  {
    icon: Briefcase,
    title: "Experienced professionals",
    text: "Your next career move could be your boldest one — own outcomes on real client projects and our own products.",
    href: "/careers?experience=3#open-roles",
    cta: "See roles for experienced hires",
  },
  {
    icon: GraduationCap,
    title: "Freshers & graduates",
    text: "Start your career beside senior engineers who review your code, mentor you and let you ship real work early.",
    href: "/careers?experience=0#open-roles",
    cta: "See roles for freshers",
  },
  {
    icon: RotateCcw,
    title: "Returning after a break",
    text: "A break is not the end of a career. Tell us what you've been up to and what you want to do next.",
    apply: true,
    cta: "Tell us about yourself",
  },
  {
    icon: Sparkles,
    title: "Don't see your role?",
    text: "We hire people, not just open positions. Send us what you build and what you're looking for.",
    apply: true,
    cta: "Send an open application",
  },
];

const locations = [
  { city: "Pune", text: "Our client-engagement hub — product, design and delivery teams working side by side." },
  { city: "Nagpur", text: "Our engineering core, with a cost base that lets us pay well and keep senior engineers on every project." },
  { city: "Remote", label: "Remote across India", text: "Roles open to engineers and designers anywhere in India, on the same delivery system as the offices." },
];

const expect = [
  { icon: Heart, title: "A culture of ownership", desc: "The engineers who scope a project build it. You own outcomes, not tickets — and your judgment is rewarded." },
  { icon: TrendingUp, title: "Opportunities that keep you growing", desc: "Code review from senior architects, time on client work and our own live products, and room to move into new areas." },
  { icon: Rocket, title: "Work that makes a real impact", desc: "Software that runs real businesses in production — CRM, ERP, HRMS, mobile apps and more." },
];

const steps = [
  { title: "Apply", desc: "Pick a role and send your details and resume — it takes a few minutes." },
  { title: "Screening call", desc: "A short conversation with our HR team about you, your goals and the role." },
  { title: "Skills round", desc: "A practical discussion or task with the team you'd work with. Each role lists its own stages." },
  { title: "Offer & onboarding", desc: "A clear offer, a named buddy and a first project that ships real work." },
];

const eyebrowCls =
  "inline-flex w-fit items-center gap-2 rounded-full border border-uk-blue/30 bg-uk-blue/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.22em] text-uk-blue";
export default async function CareersPage() {
  const [careers, settings, page] = await Promise.all([getCareers(), getSiteSettings(), getPageContent("careers")]);
  // Hiring places: the usual three, plus any other city an admin-added role is based in.
  const known = locations.map((l) => l.city.toLowerCase());
  const extraCities = Array.from(
    new Set(
      careers
        .map((c) => c.location.split(/[,(/]/)[0].trim())
        .filter((city) => city && !/^(india|remote|hybrid|on-?site|anywhere)$/i.test(city) && !known.includes(city.toLowerCase()))
    )
  ).map((city) => ({ city, label: undefined, text: `Roles based in ${city}.` }));
  const places = [...locations, ...extraCities].map((l) => ({
    ...l,
    count: careers.filter((c) => roleInPlace(l.city, c.location, c.mode)).length,
  }));
  return (
    <>
      <ScrollProgress />
      <Header />
      <main id="main">
        {/* The provider wraps the hero too: its search results have Apply buttons */}
        <CareerApplyProvider
          positions={careers.map((c) => c.role)}
          processes={Object.fromEntries(careers.map((c) => [c.role, c.hiringProcess]))}
        >
        {/* Hero — a job search instead of a banner: candidates land straight on finding a role */}
        <section className="relative overflow-hidden border-b border-uk-line bg-uk-surface pb-14 pt-28 sm:pb-20 sm:pt-36">
          <div className="page-hero-gradient absolute inset-0" aria-hidden />
          <div className="absolute inset-0 bg-blueprint bg-grid-fade opacity-60" aria-hidden />
          <Container className="relative">
            <Reveal className="flex max-w-3xl flex-col gap-5">
              <span className={eyebrowCls}>{page.heroEyebrow || ukText("Careers at Ukvalley")}</span>
              <h1 className="font-heading-display text-4xl font-bold leading-[1.08] tracking-tight text-uk-heading-strong sm:text-5xl lg:text-6xl">
                {page.heroTitle ? (
                  <Marked text={page.heroTitle} />
                ) : (
                  <>{ukText("Your next career move")}{" "}<span className="text-gradient-blue">{ukText("starts here")}</span></>
                )}
              </h1>
              <p className="max-w-2xl text-lg leading-relaxed text-uk-muted sm:text-xl">
                {page.heroDescription ||
                  ukText("Shape your career at an engineer-led software company. Search our open roles, see exactly how hiring works, and apply in minutes.")}
              </p>
            </Reveal>

            <HeroJobSearch
              total={careers.length}
              jobs={careers.map((c) => ({
                slug: c.slug,
                role: c.role,
                summary: c.summary,
                location: c.location,
                type: c.type,
                mode: c.mode,
                experienceMin: c.experienceMin,
                ...(c.experienceMax === undefined ? {} : { experienceMax: c.experienceMax }),
                postedAt: c.postedAt,
              }))}
            />
          </Container>
        </section>

          {/* Pathways */}
          <section className="relative bg-uk-surface section-py">
            <Container>
              <Reveal className="max-w-2xl">
                <span className={eyebrowCls}>{ukText("Start here")}</span>
                <h2 className="mt-5 font-heading text-3xl font-bold text-uk-heading sm:text-4xl">{ukText("Where are you in your career?")}</h2>
                <p className="mt-4 text-lg text-uk-gray">{ukText("Whatever stage you're at, there's a way in. Pick the path that fits you.")}</p>
              </Reveal>
              <Reveal staggerChildren className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {pathways.map((p) => {
                  const Icon = p.icon;
                  const cls = "mt-auto inline-flex items-center gap-1.5 text-sm font-semibold text-uk-blue transition-colors hover:text-uk-blue-bright";
                  return (
                    <div key={p.title} className="flex flex-col gap-3 rounded-2xl border border-uk-line bg-uk-card p-6 card-hover">
                      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-uk-blue/12 text-uk-blue"><Icon className="h-5 w-5" /></span>
                      <h3 className="font-heading text-lg font-bold text-uk-heading">{ukText(p.title)}</h3>
                      <p className="text-sm leading-relaxed text-uk-gray">{ukText(p.text)}</p>
                      {p.apply ? (
                        <ApplyButton className={cls}>{ukText(p.cta)}<ArrowRight className="h-4 w-4" /></ApplyButton>
                      ) : (
                        // plain <a>: a different query string must reload so the job search picks it up
                        <a href={p.href} className={cls}>{ukText(p.cta)}<ArrowRight className="h-4 w-4" /></a>
                      )}
                    </div>
                  );
                })}
              </Reveal>
            </Container>
          </section>

          {/* Locations */}
          <section className="relative border-y border-uk-line bg-uk-surface-2 section-py">
            <Container>
              <Reveal className="max-w-2xl">
                <span className={eyebrowCls}>{ukText("Where you'll work")}</span>
                <h2 className="mt-5 font-heading text-3xl font-bold text-uk-heading sm:text-4xl">{ukText("Featured hiring locations")}</h2>
              </Reveal>
              <Reveal staggerChildren className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
                {places.map((l) => (
                  <a
                    key={l.city}
                    href={`/careers?location=${encodeURIComponent(l.city)}#open-roles`}
                    className="group flex flex-col gap-2 rounded-2xl border border-uk-line bg-uk-card p-6 card-hover"
                  >
                    <span className="flex items-center gap-2 font-heading text-xl font-bold text-uk-heading">
                      <MapPin className="h-5 w-5 text-uk-blue" />{ukText(l.label ?? l.city)}
                    </span>
                    <p className="text-sm leading-relaxed text-uk-gray">{ukText(l.text)}</p>
                    <span className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-uk-blue">
                      {l.count > 0 ? ukText(`${l.count} open ${l.count === 1 ? "role" : "roles"}`) : ukText("No open roles right now")}
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </span>
                  </a>
                ))}
              </Reveal>
            </Container>
          </section>

          {/* What to expect */}
          <section className="relative bg-uk-surface section-py">
            <Container>
              <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_1.2fr] lg:gap-16">
                <Reveal className="flex flex-col gap-5">
                  <span className={eyebrowCls}>{ukText("Life at Ukvalley")}</span>
                  <h2 className="font-heading text-3xl font-bold text-uk-heading sm:text-4xl">{ukText("What to expect from your career at Ukvalley")}</h2>
                  <p className="text-base leading-relaxed text-uk-body sm:text-lg">{ukText("We're engineer-led and unfunded by choice — accountable to clients and to the work, not a cap table. For you, that means real responsibility, straight answers and people who care how your project turns out.")}</p>
                  <ul className="mt-2 flex flex-col gap-3">
                    {[
                      "You scope the project you build, and sit on the client call",
                      "Code review from a senior architect, not a rubber stamp",
                      "Time on client work and on our own live products",
                      "A 24-hour response culture — and we answer candidates fast too",
                    ].map((item) => (
                      <li key={item} className="flex items-start gap-3">
                        <span className="mt-0.5 flex h-6 w-6 flex-none items-center justify-center rounded-full bg-uk-blue/12 text-uk-blue"><Check className="h-3.5 w-3.5" strokeWidth={3} /></span>
                        <p className="text-sm leading-relaxed text-uk-body">{ukText(item)}</p>
                      </li>
                    ))}
                  </ul>
                </Reveal>
                <Reveal staggerChildren className="grid grid-cols-1 gap-5">
                  {expect.map((e) => {
                    const Icon = e.icon;
                    return (
                      <div key={e.title} className="flex gap-4 rounded-2xl border border-uk-line bg-uk-card p-6 card-hover">
                        <span className="flex h-12 w-12 flex-none items-center justify-center rounded-xl bg-uk-blue/12 text-uk-blue"><Icon className="h-6 w-6" /></span>
                        <div>
                          <h3 className="font-heading text-lg font-bold text-uk-heading">{ukText(e.title)}</h3>
                          <p className="mt-1 text-sm leading-relaxed text-uk-gray">{ukText(e.desc)}</p>
                        </div>
                      </div>
                    );
                  })}
                </Reveal>
              </div>
            </Container>
          </section>

          {/* How hiring works */}
          <section className="relative border-y border-uk-line bg-uk-surface-2 section-py">
            <Container>
              <Reveal className="max-w-2xl">
                <span className={eyebrowCls}><UserCheck className="h-3.5 w-3.5" />{ukText("Your hiring journey")}</span>
                <h2 className="mt-5 font-heading text-3xl font-bold text-uk-heading sm:text-4xl">{ukText("How hiring works, step by step")}</h2>
                <p className="mt-4 text-lg text-uk-gray">{ukText("No black box. Every role also lists its own stages, and we email you at every step.")}</p>
              </Reveal>
              <Reveal staggerChildren className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {steps.map((st, i) => (
                  <div key={st.title} className="flex flex-col gap-2 rounded-2xl border border-uk-line bg-uk-card p-6">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-uk-blue font-heading text-sm font-bold text-uk-white">{i + 1}</span>
                    <h3 className="font-heading text-lg font-bold text-uk-heading">{ukText(st.title)}</h3>
                    <p className="text-sm leading-relaxed text-uk-gray">{ukText(st.desc)}</p>
                  </div>
                ))}
              </Reveal>
            </Container>
          </section>

          {/* Open roles — every Apply button opens the application popup */}
          <section id="open-roles" className="relative scroll-mt-20 bg-uk-surface section-py">
            <Container>
              <Reveal className="max-w-2xl">
                <span className={eyebrowCls}>{ukText("Open roles")}</span>
                <h2 className="mt-5 font-heading text-3xl font-bold text-uk-heading sm:text-4xl">{ukText("Grow your career with us")}</h2>
                <p className="mt-4 text-lg text-uk-gray">{ukText("Search by position, location or your years of experience. Every role shows its job mode, when it was posted and the hiring process, so you know what to expect before you apply.")}</p>
              </Reveal>

              {/* Not wrapped in Reveal: cards come and go as the visitor searches,
                  and a scroll-triggered entrance would leave new ones hidden. */}
              {careers.length > 0 && (
                <CareersBoard
                  jobs={careers.map((c) => ({
                    slug: c.slug,
                    role: c.role,
                    summary: c.summary,
                    location: c.location,
                    type: c.type,
                    mode: c.mode,
                    experienceMin: c.experienceMin,
                    ...(c.experienceMax === undefined ? {} : { experienceMax: c.experienceMax }),
                    postedAt: c.postedAt,
                  }))}
                />
              )}
              {careers.length === 0 && (
                <div className="mt-12 rounded-2xl border border-dashed border-uk-line bg-uk-card p-8 text-center">
                  <p className="text-uk-body">{ukText("There are no open roles right now — but we're always glad to hear from good people.")}</p>
                  <ApplyButton className="mt-4 inline-flex items-center gap-2 rounded-full bg-uk-blue px-5 py-2.5 text-sm font-semibold text-uk-white transition-colors hover:bg-uk-blue-bright">
                    {ukText("Send an application")}<ArrowRight className="h-4 w-4" />
                  </ApplyButton>
                </div>
              )}
            </Container>
          </section>

          {/* Stay in touch */}
          <section className="relative border-t border-uk-line bg-uk-surface-2 section-py">
            <Container>
              <Reveal className="mx-auto flex max-w-3xl flex-col items-center gap-4 text-center">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-uk-blue/12 text-uk-blue"><Users className="h-6 w-6" /></span>
                <h2 className="font-heading text-3xl font-bold text-uk-heading sm:text-4xl">{ukText("Let's keep in touch")}</h2>
                <p className="text-lg text-uk-gray">{ukText("Can't find the right role today? Send us an open application and we'll reach out when something that fits you opens up.")}</p>
                <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
                  <ApplyButton className="btn-sheen inline-flex h-12 items-center gap-2 rounded-full bg-uk-blue px-7 text-sm font-semibold text-uk-white shadow-glow-blue-sm transition-colors hover:bg-uk-blue-bright">
                    {ukText("Send an open application")}<ArrowRight className="h-4 w-4" />
                  </ApplyButton>
                  <a
                    href={ukText(`mailto:${settings.hr.email}`)}
                    className="inline-flex h-12 items-center gap-2 rounded-full border border-uk-line bg-uk-card px-6 text-sm font-semibold text-uk-heading transition-colors hover:border-uk-blue/50 hover:text-uk-blue"
                  >
                    <Award className="h-4 w-4 text-uk-blue" />{ukText(settings.hr.email)}
                  </a>
                </div>
              </Reveal>
            </Container>
          </section>
        </CareerApplyProvider>

        <PageBlocks pageKey="careers" />
      </main>
      <Footer />
    </>
  );
}
