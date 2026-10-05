import type { Metadata } from "next";
import { withSharePreview } from "@/lib/page-metadata";
import Link from "@/components/site/intent-link";
import { notFound } from "next/navigation";
import {
  ArrowLeft, ArrowRight, Users, Calendar, Layers, Check, CircleAlert,
  Plug, Quote, TrendingUp, Building2,
} from "lucide-react";
import { Header } from "@/components/site/header";
import { ScopingButton } from "@/components/site/scoping-modal";
import { Footer } from "@/components/site/footer";
import { ScrollProgress } from "@/components/site/scroll-progress";
import { PageHero, heroArtwork } from "@/components/site/page-hero";
import { Container } from "@/components/site/container";
import { Reveal } from "@/components/site/reveal";
import { GrowBar } from "@/components/site/grow-bar";
import { CtaBand } from "@/components/site/cta";
import { getCaseStudies } from "@/lib/cases-store";
import { jsonLd } from "@/lib/utils";
import { ukText } from "@/lib/texts";

// Re-render at least once a minute so admin text overrides always show up.
export const revalidate = 60;


type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return (await getCaseStudies()).map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const c = (await getCaseStudies()).find((x) => x.slug === slug);
  if (!c) return {};
  return withSharePreview({
    title: `${c.title} — ${c.sector} case study`,
    description: c.result,
    alternates: { canonical: `https://ukvalley.com/case-studies/${c.slug}` },
    openGraph: {
      type: "article",
      title: c.title,
      description: c.result,
    },
  });
}

