import type { Metadata } from "next";
import { SITE_URL } from "@/lib/site-origin";
import { editableMetadata } from "@/lib/page-metadata";
import Link from "@/components/site/intent-link";
import { ArrowRight, Quote, Star, Building2, Landmark, ShoppingBag, Truck, Target, Check, Gauge } from "lucide-react";
import { Header } from "@/components/site/header";
import { Footer } from "@/components/site/footer";
import { ScrollProgress } from "@/components/site/scroll-progress";
import { heroArtwork } from "@/components/site/page-hero";
import { EditableHero, PageBlocks } from "@/components/site/page-extras";
import { Container } from "@/components/site/container";
import { Reveal } from "@/components/site/reveal";
import { SectionHeading } from "@/components/site/section-heading";
import { ByTheNumbers } from "@/components/site/by-the-numbers";
import { ReportsSection } from "@/components/site/report-card";
import { CtaBand } from "@/components/site/cta";
import { trustedBy, stats } from "@/lib/site-data";
import { getTestimonials } from "@/lib/testimonials-store";
import { getCaseStudies } from "@/lib/cases-store";
import { ukText } from "@/lib/texts";

// Re-render at least once a minute so admin text overrides always show up.
export const revalidate = 60;

// Title and description can be replaced in Admin → Page text (SEO fields).
export const generateMetadata = () => editableMetadata("clients", baseMetadata);
const baseMetadata: Metadata = {
  title: "Client success — 150+ businesses on our software",
  description:
    "How Ukvalley clients measure our work: faster loan processing, multi-store POS rollouts, telephony costs cut by 60% and CRM pipelines with zero dropped leads. Names anonymised, numbers real.",
  alternates: { canonical: `${SITE_URL}/clients` },
};

const sectorIcons = [Landmark, ShoppingBag, Building2, Truck];

