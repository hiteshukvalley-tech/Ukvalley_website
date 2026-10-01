import type { Metadata } from "next";
import { ArrowRight, MapPin, Briefcase, Heart, Target, Check, Gauge } from "lucide-react";
import { Header } from "@/components/site/header";
import { Footer } from "@/components/site/footer";
import { ScrollProgress } from "@/components/site/scroll-progress";
import { PageHero } from "@/components/site/page-hero";
import { Container } from "@/components/site/container";
import { Reveal } from "@/components/site/reveal";
import { CtaBand } from "@/components/site/cta";
import { getCareers } from "@/lib/careers-store";
import { getSiteSettings } from "@/lib/settings";

export const metadata: Metadata = {
  title: "Careers at Ukvalley — build software that ships",
  description:
    "Open roles at Ukvalley Technologies — remote across India plus office roles: React/Next.js, Flutter, backend and design. Engineer-led, unfunded, with real ownership and a 24-hour SLA culture.",
  alternates: { canonical: "https://ukvalley.com/careers" },
};

const perks = [
  { title: "Real ownership", desc: "The engineers who scope it build it. You own outcomes, not tickets." },
  { title: "Engineer-led", desc: "Unfunded by choice — accountable to clients and the work, not a cap table." },
  { title: "Pune, Nagpur or remote", desc: "Offices in Pune and Nagpur with a cost base that lets us pay well, plus remote roles across India." },
  { title: "Your own products", desc: "Work on client engagements and our in-house products, both in production." },
];

