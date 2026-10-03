import type { Metadata } from "next";
import Link from "@/components/site/intent-link";
import { notFound } from "next/navigation";
import {
  ArrowRight, ArrowLeft, Check, CircleAlert, ChevronRight, Layers, Target, Briefcase,
  Gauge, Handshake, ShieldCheck,
} from "lucide-react";
import { Header } from "@/components/site/header";
import { ScopingButton } from "@/components/site/scoping-modal";
import { Footer } from "@/components/site/footer";
import { ScrollProgress } from "@/components/site/scroll-progress";
import { PageHero, heroArtwork, oneLineTitle } from "@/components/site/page-hero";
import { Container } from "@/components/site/container";
import { Reveal } from "@/components/site/reveal";
import { TimeSavingsTable } from "@/components/site/time-savings-table";
import { CtaBand } from "@/components/site/cta";
import { services, getServiceDetail, principles, type Service, type ServiceDetail } from "@/lib/site-data";

import { getServices } from "@/lib/services-store";
import { capitalize, countWord } from "@/lib/services-validation";
import { getCaseStudies } from "@/lib/cases-store";
import { getIndustries } from "@/lib/industries-store";
import { jsonLd } from "@/lib/utils";
import { ukText } from "@/lib/texts";

// Re-render at least once a minute so admin text overrides always show up.
export const revalidate = 60;

type Props = { params: Promise<{ slug: string }> };

/**
 * A service created in the admin has no hand-written detail content. Rather
 * than 404 (its card and menu links point here), build a page from the record
 * plus the company-wide engagement terms; service-specific sections that have
 * no content are left out below.
 */
function fallbackDetail(slug: string, service: Service): ServiceDetail {
  return {
    slug,
    longDescription: service.blurb,
    capabilities: service.bullets.map((b) => ({ title: b, desc: "" })),
    deliverables: [
      "Source code and repositories in your accounts from day one",
      "Automated tests wired into CI on every merge",
      "Deployment to infrastructure you own",
      "Documentation and a recorded handover walkthrough",
    ],
    process: [
      "Free 30-minute scoping call with an architect",
      "Written rough estimate within 3 business days",
      "Fixed proposal in 7 days, or start with a first sprint",
      "Thin-slice prototype by week three, then weekly demos to launch",
    ],
    serviceFaqs: [],
    relatedIndustries: [],
    metrics: [],
    whyUs: principles,
    overview: [service.blurb],
    painPoints: [],
    useCases: [],
    outcomes: [],
    timeSavings: [],
    techs: [],
    quickFacts: [],
    youProvide: [],
    bestFor: service.blurb,
  };
}

