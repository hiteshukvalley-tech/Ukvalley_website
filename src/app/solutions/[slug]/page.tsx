import type { Metadata } from "next";
import Link from "@/components/site/intent-link";
import { notFound } from "next/navigation";
import {
  ArrowLeft, ArrowRight, Check, Plug, ChevronRight, CircleAlert, Gauge, Handshake, ShieldCheck, Target,
} from "lucide-react";
import { Header } from "@/components/site/header";
import { ScopingButton } from "@/components/site/scoping-modal";
import { Footer } from "@/components/site/footer";
import { ScrollProgress } from "@/components/site/scroll-progress";
import { PageHero, heroArtwork, oneLineTitle } from "@/components/site/page-hero";
import { Container } from "@/components/site/container";
import { Reveal } from "@/components/site/reveal";
import { CtaBand } from "@/components/site/cta";
import { TimeSavingsTable } from "@/components/site/time-savings-table";
import { principles } from "@/lib/site-data";
import { getServices } from "@/lib/services-store";
import { getSolutions } from "@/lib/solutions-store";
import { getIndustries } from "@/lib/industries-store";
import { jsonLd } from "@/lib/utils";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return (await getSolutions()).map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const s = (await getSolutions()).find((x) => x.slug === slug);
  if (!s) return {};
  return {
    title: `${s.name} — built around your workflow | Ukvalley`,
    description: s.description,
    alternates: { canonical: `https://ukvalley.com/solutions/${s.slug}` },
  };
}

