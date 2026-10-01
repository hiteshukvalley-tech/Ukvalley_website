import type { Metadata } from "next";
import Link from "@/components/site/intent-link";
import { Check, X, ArrowRight, ShieldCheck, Clock, Rocket, Users, Target, Gauge } from "lucide-react";
import { Header } from "@/components/site/header";
import { Footer } from "@/components/site/footer";
import { ScrollProgress } from "@/components/site/scroll-progress";
import { PageHero, heroExtras } from "@/components/site/page-hero";
import { Container } from "@/components/site/container";
import { Reveal } from "@/components/site/reveal";
import { SectionHeading } from "@/components/site/section-heading";
import { ByTheNumbers } from "@/components/site/by-the-numbers";
import { CtaBand } from "@/components/site/cta";
import { stats, principles } from "@/lib/site-data";
import { getTestimonials } from "@/lib/testimonials-store";

export const metadata: Metadata = {
  title: "Why Ukvalley — code you own, SLA in writing, engineers who scope it",
  description:
    "What makes Ukvalley different from typical agencies: code ownership from day one, a 24-hour response SLA in every contract, thin-slice delivery by week three and product-grade engineering discipline.",
  alternates: { canonical: "https://ukvalley.com/why-ukvalley" },
};

const contrasts = [
  {
    us: "You own the code, repos and credentials from day one.",
    them: "Code stays with the vendor until \"handover\" — which keeps slipping.",
  },
  {
    us: "A 24-hour response SLA written into every contract.",
    them: "\"We'll get back to you soon\" — with no clock either party can check.",
  },
  {
    us: "Working software in week three — a thin slice in production.",
    them: "Six months of documents and prototypes before anyone sees software.",
  },
  {
    us: "The architect on the scoping call is the architect on the build.",
    them: "A salesperson scopes it; a rotating pool of juniors builds it.",
  },
  {
    us: "We run our own products in production — TeleValley, Dream Loans and more.",
    them: "Capability slides with no software of their own to show.",
  },
  {
    us: "Clean exit rights: documented handover and you can leave at any point.",
    them: "Lock-in by obscurity — undocumented code that only the vendor can touch.",
  },
];

const proofIcons = [ShieldCheck, Clock, Rocket, Users];