export default async function CareersPage() {
  const [careers, settings] = await Promise.all([getCareers(), getSiteSettings()]);
  return (
    <>
      <ScrollProgress />
      <Header />
      <main id="main">
        <PageHero variant="company"
          eyebrow="Careers"
          crumbs={[{ label: "Home", href: "/" }, { label: "Careers" }]}
          title={
            <>
              Build software that{" "}
              <span className="text-gradient-blue">actually ships</span> — with
              the people who scope it.
            </>
          }
          description="We're an engineer-led, unfunded team with remote roles across India. We hire people who want to own outcomes, not just write tickets. If that's you, we'd like to talk."
        />

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
                  Why most engineering jobs quietly waste good engineers
                </h2>
                <p className="text-justify-prose text-base leading-relaxed text-uk-body sm:text-lg">
                  Most software jobs put a wall between the engineer and the outcome: a product manager decides what to build, a ticket describes it, and the engineer's job is to close the ticket — not to know whether the client's actual problem got solved. Good engineers notice this fast, and the ones who care most about outcomes leave first.
                </p>
                <p className="text-justify-prose text-base leading-relaxed text-uk-body sm:text-lg">
                  The cost compounds on both sides: engineers stop making judgment calls because judgment isn't rewarded, and the company loses the exact people who could have caught a bad requirement before it shipped. What's left is a team that executes precisely and understands nothing — which is expensive the first time a spec is wrong.
                </p>
                <p className="text-justify-prose text-base leading-relaxed text-uk-body sm:text-lg">
                  We hire the opposite way: engineers who scope a project are the ones who build it, sit in on the client call, and own whether it actually works — not just whether the ticket closed.
                </p>
              </Reveal>

              <Reveal className="flex flex-col gap-5">
                <div className="flex w-full flex-col rounded-2xl border border-uk-line bg-uk-card p-6 sm:p-7">
                  <h3 className="font-heading text-lg font-bold text-uk-heading">What working here actually means</h3>
                  <ul className="mt-4 flex flex-col gap-3.5">
                    {[
                      "You scope the project you build, and sit on the client call",
                      "Code review from a senior architect, not a rubber stamp",
                      "Time on client work and on our own live products, both",
                      "Judgment is rewarded — closing tickets quietly isn't the goal",
                    ].map((item) => (
                      <li key={item} className="flex items-start gap-3">
                        <span className="mt-0.5 flex h-6 w-6 flex-none items-center justify-center rounded-full bg-uk-blue/12 text-uk-blue">
                          <Check className="h-3.5 w-3.5" strokeWidth={3} />
                        </span>
                        <p className="text-sm leading-relaxed text-uk-body">{item}</p>
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
                    {[
                      { label: "Open roles", value: String(careers.length), sub: "Updated as we hire" },
                      { label: "Location", value: "Pune / remote", sub: "Across India" },
                      { label: "Products you'll touch", value: "5", sub: "Client work plus our own" },
                      { label: "Ownership model", value: "Unfunded", sub: "Accountable to clients, not a cap table" },
                    ].map((f) => (
                      <div key={f.label} className="flex items-baseline justify-between gap-4 py-3">
                        <dt className="text-sm text-uk-gray">
                          {f.label}
                          <span className="block text-xs text-uk-muted">{f.sub}</span>
                        </dt>
                        <dd className="whitespace-nowrap font-heading text-base font-bold text-uk-blue">{f.value}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              </Reveal>
            </div>
          </Container>
        </section>

        {/* Perks */}
        <section className="relative bg-uk-surface-2 border-b border-uk-line">
          <Container className="grid grid-cols-1 gap-px overflow-hidden sm:grid-cols-2 lg:grid-cols-4">
            {perks.map((p) => (
              <div key={p.title} className="flex flex-col gap-2 px-5 py-8">
                <Heart className="h-6 w-6 text-uk-blue" />
                <h3 className="font-heading text-base font-bold text-uk-heading">{p.title}</h3>
                <p className="text-sm leading-relaxed text-uk-gray">{p.desc}</p>
              </div>
            ))}
          </Container>
        </section>

        {/* Open roles */}
        <section className="relative bg-uk-surface section-py">
          <Container>
            <Reveal className="max-w-2xl">
              <span className="inline-flex w-fit items-center gap-2 rounded-full border border-uk-blue/30 bg-uk-blue/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.22em] text-uk-blue">
                Open roles
              </span>
              <h2 className="mt-5 font-heading text-3xl font-bold text-uk-heading sm:text-4xl">
                Positions we&apos;re hiring for
              </h2>
              <p className="mt-4 text-lg text-uk-gray">
                Don&apos;t see your role? Email us with what you build and what
                you&apos;re looking for — we hire for people, not just open reqs.
              </p>
            </Reveal>

            <Reveal staggerChildren className="mt-12 flex flex-col gap-4">
              {careers.map((c) => (
                <article
                  key={c.role}
                  className="group flex flex-col gap-4 rounded-2xl border border-uk-line bg-uk-card p-6 transition-all duration-300 hover:-translate-y-1 hover:border-uk-blue/40 hover:shadow-premium-lg sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex flex-col gap-2">
                    <h3 className="font-heading text-lg font-bold text-uk-heading">
                      {c.role}
                    </h3>
                    <p className="text-sm text-uk-gray">{c.summary}</p>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-uk-gray">
                      <span className="inline-flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-uk-blue" />
                        {c.location}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <Briefcase className="h-3.5 w-3.5 text-uk-blue" />
                        {c.type}
                      </span>
                    </div>
                  </div>
                  {/* plain <a> for mailto: — next/link is for in-site pages */}
                  <a
                    href={`mailto:${settings.hr.email}?subject=${encodeURIComponent(`Application: ${c.role}`)}`}
                    className="inline-flex w-fit items-center gap-2 rounded-full border border-uk-line bg-white dark:bg-uk-card px-5 py-2.5 text-sm font-semibold text-uk-heading transition-colors group-hover:border-uk-blue/50 group-hover:text-uk-blue-bright"
                  >
                    Apply
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </a>
                </article>
              ))}
            </Reveal>
          </Container>
        </section>

        <CtaBand />
      </main>
      <Footer />
    </>
  );
}