export function generateStaticParams() {
  return services.map((s) => ({ slug: s.href.split("/").pop()! }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const service = (await getServices()).find((s) => s.href.endsWith(`/${slug}`));
  if (!service) return {};
  const detail = getServiceDetail(slug);
  return {
    title: `${service.title} — Ukvalley Technologies`,
    description: detail?.longDescription ?? service.blurb,
    alternates: { canonical: `https://ukvalley.com/services/${slug}` },
  };
}

export default async function ServicePage({ params }: Props) {
  const { slug } = await params;
  // Admin-managed list: a service that is unpublished or deleted there 404s here.
  const liveServices = await getServices();
  const caseStudies = await getCaseStudies();
  const industries = await getIndustries();
  const service = liveServices.find((s) => s.href.endsWith(`/${slug}`));
  if (!service) notFound();
  const detail = getServiceDetail(slug) ?? fallbackDetail(slug, service);

  const related = detail.relatedIndustries
    .map((s) => industries.find((i) => i.slug === s))
    .filter(Boolean);

  // Case studies whose sector matches one of this service's related industries.
  const sectorNames = new Set(related.map((i) => i!.name.toLowerCase()));
  const proof = caseStudies
    .filter((c) => {
      const s = c.sector.toLowerCase();
      return [...sectorNames].some((n) => n.includes(s.split(" ")[0]) || s.includes(n.split(" ")[0]));
    })
    .slice(0, 3);

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: detail.serviceFaqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  const serviceSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    serviceType: service.title,
    provider: {
      "@type": "Organization",
      name: "Ukvalley Technologies",
      url: "https://ukvalley.com",
    },
    areaServed: "IN & Global",
    description: detail.longDescription,
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(serviceSchema) }} />
      {detail.serviceFaqs.length > 0 && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(faqSchema) }} />
      )}
      <ScrollProgress />
      <Header />
      <main id="main">
        <PageHero
          image={{ ...heroArtwork.services, stat: { ...heroArtwork.services.stat, value: String(liveServices.length) } }}
          titleClassName={oneLineTitle.services}
          eyebrow={ukText("Service")}
          crumbs={[
            { label: "Home", href: "/" },
            { label: "Services", href: "/services" },
            { label: service.title },
          ]}
          title={ukText(service.title)}
          description={ukText(detail.longDescription)}
        />

        {/* Proof band */}
        {detail.metrics.length > 0 && (
        <section className="relative border-y border-uk-line bg-uk-surface-2">
          <Container className="grid grid-cols-1 gap-px overflow-hidden sm:grid-cols-3">
            {detail.metrics.map((m) => (
              <div key={m.label} className="flex flex-col gap-1 px-4 py-8 text-center">
                <span className="font-heading text-4xl font-bold text-uk-blue">{ukText(m.value)}</span>
                <span className="text-xs font-medium uppercase tracking-wider text-uk-gray">{ukText(m.label)}</span>
              </div>
            ))}
          </Container>
        </section>
        )}

        {/* Overview + pain points */}
        <section className="relative bg-uk-surface section-py">
          <Container>
            {/* Eyebrow sits above the grid so the heading and the card beside
                it start on exactly the same line */}
            <Reveal>
              <span className="inline-flex w-fit items-center gap-2 rounded-full border border-uk-blue/30 bg-uk-blue/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.22em] text-uk-blue">
                <Target className="h-3.5 w-3.5" />{ukText("The problem we solve")}</span>
            </Reveal>
            <div className="mt-6 grid grid-cols-1 gap-10 lg:grid-cols-[1.25fr_1fr] lg:gap-16">
              <Reveal className="flex flex-col gap-5">
                <h2 className="font-heading text-2xl font-bold text-uk-heading sm:text-3xl">{ukText("Why ")}{ukText(service.title)}{" "}{ukText("goes wrong — and how we do it differently")}</h2>
                {detail.overview.map((para, i) => (
                  <p key={i} className="text-justify-prose text-base leading-relaxed text-uk-body sm:text-lg">
                    {ukText(para)}
                  </p>
                ))}
              </Reveal>

              <Reveal className="flex flex-col gap-5">
                {detail.painPoints.length > 0 && (
                <div className="flex w-full flex-col rounded-2xl border border-uk-line bg-uk-card p-6 sm:p-7">
                  <h3 className="font-heading text-lg font-bold text-uk-heading">{ukText("Sound familiar?")}</h3>
                  <p className="mt-1 text-sm text-uk-gray">{ukText("The situations clients bring to this service line.")}</p>
                  <ul className="mt-5 flex flex-col gap-4">
                    {detail.painPoints.map((p) => (
                      <li key={p.title} className="flex items-start gap-3">
                        <span className="mt-0.5 flex h-8 w-8 flex-none items-center justify-center rounded-lg bg-uk-blue/12 text-uk-blue">
                          <CircleAlert className="h-4 w-4" />
                        </span>
                        <div>
                          <p className="text-sm font-semibold text-uk-heading">{ukText(p.title)}</p>
                          <p className="mt-0.5 text-sm leading-relaxed text-uk-gray">{ukText(p.desc)}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
                )}

                {/* At a glance — fills the column beside the long overview */}
                {detail.quickFacts.length > 0 && (
                <div className="flex w-full flex-col rounded-2xl border border-uk-blue/20 bg-uk-surface-blue p-6 sm:p-7">
                  <h3 className="flex items-center gap-2 font-heading text-lg font-bold text-uk-heading">
                    <Gauge className="h-4 w-4 text-uk-blue" />{ukText("At a glance")}</h3>
                  <dl className="mt-4 flex flex-col divide-y divide-uk-line">
                    {detail.quickFacts.map((f) => (
                      <div key={f.label} className="flex items-baseline justify-between gap-4 py-3">
                        <dt className="text-sm text-uk-gray">
                          {ukText(f.label)}
                          {f.sub && <span className="block text-xs text-uk-muted">{ukText(f.sub)}</span>}
                        </dt>
                        <dd className="whitespace-nowrap font-heading text-base font-bold text-uk-blue">{ukText(f.value)}</dd>
                      </div>
                    ))}
                  </dl>
                  <p className="mt-4 border-t border-uk-line pt-3 text-xs text-uk-muted">{ukText("Figures are typical ranges from past engagements. Your written estimate arrives within 3 business days of the scoping call.")}</p>
                </div>
                )}
              </Reveal>
            </div>
          </Container>
        </section>

        {/* Capabilities */}
        <section className="relative bg-uk-surface-2 section-py">
          <Container>
            <Reveal className="max-w-2xl">
              <span className="inline-flex w-fit items-center gap-2 rounded-full border border-uk-blue/30 bg-uk-blue/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.22em] text-uk-blue">{ukText("Capabilities")}</span>
              <h2 className="mt-5 font-heading text-3xl font-bold text-uk-heading sm:text-4xl">{ukText("What we build")}</h2>
            </Reveal>
            <Reveal staggerChildren className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2">
              {detail.capabilities.map((c) => (
                <div
                  key={c.title}
                  className="flex gap-4 rounded-2xl border border-uk-line bg-uk-card p-6 card-hover"
                >
                  <span className="flex h-11 w-11 flex-none items-center justify-center rounded-xl bg-uk-blue/12 text-uk-blue">
                    <Check className="h-5 w-5" />
                  </span>
                  <div className="flex flex-col gap-1.5">
                    <h3 className="font-heading text-lg font-bold text-uk-heading">{ukText(c.title)}</h3>
                    {c.desc && <p className="text-sm leading-relaxed text-uk-gray">{ukText(c.desc)}</p>}
                  </div>
                </div>
              ))}
            </Reveal>

            {detail.techs.length > 0 && (
            <Reveal className="mt-10 flex flex-col gap-3">
              <h3 className="flex items-center gap-2 font-heading text-base font-bold text-uk-heading">
                <Layers className="h-4 w-4 text-uk-blue" />{ukText("Tools & stack we use on this work")}</h3>
              <div className="flex flex-wrap gap-2">
                {detail.techs.map((t) => (
                  <span
                    key={t}
                    className="rounded-md bg-uk-surface-blue px-2.5 py-1 text-[0.78rem] font-medium text-uk-body"
                  >
                    {ukText(t)}
                  </span>
                ))}
              </div>
            </Reveal>
            )}
          </Container>
        </section>

        {/* Typical engagements */}
        {detail.useCases.length > 0 && (
        <section className="relative bg-uk-surface section-py">
          <div className="absolute inset-0 bg-dots opacity-20" aria-hidden />
          <Container className="relative">
            <Reveal className="max-w-2xl">
              <span className="inline-flex w-fit items-center gap-2 rounded-full border border-uk-blue/30 bg-uk-blue/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.22em] text-uk-blue">
                <Briefcase className="h-3.5 w-3.5" />{ukText("Typical engagements")}</span>
              <h2 className="mt-5 font-heading text-2xl font-bold text-uk-heading sm:text-3xl">{ukText("What clients usually ask us for")}</h2>
            </Reveal>
            <Reveal staggerChildren className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {detail.useCases.map((u, i) => (
                <div
                  key={u.title}
                  className="flex flex-col gap-3 rounded-2xl border border-uk-line bg-uk-card p-6 card-hover"
                >
                  <span className="font-heading text-3xl font-bold text-uk-blue/25">
                    {ukText(String(i + 1).padStart(2, "0"))}
                  </span>
                  <h3 className="font-heading text-base font-bold text-uk-heading">{ukText(u.title)}</h3>
                  <p className="text-sm leading-relaxed text-uk-gray">{ukText(u.desc)}</p>
                </div>
              ))}
            </Reveal>
          </Container>
        </section>
        )}

        {/* Deliverables + process */}
        <section className="relative bg-uk-surface-2 section-py">
          <Container>
            <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
              <Reveal className="flex flex-col gap-5">
                <span className="inline-flex w-fit items-center gap-2 rounded-full border border-uk-blue/30 bg-uk-blue/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.22em] text-uk-blue">{ukText("Deliverables")}</span>
                <h2 className="font-heading text-2xl font-bold text-uk-heading sm:text-3xl">{ukText("What you walk away with")}</h2>
                <ul className="flex flex-col gap-3">
                  {detail.deliverables.map((d) => (
                    <li key={d} className="flex items-start gap-3 text-uk-body">
                      <Check className="mt-0.5 h-5 w-5 flex-none text-uk-blue" />
                      <span className="text-sm leading-relaxed">{ukText(d)}</span>
                    </li>
                  ))}
                </ul>
              </Reveal>

              <Reveal className="flex flex-col gap-5">
                <span className="inline-flex w-fit items-center gap-2 rounded-full border border-uk-blue/30 bg-uk-blue/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.22em] text-uk-blue">{ukText("How we engage")}</span>
                <h2 className="font-heading text-2xl font-bold text-uk-heading sm:text-3xl">{ukText("The process")}</h2>
                <ol className="flex flex-col gap-4">
                  {detail.process.map((p, i) => (
                    <li key={i} className="flex items-start gap-4">
                      <span className="flex h-8 w-8 flex-none items-center justify-center rounded-lg bg-uk-blue/15 font-heading text-sm font-bold text-uk-blue">
                        {ukText(String(i + 1).padStart(2, "0"))}
                      </span>
                      <p className="text-sm leading-relaxed text-uk-body">{ukText(p)}</p>
                    </li>
                  ))}
                </ol>
              </Reveal>
            </div>

            {/* What we need from you — a good start depends on these */}
            {detail.youProvide.length > 0 && (
            <Reveal className="mt-10 rounded-2xl border border-uk-line bg-uk-card p-6 sm:p-7">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-uk-blue">
                    <Handshake className="h-4 w-4" />{ukText("What we need from you")}</span>
                  <h3 className="mt-2 font-heading text-lg font-bold text-uk-heading">{ukText("Four things that make week one productive")}</h3>
                </div>
                <p className="max-w-md text-sm text-uk-gray">{ukText("None of these are hard; all of them are the difference between a thin slice in week three and a thin slice in week six.")}</p>
              </div>
              <ul className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {detail.youProvide.map((y, i) => (
                  <li key={y} className="flex items-start gap-3 rounded-xl border border-uk-line bg-uk-surface px-4 py-3 text-sm leading-relaxed text-uk-body">
                    <span className="flex h-6 w-6 flex-none items-center justify-center rounded-md bg-uk-blue/12 font-heading text-xs font-bold text-uk-blue">
                      {i + 1}
                    </span>
                    {ukText(y)}
                  </li>
                ))}
              </ul>
            </Reveal>
            )}
          </Container>
        </section>

        {/* Outcomes */}
        {detail.outcomes.length > 0 && (
        <section className="relative bg-uk-surface section-py">
          <Container>
            <Reveal className="rounded-3xl border border-uk-blue/20 bg-uk-surface-blue p-6 sm:p-10">
              <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_1.4fr]">
                <div>
                  <span className="inline-flex w-fit items-center gap-2 rounded-full bg-uk-blue/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.22em] text-uk-blue">{ukText("Outcomes")}</span>
                  <h2 className="mt-4 font-heading text-2xl font-bold text-uk-heading sm:text-3xl">{ukText("What changes after we ship")}</h2>
                  <p className="mt-3 text-sm leading-relaxed text-uk-gray sm:text-base">{ukText("Every item here is a measurable state, not an adjective — the things you can check on your own system a month after launch.")}</p>
                  <div className="mt-6 rounded-2xl border border-uk-line bg-uk-card p-5">
                    <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-uk-muted">
                      <ShieldCheck className="h-4 w-4 text-uk-blue" />{ukText("Guaranteed in the contract")}</p>
                    <ul className="mt-3 flex flex-col gap-2.5">
                      {principles.map((p) => (
                        <li key={p.title} className="flex items-start gap-2.5 text-sm font-medium text-uk-heading">
                          <span className="mt-0.5 flex h-5 w-5 flex-none items-center justify-center rounded-full bg-uk-blue/12 text-uk-blue">
                            <Check className="h-3 w-3" strokeWidth={3} />
                          </span>
                          {ukText(p.title)}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                <ul className="flex flex-col gap-3">
                  {detail.outcomes.map((o) => (
                    <li key={o} className="flex items-start gap-3 rounded-xl border border-uk-line bg-uk-card px-4 py-3 text-sm leading-relaxed text-uk-body sm:text-base">
                      <span className="mt-0.5 flex h-5 w-5 flex-none items-center justify-center rounded-full bg-uk-blue/12 text-uk-blue">
                        <Check className="h-3 w-3" strokeWidth={3} />
                      </span>
                      {ukText(o)}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          </Container>
        </section>

        )}

        {detail.timeSavings.length > 0 && <TimeSavingsTable rows={detail.timeSavings} name={service.title} />}

        {/* Why Ukvalley for this service */}
        <section className="relative bg-uk-surface-2 section-py">
          <Container>
            <Reveal className="max-w-2xl">
              <span className="inline-flex w-fit items-center gap-2 rounded-full border border-uk-blue/30 bg-uk-blue/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.22em] text-uk-blue">{ukText("Why Ukvalley")}</span>
              <h2 className="mt-5 font-heading text-2xl font-bold text-uk-heading sm:text-3xl">{ukText("Why clients pick us for ")}{ukText(service.title)}
              </h2>
            </Reveal>
            <Reveal staggerChildren className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {detail.whyUs.map((w) => (
                <div
                  key={w.title}
                  className="flex flex-col gap-2 rounded-2xl border border-uk-line bg-uk-card p-6 card-hover"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-uk-blue/12 text-uk-blue">
                    <Check className="h-5 w-5" />
                  </span>
                  <h3 className="font-heading text-base font-bold text-uk-heading">{ukText(w.title)}</h3>
                  <p className="text-sm leading-relaxed text-uk-gray">{ukText(w.desc)}</p>
                </div>
              ))}
            </Reveal>
          </Container>
        </section>

        {/* Proof: related case studies */}
        {proof.length > 0 && (
          <section className="relative bg-uk-surface section-py">
            <Container>
              <Reveal className="flex flex-wrap items-end justify-between gap-4">
                <div className="max-w-2xl">
                  <span className="inline-flex w-fit items-center gap-2 rounded-full border border-uk-blue/30 bg-uk-blue/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.22em] text-uk-blue">{ukText("Proof")}</span>
                  <h2 className="mt-5 font-heading text-2xl font-bold text-uk-heading sm:text-3xl">{ukText("Engagements with the numbers attached")}</h2>
                </div>
                <Link
                  href={ukText("/case-studies")}
                  className="group inline-flex items-center gap-2 text-sm font-semibold text-uk-blue transition-colors hover:text-uk-blue-bright"
                >{ukText("All case studies")}<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </Reveal>
              <Reveal staggerChildren className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
                {proof.map((c) => (
                  <Link
                    key={c.slug}
                    href={ukText(`/case-studies/${c.slug}`)}
                    className="group flex flex-col gap-3 rounded-2xl border border-uk-line bg-uk-card p-5 transition-all duration-300 hover:-translate-y-1 hover:border-uk-blue/40"
                  >
                    <span className="inline-flex w-fit items-center rounded-full bg-uk-blue/12 px-2.5 py-1 text-[0.68rem] font-bold uppercase tracking-wider text-uk-blue">
                      {ukText(c.sector)}
                    </span>
                    <span className="font-heading text-base font-bold leading-snug text-uk-heading">{ukText(c.title)}</span>
                    <div className="mt-auto grid grid-cols-3 gap-2 border-t border-uk-line pt-3">
                      {c.metrics.map((m) => (
                        <div key={m.label} className="flex flex-col">
                          <span className="font-heading text-sm font-bold text-uk-blue">{ukText(m.value)}</span>
                          <span className="text-[0.65rem] leading-tight text-uk-muted">{ukText(m.label)}</span>
                        </div>
                      ))}
                    </div>
                  </Link>
                ))}
              </Reveal>
            </Container>
          </section>
        )}

        {/* Related industries */}
        {related.length > 0 && (
          <section className="relative bg-uk-surface-2 section-py">
            <Container>
              <Reveal className="max-w-2xl">
                <span className="inline-flex w-fit items-center gap-2 rounded-full border border-uk-blue/30 bg-uk-blue/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.22em] text-uk-blue">{ukText("Where it applies")}</span>
                <h2 className="mt-5 font-heading text-2xl font-bold text-uk-heading sm:text-3xl">{ukText("Industries we serve with this")}</h2>
              </Reveal>
              <Reveal staggerChildren className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {related.map((ind) => (
                  <Link
                    key={ind!.slug}
                    href={ukText(`/industries/${ind!.slug}`)}
                    className="group flex items-center justify-between gap-3 rounded-xl border border-uk-line bg-uk-card p-5 transition-colors hover:border-uk-blue/40"
                  >
                    <span className="flex flex-col gap-0.5">
                      <span className="font-heading text-base font-bold text-uk-heading">{ukText(ind!.name)}</span>
                      <span className="text-xs text-uk-muted line-clamp-1">{ukText(ind!.outcomes.join(" · "))}</span>
                    </span>
                    <ArrowRight className="h-4 w-4 flex-none text-uk-blue transition-transform group-hover:translate-x-1" />
                  </Link>
                ))}
              </Reveal>
            </Container>
          </section>
        )}

        {/* Service-specific FAQ */}
        <section className="relative bg-uk-surface section-py">
          <Container>
            {detail.serviceFaqs.length > 0 && (
            <>
            <Reveal className="max-w-2xl">
              <span className="inline-flex w-fit items-center gap-2 rounded-full border border-uk-blue/30 bg-uk-blue/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.22em] text-uk-blue">{ukText("FAQ")}</span>
              <h2 className="mt-5 font-heading text-2xl font-bold text-uk-heading sm:text-3xl">{ukText("Common questions about ")}{ukText(service.title)}
              </h2>
            </Reveal>
            <Reveal staggerChildren className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {detail.serviceFaqs.map((f) => (
                <details
                  key={f.q}
                  className="group h-fit rounded-2xl border border-uk-line bg-uk-card px-5 py-4 transition-colors hover:border-uk-blue/40 open:border-uk-blue/40"
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-heading text-base font-semibold text-uk-heading [&::-webkit-details-marker]:hidden">
                    {ukText(f.q)}
                    <ChevronRight className="h-4 w-4 flex-none text-uk-muted transition-transform group-open:rotate-90" />
                  </summary>
                  <p className="mt-3 text-sm leading-relaxed text-uk-gray">{ukText(f.a)}</p>
                </details>
              ))}
            </Reveal>
            </>
            )}

            <Reveal className={`${detail.serviceFaqs.length > 0 ? "mt-10 " : ""}flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-uk-blue/20 bg-uk-surface-blue p-6`}>
              <div>
                <h3 className="font-heading text-lg font-bold text-uk-heading">{ukText("Have a ")}{ukText(service.title)}{" "}{ukText("project in mind?")}</h3>
                <p className="mt-1 text-sm text-uk-gray">{ukText("A free 30-minute call with an architect — a written estimate in 3 days, a fixed proposal in 7.")}</p>
              </div>
              <ScopingButton className="btn-sheen btn-lift group inline-flex cursor-pointer items-center gap-2 rounded-full bg-uk-blue px-5 py-2.5 text-sm font-semibold text-white shadow-glow-blue-sm hover:bg-uk-blue-bright">{ukText("Book a scoping call")}<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </ScopingButton>
            </Reveal>
          </Container>
        </section>

        {/* Other services */}
        <section className="relative bg-uk-surface-2 border-t border-uk-line py-14">
          <Container>
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="font-heading text-xl font-bold text-uk-heading">{ukText("Explore other services")}</h2>
                <p className="mt-1 text-sm text-uk-gray">
                  {ukText(capitalize(countWord(liveServices.length)))}{" "}{ukText("service lines, one accountable team.")}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {liveServices
                  .filter((s) => s.href !== service.href)
                  .map((s) => (
                    <Link
                      key={s.href}
                      href={ukText(s.href)}
                      className="rounded-full border border-uk-line bg-uk-surface-blue px-4 py-2 text-sm font-medium text-uk-body transition-colors hover:border-uk-blue/50 hover:text-uk-blue-bright"
                    >
                      {ukText(s.title)}
                    </Link>
                  ))}
              </div>
            </div>
            <div className="mt-8">
              <Link
                href={ukText("/services")}
                className="group inline-flex items-center gap-2 text-sm font-semibold text-uk-blue transition-colors hover:text-uk-blue-bright"
              >
                <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />{ukText("All services")}</Link>
            </div>
          </Container>
        </section>

        <CtaBand />
      </main>
      <Footer />
    </>
  );
}