export default async function WhyUkvalleyPage() {
  const testimonials = await getTestimonials();
  return (
    <>
      <ScrollProgress />
      <Header />
      <main id="main">
        <PageHero
          variant="company"
          extras={heroExtras.company}
          eyebrow="Why Ukvalley"
          crumbs={[{ label: "Home", href: "/" }, { label: "Why Ukvalley" }]}
          title={
            <>
              Most vendors sell hours.{" "}
              <span className="text-gradient-blue">We&apos;re accountable for outcomes.</span>
            </>
          }
          description="The differences that matter when you're choosing who builds your software — stated plainly, with the receipts to back them."
        />

        {/* Stats band */}
        <section className="relative border-y border-uk-line bg-uk-surface-2">
          <Container className="grid grid-cols-2 gap-px overflow-hidden lg:grid-cols-4">
            {stats.map((s) => (
              <div key={s.label} className="flex flex-col gap-1 px-4 py-8 text-center">
                <span className="font-heading text-3xl font-bold text-uk-blue sm:text-4xl">
                  {s.value}
                </span>
                <span className="text-xs font-medium uppercase tracking-wider text-uk-gray">
                  {s.label}
                </span>
                <span className="text-xs text-uk-gray/70">{s.sub}</span>
              </div>
            ))}
          </Container>
        </section>

        {/* The problem it solves */}
        <section className="relative bg-uk-surface-2 section-py">
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
                  Why vendor selection is usually a guess dressed up as due diligence
                </h2>
                <p className="text-justify-prose text-base leading-relaxed text-uk-body sm:text-lg">
                  Every agency's homepage says "reliable", "transparent" and "client-focused" — words that carry zero information by the third portfolio page you read. Reference calls are cherry-picked by the vendor, case studies show the launch-week screenshot, not the six-month reality, and by the time you've compared five pitch decks they've all started to sound identical.
                </p>
                <p className="text-justify-prose text-base leading-relaxed text-uk-body sm:text-lg">
                  The guesswork costs buyers after the contract is signed, not before: a verbal promise about response time turns out to mean "whenever we get to it", code ownership turns out to mean "after final payment and a dispute", and the architect who impressed you on the sales call is nowhere near the actual build.
                </p>
                <p className="text-justify-prose text-base leading-relaxed text-uk-body sm:text-lg">
                  We stated the six contrasts below in writing so you can hold any vendor — including us — to the same standard before you sign, not after.
                </p>
              </Reveal>

              <Reveal className="flex flex-col gap-5">
                <div className="flex w-full flex-col rounded-2xl border border-uk-line bg-uk-card p-6 sm:p-7">
                  <h3 className="font-heading text-lg font-bold text-uk-heading">How to spot the real thing</h3>
                  <ul className="mt-4 flex flex-col gap-3.5">
                    {[
                      "Ask for the SLA in the contract, not a verbal promise",
                      "Ask who owns the code the day you sign, not after final payment",
                      "Ask to see software they run themselves, not just client work",
                      "Ask whether the scoping architect is the build architect",
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
                      { label: "Contrasts stated in writing", value: String(contrasts.length), sub: "Verifiable, not marketing" },
                      { label: "Code ownership", value: "Day one", sub: "Not after final payment" },
                      { label: "Response SLA", value: "24 hrs", sub: "In the contract" },
                      { label: "Own products in production", value: "5", sub: "Not just capability slides" },
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

        {/* The contrast */}
        <section className="relative bg-uk-surface section-py">
          <Container>
            <SectionHeading
              eyebrow="The honest comparison"
              title={<>Ukvalley vs. the typical agency engagement.</>}
              description="Six contrasts, side by side. If a vendor you're evaluating can't match the left column in writing, that's your answer."
            />
            <Reveal staggerChildren className="mt-12 flex flex-col gap-4">
              {contrasts.map((c, i) => (
                <div
                  key={i}
                  className="grid grid-cols-1 overflow-hidden rounded-2xl border border-uk-line bg-uk-card md:grid-cols-2"
                >
                  <div className="flex items-start gap-3 border-b border-uk-line bg-uk-surface-blue p-5 md:border-b-0 md:border-r">
                    <span className="flex h-8 w-8 flex-none items-center justify-center rounded-lg bg-uk-blue/15 text-uk-blue">
                      <Check className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="text-[0.68rem] font-bold uppercase tracking-[0.2em] text-uk-blue">
                        Ukvalley
                      </p>
                      <p className="mt-1 text-sm font-medium leading-snug text-uk-heading">
                        {c.us}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-5">
                    <span className="flex h-8 w-8 flex-none items-center justify-center rounded-lg bg-uk-surface-3 text-uk-muted">
                      <X className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="text-[0.68rem] font-bold uppercase tracking-[0.2em] text-uk-muted">
                        Typical agency
                      </p>
                      <p className="mt-1 text-sm leading-snug text-uk-muted">
                        {c.them}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </Reveal>
          </Container>
        </section>

        <ByTheNumbers className="bg-uk-surface" />

        {/* Principles */}
        <section className="relative bg-uk-surface-2 section-py">
          <div className="absolute inset-0 bg-dots opacity-20" aria-hidden />
          <Container className="relative">
            <SectionHeading
              eyebrow="Our principles"
              title={<>Four commitments we build on — every project.</>}
              description="These aren't values posters. Each one is a contractual term or a delivery mechanism you can verify."
            />
            <Reveal staggerChildren className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2">
              {principles.map((p, i) => {
                const Icon = proofIcons[i] ?? ShieldCheck;
                return (
                  <div
                    key={p.title}
                    className="flex gap-4 rounded-2xl border border-uk-line bg-uk-card p-6 card-hover"
                  >
                    <span className="flex h-11 w-11 flex-none items-center justify-center rounded-xl bg-uk-blue/12 text-uk-blue">
                      <Icon className="h-5 w-5" />
                    </span>
                    <div className="flex flex-col gap-1.5">
                      <h3 className="font-heading text-lg font-bold text-uk-heading">
                        {p.title}
                      </h3>
                      <p className="text-sm leading-relaxed text-uk-gray">{p.desc}</p>
                    </div>
                  </div>
                );
              })}
            </Reveal>
          </Container>
        </section>

        {/* What clients say */}
        <section className="relative bg-uk-surface section-py">
          <Container>
            <SectionHeading
              eyebrow="In their words"
              title={<>Clients who switched to us — and stayed.</>}
            />
            <Reveal staggerChildren className="mt-12 grid grid-cols-1 gap-5 md:grid-cols-2">
              {testimonials.slice(0, 4).map((t) => (
                <figure
                  key={t.name}
                  className="flex flex-col gap-4 rounded-2xl border border-uk-line bg-uk-card p-6 card-hover"
                >
                  <blockquote className="text-base leading-relaxed text-uk-body">
                    &ldquo;{t.quote}&rdquo;
                  </blockquote>
                  <figcaption className="mt-auto flex items-center gap-3 border-t border-uk-line pt-4">
                    <span className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-gradient-to-br from-uk-blue to-uk-blue-bright font-heading text-sm font-bold text-uk-white" aria-hidden>
                      {t.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-uk-heading">{t.name}</p>
                      <p className="text-xs text-uk-gray">{t.title}, {t.company}</p>
                    </div>
                  </figcaption>
                </figure>
              ))}
            </Reveal>
            <Reveal className="mt-10 flex justify-center">
              <Link
                href="/case-studies"
                className="group inline-flex items-center gap-2 rounded-full border border-uk-line bg-white dark:bg-uk-card px-5 py-2.5 text-sm font-semibold text-uk-heading transition-colors hover:border-uk-blue/50 hover:text-uk-blue-bright"
              >
                See the measured results
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Reveal>
          </Container>
        </section>

        <CtaBand />
      </main>
      <Footer />
    </>
  );
}