export default async function ClientsPage() {
  const testimonials = await getTestimonials();
  const caseStudies = await getCaseStudies();
  return (
    <>
      <ScrollProgress />
      <Header />
      <main id="main">
        <EditableHero pageKey="clients"
          variant="work"
          image={heroArtwork.work}
          eyebrow={ukText("Client success")}
          crumbs={[{ label: "Home", href: "/" }, { label: "Client Success" }]}
          title={
            <>{ukText("150+ clients. One standard —")}{" "}
              <span className="text-gradient-blue">{ukText("measured outcomes.")}</span>
            </>
          }
          description={ukText("We anonymise client names and publish the numbers instead. Every engagement below has a metric, a timeline and a named stack — because adjectives are easy and accountability isn't.")}
        />

        <ByTheNumbers className="bg-uk-surface" />

        {/* The problem it solves */}
        <section className="relative bg-uk-surface-2 section-py">
          <Container>
            <Reveal>
              <span className="inline-flex w-fit items-center gap-2 rounded-full border border-uk-blue/30 bg-uk-blue/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.22em] text-uk-blue">
                <Target className="h-3.5 w-3.5" />{ukText("The problem it solves")}</span>
            </Reveal>
            <div className="mt-6 grid grid-cols-1 gap-10 lg:grid-cols-[1.25fr_1fr] lg:items-start lg:gap-16">
              <Reveal className="flex flex-col gap-5">
                <h2 className="font-heading text-2xl font-bold text-uk-heading sm:text-3xl">{ukText("Why we publish numbers instead of adjectives")}</h2>
                <p className="text-justify-prose text-base leading-relaxed text-uk-body sm:text-lg">{ukText("Every software vendor claims to be reliable, fast and easy to work with — which means the words have stopped meaning anything by the time a buyer reads a third portfolio page. The result is that choosing a delivery partner comes down to who has the nicest website, not who actually ships, and that's a genuinely bad way to pick who builds your loan platform or your POS system.")}</p>
                <p className="text-justify-prose text-base leading-relaxed text-uk-body sm:text-lg">{ukText("We built this page the other way round: no client logos we haven't been given permission to show, no testimonials collected the week after launch when everyone is still excited, and no metric on this page that doesn't trace back to a named engagement with a timeline and a stack. If a claim can't be measured, it isn't here.")}</p>
                <p className="text-justify-prose text-base leading-relaxed text-uk-body sm:text-lg">{ukText("That's why every case study below states a before, an after and a timeframe, and why testimonials are collected at launch, at the first quarter and again at year one — not cherry-picked at the moment of maximum goodwill. You're welcome to call any of these clients; we'll make the introduction.")}</p>
              </Reveal>

              <Reveal className="flex flex-col gap-5">
                <div className="flex w-full flex-col rounded-2xl border border-uk-line bg-uk-card p-6 sm:p-7">
                  <h3 className="font-heading text-lg font-bold text-uk-heading">{ukText("What's on this page")}</h3>
                  <p className="mt-1 text-sm text-uk-gray">{ukText("How to read the proof below.")}</p>
                  <ul className="mt-5 flex flex-col gap-4">
                    {[
                      "Real engagements — names anonymised at client request, every metric real",
                      "Testimonials collected at launch, one quarter, and year one",
                      "Every case study links to the full sector story and stack",
                      "Ask to speak to any client — we'll make the introduction",
                    ].map((item) => (
                      <li key={item} className="flex items-start gap-3">
                        <span className="mt-0.5 flex h-6 w-6 flex-none items-center justify-center rounded-full bg-uk-blue/12 text-uk-blue">
                          <Check className="h-3.5 w-3.5" strokeWidth={3} />
                        </span>
                        <p className="text-sm leading-relaxed text-uk-body">{ukText(item)}</p>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex w-full flex-col rounded-2xl border border-uk-blue/20 bg-uk-surface-blue p-6 sm:p-7">
                  <h3 className="flex items-center gap-2 font-heading text-lg font-bold text-uk-heading">
                    <Gauge className="h-4 w-4 text-uk-blue" />{ukText("At a glance")}</h3>
                  <dl className="mt-4 flex flex-col divide-y divide-uk-line">
                    {stats.map((s) => (
                      <div key={s.label} className="flex items-baseline justify-between gap-4 py-3">
                        <dt className="text-sm text-uk-gray">
                          {ukText(s.label)}
                          <span className="block text-xs text-uk-muted">{ukText(s.sub)}</span>
                        </dt>
                        <dd className="whitespace-nowrap font-heading text-base font-bold text-uk-blue">{ukText(s.value)}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              </Reveal>
            </div>
          </Container>
        </section>

        {/* Testimonials */}
        <section className="relative bg-uk-surface-2 section-py">
          <Container>
            <SectionHeading
              eyebrow={ukText("Testimonials")}
              title={<>{ukText("What clients say after go-live.")}</>}
              description={ukText("Collected at project milestones — launch, first quarter and year one — not hand-picked launch-week quotes.")}
            />
            <Reveal staggerChildren className="mt-12 grid grid-cols-1 gap-5 md:grid-cols-2">
              {testimonials.map((t) => (
                <figure
                  key={t.name}
                  className="flex flex-col gap-4 rounded-2xl border border-uk-line bg-uk-card p-6 card-hover"
                >
                  <div className="flex items-center justify-between">
                    <Quote className="h-5 w-5 text-uk-blue/40" aria-hidden />
                    <span className="flex gap-0.5" aria-hidden>
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className="h-3.5 w-3.5 fill-uk-yellow text-uk-yellow" />
                      ))}
                    </span>
                  </div>
                  <blockquote className="text-base leading-relaxed text-uk-body">
                    &ldquo;{ukText(t.quote)}&rdquo;
                  </blockquote>
                  <figcaption className="mt-auto flex items-center gap-3 border-t border-uk-line pt-4">
                    <span className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-gradient-to-br from-uk-blue to-uk-blue-bright font-heading text-sm font-bold text-uk-white" aria-hidden>
                      {ukText(t.name.split(" ").map((n) => n[0]).join("").slice(0, 2))}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-uk-heading">{ukText(t.name)}</p>
                      <p className="text-xs text-uk-gray">{ukText(t.title)}, {ukText(t.company)}</p>
                    </div>
                  </figcaption>
                </figure>
              ))}
            </Reveal>
          </Container>
        </section>

        {/* Measured results */}
        <section className="relative bg-uk-surface section-py">
          <div className="absolute inset-0 bg-dots opacity-20" aria-hidden />
          <Container className="relative">
            <SectionHeading
              eyebrow={ukText("Measured results")}
              title={<>{ukText("Engagements with the numbers attached.")}</>}
              description={ukText(`${caseStudies.length} engagements across ${new Set(caseStudies.map((c) => c.sector)).size} sectors — each linking to the full case study.`)}
            />
            <Reveal staggerChildren className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2">
              {caseStudies.map((c, i) => {
                const Icon = sectorIcons[i % sectorIcons.length];
                return (
                  <Link
                    key={c.slug}
                    href={ukText(`/case-studies/${c.slug}`)}
                    className="group relative flex flex-col gap-4 overflow-hidden rounded-2xl border border-uk-line bg-uk-card p-6 transition-all duration-300 hover:-translate-y-1 hover:border-uk-blue/40"
                  >
                    <div className="flex items-center justify-between">
                      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-uk-blue/12 text-uk-blue">
                        <Icon className="h-5 w-5" />
                      </span>
                      <span className="rounded-full bg-uk-blue/12 px-3 py-1 text-xs font-bold uppercase tracking-wider text-uk-blue">
                        {ukText(c.sector)}
                      </span>
                    </div>
                    <h3 className="font-heading text-lg font-bold leading-snug text-uk-heading">
                      {ukText(c.title)}
                    </h3>
                    <div className="grid grid-cols-1 gap-2 border-t border-uk-line pt-4 xl:grid-cols-3 xl:gap-3">
                      {c.metrics.map((m) => (
                        <div key={m.label} className="flex flex-col gap-0.5">
                          <span className="font-heading text-balance text-xl font-bold text-uk-blue">{ukText(m.value)}</span>
                          <span className="text-[0.7rem] leading-tight text-uk-gray">{ukText(m.label)}</span>
                        </div>
                      ))}
                    </div>
                    <span className="mt-auto inline-flex items-center gap-2 text-sm font-semibold text-uk-blue">{ukText("Read the case study")}<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </span>
                  </Link>
                );
              })}
            </Reveal>
          </Container>
        </section>

        <ReportsSection />

        {/* Longevity / trusted brands */}
        <section className="relative bg-uk-surface-2 section-py">
          <Container>
            <Reveal className="flex flex-col items-center gap-3 text-center">
              <h2 className="font-heading text-2xl font-bold text-uk-heading sm:text-3xl">{ukText("Businesses that run on Ukvalley software")}</h2>
              <p className="max-w-xl text-sm text-uk-muted">{ukText("Brands across fintech, retail, media, logistics and agriculture — several as products we build and operate ourselves.")}</p>
            </Reveal>
            <Reveal staggerChildren className="mt-10 flex flex-wrap items-center justify-center gap-3">
              {trustedBy.map((brand) => (
                <span
                  key={brand}
                  className="rounded-xl border border-uk-line bg-uk-card px-5 py-2.5 font-heading text-sm font-bold text-uk-muted shadow-float transition-colors hover:border-uk-blue/40 hover:text-uk-heading"
                >
                  {ukText(brand)}
                </span>
              ))}
            </Reveal>
            <Reveal className="mt-10 flex flex-col items-center gap-3 text-center">
              <p className="max-w-2xl text-sm leading-relaxed text-uk-gray">{ukText("Client names are anonymised at their request and replaced with representative brands. Every metric in our case studies is drawn from the engagement itself — and we're happy to walk you through how each number was measured on a call.")}</p>
              <Link
                href={ukText("/contact")}
                className="group mt-2 inline-flex items-center gap-2 text-sm font-semibold text-uk-blue transition-colors hover:text-uk-blue-bright"
              >{ukText("Ask us anything — book a scoping call")}<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Reveal>
          </Container>
        </section>

        <CtaBand />
        <PageBlocks pageKey="clients" />
      </main>
      <Footer />
    </>
  );
}