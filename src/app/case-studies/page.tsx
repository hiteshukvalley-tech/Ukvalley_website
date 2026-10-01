import type { Metadata } from "next";
import Link from "@/components/site/intent-link";
import { ArrowRight, Target, Building2, CircleAlert, Layers, TrendingUp, Gauge } from "lucide-react";
import { Header } from "@/components/site/header";
import { Footer } from "@/components/site/footer";
import { ScrollProgress } from "@/components/site/scroll-progress";
import { PageHero, heroArtwork } from "@/components/site/page-hero";
import { Container } from "@/components/site/container";
import { Reveal } from "@/components/site/reveal";
import { CtaBand } from "@/components/site/cta";
import { ReportsSection } from "@/components/site/report-card";
import { getCaseStudies } from "@/lib/cases-store";


export const metadata: Metadata = {
  title: "Case studies — software projects with measured results",
  description:
    "Eleven anonymised engagements across fintech, retail, healthcare, manufacturing, logistics, education and more. Each case study names the sector context, the challenge, what we built, the stack and the measured result.",
  alternates: { canonical: "https://ukvalley.com/case-studies" },
};

export default async function CaseStudiesPage() {
  const caseStudies = await getCaseStudies();
  const sectors = new Set(caseStudies.map((c) => c.sector)).size;
  const modules = caseStudies.reduce((n, c) => n + c.modules.length, 0);
  const summary = [
    { value: String(caseStudies.length), label: "Engagements documented" },
    { value: String(sectors), label: "Sectors covered" },
    { value: `${modules}+`, label: "Modules delivered" },
    { value: "100%", label: "With measured results" },
  ];
  return (
    <>
      <ScrollProgress />
      <Header />
      <main id="main">
        <PageHero variant="work"
          image={heroArtwork.work}
          eyebrow="Case studies"
          crumbs={[{ label: "Home", href: "/" }, { label: "Case Studies" }]}
          title={
            <>
              Results we&apos;re{" "}
              <span className="text-gradient-blue">accountable for</span> — with
              the numbers.
            </>
          }
          description="Anonymised engagements from lending desks to cold-chain fleets. Each one names the sector reality, the constraint, what we built, the stack and the measured result — not just adjectives."
        />

        {/* Summary band */}
        <section className="relative border-y border-uk-line bg-uk-surface-2">
          <Container className="grid grid-cols-2 gap-px overflow-hidden lg:grid-cols-4">
            {summary.map((s) => (
              <div key={s.label} className="flex flex-col gap-1 px-4 py-8 text-center">
                <span className="font-heading text-3xl font-bold text-uk-blue sm:text-4xl">{s.value}</span>
                <span className="text-xs font-medium uppercase tracking-wider text-uk-gray">{s.label}</span>
              </div>
            ))}
          </Container>
        </section>

        {/* The problem it solves */}
        <section className="relative bg-uk-surface section-py">
          <Container>
            <Reveal>
              <span className="inline-flex w-fit items-center gap-2 rounded-full border border-uk-blue/30 bg-uk-blue/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.22em] text-uk-blue">
                <Target className="h-3.5 w-3.5" />
                The problem it solves
              </span>
            </Reveal>
            <div className="mt-6 grid grid-cols-1 gap-10 lg:grid-cols-[1.25fr_1fr] lg:items-start lg:gap-16">
              <Reveal className="flex flex-col gap-5">
                <h2 className="font-heading text-2xl font-bold text-uk-heading sm:text-3xl">
                  Why we publish the sector reality, not just the win
                </h2>
                <p className="text-justify-prose text-base leading-relaxed text-uk-body sm:text-lg">
                  Most agency portfolios show a logo, a screenshot and an adjective — "seamless", "robust", "game-changing" — which tells a buyer nothing about whether that team can solve their specific problem. A CRM built for a five-person startup and a CRM built for a 200-store retail chain look identical in a screenshot, and completely different in every decision that actually mattered.
                </p>
                <p className="text-justify-prose text-base leading-relaxed text-uk-body sm:text-lg">
                  The gap costs buyers at contract time: without the sector context, the real constraints and what was actually built, there's no way to judge whether a vendor's past work is relevant to your problem or just adjacent to it — so decisions get made on the size of the case-study logo instead of the size of the actual challenge solved.
                </p>
                <p className="text-justify-prose text-base leading-relaxed text-uk-body sm:text-lg">
                  Every engagement below names the sector reality it sat inside, the specific failures we found on day one, what we actually built module by module, and a measured before-and-after — so you can judge fit on substance, not adjectives.
                </p>
              </Reveal>

              <Reveal className="flex flex-col gap-5">
                <div className="flex w-full flex-col rounded-2xl border border-uk-line bg-uk-card p-6 sm:p-7">
                  <h3 className="font-heading text-lg font-bold text-uk-heading">What's in every case study</h3>
                  <p className="mt-1 text-sm text-uk-gray">The four things a portfolio screenshot never tells you.</p>
                  <ul className="mt-5 flex flex-col gap-4">
                    {[
                      { icon: Building2, title: "Sector reality", desc: "The industry constraints and rules the system had to work inside." },
                      { icon: CircleAlert, title: "Day-one challenges", desc: "The specific failures we found before writing a line of code." },
                      { icon: Layers, title: "What we built", desc: "Modules, stack and integrations — named, not summarised." },
                      { icon: TrendingUp, title: "Measured results", desc: "A before, an after, a timeframe and a named testimonial." },
                    ].map((p) => (
                      <li key={p.title} className="flex items-start gap-3">
                        <span className="mt-0.5 flex h-8 w-8 flex-none items-center justify-center rounded-lg bg-uk-blue/12 text-uk-blue">
                          <p.icon className="h-4 w-4" />
                        </span>
                        <div>
                          <p className="text-sm font-semibold text-uk-heading">{p.title}</p>
                          <p className="mt-0.5 text-sm leading-relaxed text-uk-gray">{p.desc}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex w-full flex-col rounded-2xl border border-uk-blue/20 bg-uk-surface-blue p-6 sm:p-7">
                  <h3 className="flex items-center gap-2 font-heading text-lg font-bold text-uk-heading">
                    <Gauge className="h-4 w-4 text-uk-blue" />
                    At a glance
                  </h3>
                  <dl className="mt-4 flex flex-col divide-y divide-uk-line">
                    {summary.map((s) => (
                      <div key={s.label} className="flex items-baseline justify-between gap-4 py-3">
                        <dt className="text-sm text-uk-gray">{s.label}</dt>
                        <dd className="whitespace-nowrap font-heading text-base font-bold text-uk-blue">{s.value}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              </Reveal>
            </div>
          </Container>
        </section>

        <section className="relative bg-uk-surface-2 section-py">
          <Container>
            <Reveal staggerChildren className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {caseStudies.map((c) => (
                <Link
                  key={c.slug}
                  href={`/case-studies/${c.slug}`}
                  className="group relative flex flex-col overflow-hidden rounded-3xl border border-uk-line bg-uk-card p-7 transition-all duration-300 hover:-translate-y-1 hover:border-uk-blue/40 sm:p-8"
                >
                  <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-uk-blue/0 blur-3xl transition-all duration-500 group-hover:bg-uk-blue/20" aria-hidden />
                  <div className="flex items-center justify-between gap-4">
                    <span className="inline-flex flex-none items-center gap-2 whitespace-nowrap rounded-full bg-uk-blue/12 px-3 py-1 text-xs font-bold uppercase tracking-wider text-uk-blue">
                      {c.sector}
                    </span>
                    <span className="text-right text-xs font-medium text-uk-gray">{c.client}</span>
                  </div>
                  <h2 className="mt-5 font-heading text-xl font-bold leading-snug text-uk-heading sm:text-2xl">
                    {c.title}
                  </h2>
                  <p className="mt-3 text-sm leading-relaxed text-uk-gray">
                    <span className="font-semibold text-uk-heading">Challenge — </span>
                    {c.problem}
                  </p>
                  <div className="mt-6 grid grid-cols-1 gap-2.5 border-t border-uk-line pt-6 xl:grid-cols-3 xl:gap-3">
                    {c.metrics.map((m) => (
                      <div key={m.label} className="flex flex-col gap-0.5">
                        <span className="font-heading text-balance text-xl font-bold text-uk-blue">{m.value}</span>
                        <span className="text-[0.72rem] leading-tight text-uk-gray">{m.label}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-5 flex items-center justify-between">
                    <div className="flex flex-wrap gap-1.5">
                      {c.stack.map((t) => (
                        <span key={t} className="rounded-md bg-uk-surface-blue px-2 py-1 text-[0.7rem] font-medium text-uk-body">
                          {t}
                        </span>
                      ))}
                    </div>
                    <span className="inline-flex h-9 w-9 flex-none items-center justify-center rounded-full bg-uk-blue/10 text-uk-blue transition-all group-hover:bg-uk-blue group-hover:text-uk-white">
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  </div>
                </Link>
              ))}
            </Reveal>
          </Container>
        </section>

        <ReportsSection className="bg-uk-surface" />
        <CtaBand />
      </main>
      <Footer />
    </>
  );
}