export default async function SolutionPage({ params }: Props) {
  const { slug } = await params;
  const solutions = await getSolutions();
  const industries = await getIndustries();
  const s = solutions.find((x) => x.slug === slug);
  if (!s) notFound();

  const related = (await getServices()).filter((x) =>
    s.relatedServices.includes(x.href.split("/").pop() ?? "")
  );
  const relatedInds = industries.filter((i) => s.relatedIndustries.includes(i.slug));
  const others = solutions.filter((x) => x.slug !== s.slug).slice(0, 4);

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: s.faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(faqSchema) }}
      />
      <ScrollProgress />
      <Header />
      <main id="main">
        <PageHero
          image={heroArtwork.solutions}
          variant="solutions"
          eyebrow={s.category}
          crumbs={[
            { label: "Home", href: "/" },
            { label: "Solutions", href: "/solutions" },
            { label: s.name },
          ]}
          titleClassName={oneLineTitle.solutions}
          title={s.name}
          description={s.description}
        />

        {/* Metrics band */}
        <section className="relative border-y border-uk-line bg-uk-surface-2">
          <Container className="grid grid-cols-1 gap-px overflow-hidden sm:grid-cols-3">
            {s.metrics.map((m) => (
              <div key={m.label} className="flex flex-col gap-1 px-4 py-8 text-center">
                <span className="font-heading text-4xl font-bold text-uk-blue">{m.value}</span>
                <span className="text-xs font-medium uppercase tracking-wider text-uk-gray">{m.label}</span>
              </div>
            ))}
          </Container>
        </section>

        {/* Overview + best for */}
        <section className="relative bg-uk-surface section-py">
          <Container>
            {/* Eyebrow above the grid so the heading and the card beside it
                start on the same line */}
            <Reveal>
              <span className="inline-flex w-fit items-center gap-2 rounded-full border border-uk-blue/30 bg-uk-blue/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.22em] text-uk-blue">
                <Target className="h-3.5 w-3.5" />
                The problem it solves
              </span>
            </Reveal>
            <div className="mt-6 grid grid-cols-1 gap-10 lg:grid-cols-[1.25fr_1fr] lg:gap-16">
              <Reveal className="flex flex-col gap-5">
                <h2 className="font-heading text-2xl font-bold text-uk-heading sm:text-3xl">
                  Why {s.name} projects fail — and how we build them differently
                </h2>
                {s.longDescription.map((para, i) => (
                  <p key={i} className="text-justify-prose text-base leading-relaxed text-uk-body sm:text-lg">
                    {para}
                  </p>
                ))}
              </Reveal>

              <Reveal className="flex flex-col gap-5">
                <div className="flex w-full flex-col rounded-2xl border border-uk-line bg-uk-card p-6 sm:p-7">
                  <h3 className="font-heading text-lg font-bold text-uk-heading">Sound familiar?</h3>
                  <p className="mt-1 text-sm text-uk-gray">The situations clients bring to us before this system.</p>
                  <ul className="mt-5 flex flex-col gap-4">
                    {s.painPoints.map((p) => (
                      <li key={p.title} className="flex items-start gap-3">
                        <span className="mt-0.5 flex h-8 w-8 flex-none items-center justify-center rounded-lg bg-uk-blue/12 text-uk-blue">
                          <CircleAlert className="h-4 w-4" />
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
                    {s.quickFacts.map((f) => (
                      <div key={f.label} className="flex items-baseline justify-between gap-4 py-3">
                        <dt className="text-sm text-uk-gray">
                          {f.label}
                          {f.sub && <span className="block text-xs text-uk-muted">{f.sub}</span>}
                        </dt>
                        <dd className="whitespace-nowrap font-heading text-base font-bold text-uk-blue">{f.value}</dd>
                      </div>
                    ))}
                  </dl>
                  <p className="mt-4 border-t border-uk-line pt-3 text-xs text-uk-muted">
                    Typical ranges from past deployments. Your written estimate arrives within 3 business days of the scoping call.
                  </p>
                </div>
              </Reveal>
            </div>
            <Reveal className="mt-8 rounded-2xl border border-uk-blue/20 bg-uk-surface-blue p-6">
              <h3 className="font-heading text-lg font-bold text-uk-heading">
                Best fit for
              </h3>
              <div className="mt-4 flex flex-wrap gap-2">
                {s.bestFor.map((b) => (
                  <span
                    key={b}
                    className="inline-flex items-center gap-1.5 rounded-full border border-uk-line bg-uk-card px-3.5 py-1.5 text-sm font-medium text-uk-heading shadow-float"
                  >
                    <Check className="h-3.5 w-3.5 text-uk-blue" />
                    {b}
                  </span>
                ))}
              </div>
            </Reveal>
          </Container>
        </section>

        {/* Features */}
        <section className="relative bg-uk-surface-2 section-py">
          <div className="absolute inset-0 bg-dots opacity-20" aria-hidden />
          <Container className="relative">
            <Reveal className="max-w-2xl">
              <h2 className="font-heading text-2xl font-bold text-uk-heading sm:text-3xl">
                What it includes
              </h2>
              <p className="mt-3 text-uk-gray">
                Every capability below ships as standard — customised to your
                workflow in the scoping week, not sold as extra modules.
              </p>
            </Reveal>
            <Reveal staggerChildren className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {s.features.map((f) => (
                <div
                  key={f.title}
                  className="flex flex-col gap-2 rounded-2xl border border-uk-line bg-uk-card p-6 card-hover"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-uk-blue/12 text-uk-blue">
                    <Check className="h-5 w-5" />
                  </span>
                  <h3 className="font-heading text-base font-bold text-uk-heading">
                    {f.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-uk-gray">{f.desc}</p>
                </div>
              ))}
            </Reveal>

            <Reveal className="mt-10">
              <h3 className="font-heading text-base font-bold text-uk-heading">
                Modules at a glance
              </h3>
              <div className="mt-4 flex flex-wrap gap-2">
                {s.modules.map((m) => (
                  <span
                    key={m}
                    className="rounded-full border border-uk-line bg-uk-card px-3.5 py-1.5 text-sm font-medium text-uk-body transition-colors hover:border-uk-blue/40 hover:text-uk-blue"
                  >
                    {m}
                  </span>
                ))}
              </div>
            </Reveal>
          </Container>
        </section>

        {/* Workflow */}
        <section className="relative bg-uk-surface section-py">
          <Container>
            <Reveal className="max-w-2xl">
              <h2 className="font-heading text-2xl font-bold text-uk-heading sm:text-3xl">
                How the build runs
              </h2>
            </Reveal>
            <Reveal staggerChildren className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2">
              {s.workflow.map((w, i) => (
                <div
                  key={w.title}
                  className="flex gap-4 rounded-2xl border border-uk-line bg-uk-card p-6 card-hover"
                >
                  <span className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-uk-blue/12 font-heading text-sm font-bold text-uk-blue">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="flex flex-col gap-1.5">
                    <h3 className="font-heading text-base font-bold text-uk-heading">
                      {w.title}
                    </h3>
                    <p className="text-sm leading-relaxed text-uk-gray">{w.desc}</p>
                  </div>
                </div>
              ))}
            </Reveal>

            <Reveal className="mt-10 flex flex-col gap-3">
              <h3 className="flex items-center gap-2 font-heading text-base font-bold text-uk-heading">
                <Plug className="h-4 w-4 text-uk-blue" />
                Integrates with
              </h3>
              <div className="flex flex-wrap gap-2">
                {s.integrations.map((t) => (
                  <span
                    key={t}
                    className="rounded-md bg-uk-surface-blue px-2.5 py-1 text-[0.78rem] font-medium text-uk-body"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </Reveal>
          </Container>
        </section>

        {/* Outcomes + what we need from you */}
        <section className="relative bg-uk-surface-2 section-py">
          <Container>
            <Reveal className="rounded-3xl border border-uk-blue/20 bg-uk-surface-blue p-6 sm:p-10">
              <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_1.4fr]">
                <div>
                  <span className="inline-flex w-fit items-center gap-2 rounded-full bg-uk-blue/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.22em] text-uk-blue">
                    Outcomes
                  </span>
                  <h2 className="mt-4 font-heading text-2xl font-bold text-uk-heading sm:text-3xl">
                    What changes after go-live
                  </h2>
                  <p className="mt-3 text-sm leading-relaxed text-uk-gray sm:text-base">
                    Every item here is a measurable state you can check on your own system a month
                    after launch — not an adjective.
                  </p>
                  <div className="mt-6 rounded-2xl border border-uk-line bg-uk-card p-5">
                    <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-uk-muted">
                      <ShieldCheck className="h-4 w-4 text-uk-blue" />
                      Guaranteed in the contract
                    </p>
                    <ul className="mt-3 flex flex-col gap-2.5">
                      {principles.map((p) => (
                        <li key={p.title} className="flex items-start gap-2.5 text-sm font-medium text-uk-heading">
                          <span className="mt-0.5 flex h-5 w-5 flex-none items-center justify-center rounded-full bg-uk-blue/12 text-uk-blue">
                            <Check className="h-3 w-3" strokeWidth={3} />
                          </span>
                          {p.title}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                <ul className="flex flex-col gap-3">
                  {s.outcomes.map((o) => (
                    <li key={o} className="flex items-start gap-3 rounded-xl border border-uk-line bg-uk-card px-4 py-3 text-sm leading-relaxed text-uk-body sm:text-base">
                      <span className="mt-0.5 flex h-5 w-5 flex-none items-center justify-center rounded-full bg-uk-blue/12 text-uk-blue">
                        <Check className="h-3 w-3" strokeWidth={3} />
                      </span>
                      {o}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>

            <Reveal className="mt-8 rounded-2xl border border-uk-line bg-uk-card p-6 sm:p-7">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-uk-blue">
                    <Handshake className="h-4 w-4" />
                    What we need from you
                  </span>
                  <h3 className="mt-2 font-heading text-lg font-bold text-uk-heading">
                    Four things that make the scoping week productive
                  </h3>
                </div>
                <p className="max-w-md text-sm text-uk-gray">
                  None of these are hard; all of them are the difference between a thin slice in week three and one in week six.
                </p>
              </div>
              <ul className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {s.youProvide.map((y, i) => (
                  <li key={y} className="flex items-start gap-3 rounded-xl border border-uk-line bg-uk-surface px-4 py-3 text-sm leading-relaxed text-uk-body">
                    <span className="flex h-6 w-6 flex-none items-center justify-center rounded-md bg-uk-blue/12 font-heading text-xs font-bold text-uk-blue">
                      {i + 1}
                    </span>
                    {y}
                  </li>
                ))}
              </ul>
            </Reveal>
          </Container>
        </section>

        <TimeSavingsTable rows={s.timeSavings} name={s.name} />

        {/* FAQs — heading top-left, questions in a 2×2 grid below */}
        <section className="relative bg-uk-surface-2 section-py">
          <Container>
            <Reveal className="max-w-2xl">
              <h2 className="font-heading text-2xl font-bold text-uk-heading sm:text-3xl">
                Common questions
              </h2>
            </Reveal>
            <Reveal staggerChildren className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {s.faqs.map((f) => (
                <details
                  key={f.q}
                  className="group h-fit rounded-2xl border border-uk-line bg-uk-card px-5 py-4 transition-colors hover:border-uk-blue/40 open:border-uk-blue/40"
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-heading text-base font-semibold text-uk-heading [&::-webkit-details-marker]:hidden">
                    {f.q}
                    <ChevronRight className="h-4 w-4 flex-none text-uk-muted transition-transform group-open:rotate-90" />
                  </summary>
                  <p className="mt-3 text-sm leading-relaxed text-uk-gray">{f.a}</p>
                </details>
              ))}
            </Reveal>
          </Container>
        </section>

        {/* Related */}
        <section className="relative bg-uk-surface section-py">
          <Container>
            <Reveal className="max-w-2xl">
              <h2 className="font-heading text-2xl font-bold text-uk-heading sm:text-3xl">
                Related services &amp; industries
              </h2>
            </Reveal>
            <Reveal staggerChildren className="mt-10 grid grid-cols-1 gap-5 lg:grid-cols-2">
              <div className="flex flex-col gap-3">
                <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-uk-muted">
                  Services that power it
                </h3>
                {related.map((x) => (
                  <Link
                    key={x.href}
                    href={x.href}
                    className="group flex items-center justify-between gap-4 rounded-2xl border border-uk-line bg-uk-card p-5 card-premium card-spotlight transition-colors hover:border-uk-blue/40"
                  >
                    <span className="font-heading text-sm font-bold text-uk-heading">
                      {x.title}
                    </span>
                    <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-uk-blue/10 text-uk-blue transition-all group-hover:bg-uk-blue group-hover:text-uk-white">
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  </Link>
                ))}
              </div>
              <div className="flex flex-col gap-3">
                <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-uk-muted">
                  Industries where it runs
                </h3>
                {relatedInds.map((x) => (
                  <Link
                    key={x.slug}
                    href={`/industries/${x.slug}`}
                    className="group flex items-center justify-between gap-4 rounded-2xl border border-uk-line bg-uk-card p-5 card-premium card-spotlight transition-colors hover:border-uk-blue/40"
                  >
                    <span className="font-heading text-sm font-bold text-uk-heading">
                      {x.name}
                    </span>
                    <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-uk-blue/10 text-uk-blue transition-all group-hover:bg-uk-blue group-hover:text-uk-white">
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  </Link>
                ))}
              </div>
            </Reveal>

            {/* Other solutions */}
            <Reveal className="mt-12 border-t border-uk-line pt-10">
              <h3 className="font-heading text-base font-bold text-uk-heading">
                Explore other solutions
              </h3>
              <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {others.map((o) => (
                  <Link
                    key={o.slug}
                    href={`/solutions/${o.slug}`}
                    className="group flex items-center justify-between gap-3 rounded-xl border border-uk-line bg-uk-card px-4 py-3 transition-colors hover:border-uk-blue/40"
                  >
                    <span className="text-sm font-medium text-uk-heading">{o.name}</span>
                    <ArrowRight className="h-4 w-4 flex-none text-uk-blue opacity-0 transition-opacity group-hover:opacity-100" />
                  </Link>
                ))}
              </div>
            </Reveal>

            <Reveal className="mt-10 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-uk-blue/20 bg-uk-surface-blue p-6">
              <div>
                <h3 className="font-heading text-lg font-bold text-uk-heading">
                  Want {s.name} built around your workflow?
                </h3>
                <p className="mt-1 text-sm text-uk-gray">
                  Book a free scoping call — a written estimate in 3 days.
                </p>
              </div>
              <ScopingButton className="btn-sheen btn-lift group inline-flex cursor-pointer items-center gap-2 rounded-full bg-uk-blue px-5 py-2.5 text-sm font-semibold text-white shadow-glow-blue-sm hover:bg-uk-blue-bright">
                Book a scoping call
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </ScopingButton>
            </Reveal>

            <Reveal className="mt-10 border-t border-uk-line pt-8">
              <Link
                href="/solutions"
                className="group inline-flex items-center gap-2 text-sm font-semibold text-uk-blue transition-colors hover:text-uk-blue-bright"
              >
                <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                All solutions
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