export default async function CaseStudyPage({ params }: Props) {
  const { slug } = await params;
  const caseStudies = await getCaseStudies();
  const c = caseStudies.find((x) => x.slug === slug);
  if (!c) notFound();

  // Related engagements: same sector first, then the next few in the list.
  const related = [
    ...caseStudies.filter((x) => x.slug !== c.slug && x.sector === c.sector),
    ...caseStudies.filter((x) => x.slug !== c.slug && x.sector !== c.sector),
  ].slice(0, 3);

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: c.title,
    description: c.result,
    about: c.sector,
    author: { "@type": "Organization", name: "Ukvalley Technologies" },
    publisher: {
      "@type": "Organization",
      name: "Ukvalley Technologies",
      url: "https://ukvalley.com",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(articleSchema) }}
      />
      <ScrollProgress />
      <Header />
      <main id="main">
        <PageHero variant="work"
          image={heroArtwork.work}
          eyebrow={ukText(c.sector)}
          crumbs={[
            { label: "Home", href: "/" },
            { label: "Case Studies", href: "/case-studies" },
            { label: c.client },
          ]}
          title={ukText(c.title)}
          description={
            <>
              <span className="font-semibold text-uk-heading">{ukText(c.client)}.</span>{" "}
              {ukText(c.result)}
            </>
          }
        />

        {/* Metrics band */}
        <section className="relative bg-uk-surface-2 border-y border-uk-line">
          <Container className="grid grid-cols-1 gap-px overflow-hidden sm:grid-cols-3">
            {c.metrics.map((m, i) => (
              <div key={m.label} className="flex flex-col items-center gap-2 px-4 py-8 text-center">
                <span className="font-heading text-4xl font-bold text-uk-blue">{ukText(m.value)}</span>
                <GrowBar className="h-1 w-16 rounded-full bg-gradient-to-r from-uk-blue to-uk-yellow" delay={i * 120} />
                <span className="text-xs font-medium uppercase tracking-wider text-uk-gray">{ukText(m.label)}</span>
              </div>
            ))}
          </Container>
        </section>

        {/* At a glance + sector context */}
        <section className="relative bg-uk-surface section-py">
          <Container className="max-w-5xl">
            <Reveal className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Meta icon={Calendar} label={ukText("Timeline")} value={c.timeline} />
              <Meta icon={Users} label={ukText("Team")} value={c.team} />
              <Meta icon={Layers} label={ukText("Stack")} value={c.stack.join(" · ")} />
            </Reveal>

            {c.teamMembers && c.teamMembers.length > 0 && (
              <Reveal className="mt-4 flex flex-wrap items-center gap-2" aria-label={ukText("The team")}>
                <span className="mr-1 text-xs font-medium uppercase tracking-wider text-uk-gray">{ukText("The team")}</span>
                {c.teamMembers.map((name) => (
                  <span key={name} className="rounded-full border border-uk-line bg-uk-card px-3 py-1 text-sm font-medium text-uk-heading">{ukText(name)}</span>
                ))}
              </Reveal>
            )}

            <Reveal className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_1.2fr]">
              <div>
                <span className="inline-flex w-fit items-center gap-2 rounded-full border border-uk-blue/30 bg-uk-blue/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.22em] text-uk-blue">
                  <Building2 className="h-3.5 w-3.5" />{ukText("Sector reality")}</span>
                <h2 className="mt-5 font-heading text-2xl font-bold text-uk-heading sm:text-3xl">{ukText("The world this system had to work in")}</h2>
                <p className="text-justify-prose mt-4 text-base leading-relaxed text-uk-body sm:text-lg">
                  {ukText(c.industryContext)}
                </p>
              </div>
              <div className="rounded-2xl border border-uk-line bg-uk-card p-6 sm:p-7">
                <h3 className="font-heading text-lg font-bold text-uk-heading">{ukText("The challenge")}</h3>
                <p className="text-justify-prose mt-3 text-sm leading-relaxed text-uk-gray sm:text-base">
                  {ukText(c.problem)}
                </p>
                <p className="mt-5 text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-uk-muted">{ukText("What we found on day one")}</p>
                <ul className="mt-3 flex flex-col gap-2.5">
                  {c.challenges.map((ch) => (
                    <li key={ch} className="flex items-start gap-2.5 text-sm leading-snug text-uk-body">
                      <CircleAlert className="mt-0.5 h-4 w-4 flex-none text-uk-blue" />
                      {ukText(ch)}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          </Container>
        </section>

        {/* Solution + modules */}
        <section className="relative bg-uk-surface-2 section-py">
          <div className="absolute inset-0 bg-dots opacity-20" aria-hidden />
          <Container className="relative max-w-5xl">
            <Reveal className="max-w-3xl">
              <span className="inline-flex w-fit items-center gap-2 rounded-full border border-uk-blue/30 bg-uk-blue/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.22em] text-uk-blue">{ukText("What we built")}</span>
              <h2 className="mt-5 font-heading text-2xl font-bold text-uk-heading sm:text-3xl">{ukText("The solution")}</h2>
              <p className="text-justify-prose mt-4 text-base leading-relaxed text-uk-body sm:text-lg">
                {ukText(c.solution)}
              </p>
            </Reveal>

            <Reveal staggerChildren className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {c.modules.map((m, i) => (
                <div
                  key={m.title}
                  className="flex flex-col gap-2 rounded-2xl border border-uk-line bg-uk-card p-5 card-hover"
                >
                  <span className="font-heading text-xs font-bold text-uk-blue/60">
                    {ukText(String(i + 1).padStart(2, "0"))}
                  </span>
                  <h3 className="font-heading text-base font-bold text-uk-heading">{ukText(m.title)}</h3>
                  <p className="text-sm leading-relaxed text-uk-gray">{ukText(m.desc)}</p>
                </div>
              ))}
            </Reveal>

            <Reveal className="mt-8 flex flex-col gap-3">
              <h3 className="flex items-center gap-2 font-heading text-base font-bold text-uk-heading">
                <Plug className="h-4 w-4 text-uk-blue" />{ukText("Integrated with")}</h3>
              <div className="flex flex-wrap gap-2">
                {c.integrations.map((t) => (
                  <span
                    key={t}
                    className="rounded-md bg-uk-surface-blue px-2.5 py-1 text-[0.78rem] font-medium text-uk-body"
                  >
                    {ukText(t)}
                  </span>
                ))}
              </div>
            </Reveal>
          </Container>
        </section>

        {/* Approach */}
        <section className="relative bg-uk-surface section-py">
          <Container className="max-w-5xl">
            <Reveal className="max-w-2xl">
              <span className="inline-flex w-fit items-center gap-2 rounded-full border border-uk-blue/30 bg-uk-blue/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.22em] text-uk-blue">{ukText("How we ran it")}</span>
              <h2 className="mt-5 font-heading text-2xl font-bold text-uk-heading sm:text-3xl">{ukText("Our approach, step by step")}</h2>
            </Reveal>
            <Reveal staggerChildren className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {c.approach.map((a, i) => (
                <div key={i} className="flex items-start gap-4 rounded-2xl border border-uk-line bg-uk-card p-5 card-hover">
                  <span className="flex h-9 w-9 flex-none items-center justify-center rounded-lg bg-uk-blue/15 font-heading text-sm font-bold text-uk-blue">
                    {ukText(String(i + 1).padStart(2, "0"))}
                  </span>
                  <p className="text-sm leading-relaxed text-uk-body sm:text-base">{ukText(a)}</p>
                </div>
              ))}
            </Reveal>
          </Container>
        </section>

        {/* Results + testimonial */}
        <section className="relative bg-uk-surface-2 section-py">
          <Container className="max-w-5xl">
            <Reveal className="grid grid-cols-1 gap-6 lg:grid-cols-[1.2fr_1fr]">
              <div className="rounded-2xl border border-uk-blue/20 bg-uk-surface-blue p-6 sm:p-8">
                <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-uk-blue">
                  <TrendingUp className="h-4 w-4" />{ukText("Measured results")}</span>
                <h2 className="mt-3 font-heading text-2xl font-bold text-uk-heading sm:text-3xl">{ukText("The outcome")}</h2>
                <ul className="mt-5 flex flex-col gap-3">
                  {c.results.map((r) => (
                    <li key={r} className="flex items-start gap-3 text-sm leading-relaxed text-uk-body sm:text-base">
                      <span className="mt-0.5 flex h-5 w-5 flex-none items-center justify-center rounded-full bg-uk-blue/12 text-uk-blue">
                        <Check className="h-3 w-3" strokeWidth={3} />
                      </span>
                      {ukText(r)}
                    </li>
                  ))}
                </ul>
              </div>
              <figure className="flex flex-col gap-5 rounded-2xl border border-uk-line bg-uk-card p-6 sm:p-8">
                <Quote className="h-8 w-8 text-uk-blue/30" aria-hidden />
                <blockquote className="text-base leading-relaxed text-uk-body sm:text-lg">
                  &ldquo;{ukText(c.testimonial.quote)}&rdquo;
                </blockquote>
                <figcaption className="mt-auto flex items-center gap-3 border-t border-uk-line pt-4">
                  <span className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-gradient-to-br from-uk-blue to-uk-blue-bright font-heading text-sm font-bold text-uk-white" aria-hidden>
                    {ukText(c.testimonial.name.split(" ").map((n) => n[0]).join("").slice(0, 2))}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-uk-heading">{ukText(c.testimonial.name)}</p>
                    <p className="text-xs text-uk-gray">{ukText(c.testimonial.role)}</p>
                  </div>
                </figcaption>
              </figure>
            </Reveal>
          </Container>
        </section>

        {/* Related + CTA */}
        <section className="relative bg-uk-surface section-py">
          <Container className="max-w-5xl">
            <Reveal className="flex flex-wrap items-end justify-between gap-4">
              <h2 className="font-heading text-2xl font-bold text-uk-heading sm:text-3xl">{ukText("More engagements")}</h2>
              <Link
                href={ukText("/case-studies")}
                className="group inline-flex items-center gap-2 text-sm font-semibold text-uk-blue transition-colors hover:text-uk-blue-bright"
              >{ukText("All ")}{ukText(caseStudies.length)}{" "}{ukText("case studies")}<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Reveal>
            <Reveal staggerChildren className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
              {related.map((r) => (
                <Link
                  key={r.slug}
                  href={ukText(`/case-studies/${r.slug}`)}
                  className="group flex flex-col gap-3 rounded-2xl border border-uk-line bg-uk-card p-5 transition-all duration-300 hover:-translate-y-1 hover:border-uk-blue/40"
                >
                  <span className="inline-flex w-fit items-center rounded-full bg-uk-blue/12 px-2.5 py-1 text-[0.68rem] font-bold uppercase tracking-wider text-uk-blue">
                    {ukText(r.sector)}
                  </span>
                  <span className="font-heading text-base font-bold leading-snug text-uk-heading">
                    {ukText(r.title)}
                  </span>
                  <span className="mt-auto inline-flex items-center gap-1.5 text-xs font-semibold text-uk-blue">
                    {r.metrics[0]
                      ? <>{ukText(r.metrics[0].value)} {ukText(r.metrics[0].label.toLowerCase())}</>
                      : ukText("Read the case study")}
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                  </span>
                </Link>
              ))}
            </Reveal>

            <Reveal className="mt-10 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-uk-blue/20 bg-uk-surface-blue p-6">
              <div>
                <h3 className="font-heading text-lg font-bold text-uk-heading">{ukText("Facing a similar challenge in ")}{ukText(c.sector.toLowerCase())}?
                </h3>
                <p className="mt-1 text-sm text-uk-gray">{ukText("Book a free scoping call — a written rough estimate in 3 days, a fixed proposal in 7.")}</p>
              </div>
              <ScopingButton className="btn-sheen btn-lift group inline-flex cursor-pointer items-center gap-2 rounded-full bg-uk-blue px-5 py-2.5 text-sm font-semibold text-white shadow-glow-blue-sm hover:bg-uk-blue-bright">{ukText("Book a scoping call")}<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </ScopingButton>
            </Reveal>

            <Reveal className="mt-10 border-t border-uk-line pt-8">
              <Link
                href={ukText("/case-studies")}
                className="group inline-flex items-center gap-2 text-sm font-semibold text-uk-blue transition-colors hover:text-uk-blue-bright"
              >
                <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />{ukText("All case studies")}</Link>
            </Reveal>
          </Container>
        </section>

        <CtaBand />
      </main>
      <Footer />
    </>
  );
}

function Meta({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-uk-line bg-uk-card p-4">
      <Icon className="mt-0.5 h-5 w-5 flex-none text-uk-blue" />
      <div>
        <p className="text-xs font-medium uppercase tracking-wider text-uk-gray">{ukText(label)}</p>
        <p className="text-sm font-medium text-uk-heading">{ukText(value)}</p>
      </div>
    </div>
  );
}
