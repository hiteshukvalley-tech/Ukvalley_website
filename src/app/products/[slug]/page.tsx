import type { Metadata } from "next";
import { SITE_URL } from "@/lib/site-origin";
import { fitTitle, withSharePreview } from "@/lib/page-metadata";
import Link from "@/components/site/intent-link";
import { notFound } from "next/navigation";
import {
  ArrowLeft, ArrowRight, Check, Smartphone, Users, ChevronRight,
  Layers, Target, Sparkles,
} from "lucide-react";
import { Header } from "@/components/site/header";
import { ScopingButton } from "@/components/site/scoping-modal";
import { Footer } from "@/components/site/footer";
import { ScrollProgress } from "@/components/site/scroll-progress";
import { PageHero, heroArtwork } from "@/components/site/page-hero";
import { Container } from "@/components/site/container";
import { Reveal } from "@/components/site/reveal";
import { CtaBand } from "@/components/site/cta";

import { getCaseStudies } from "@/lib/cases-store";
import { getProducts } from "@/lib/products-store";
import { jsonLd } from "@/lib/utils";
import { ukText } from "@/lib/texts";

// Re-render at least once a minute so admin text overrides always show up.
export const revalidate = 60;

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return (await getProducts()).map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const p = (await getProducts()).find((x) => x.slug === slug);
  if (!p) return {};
  return withSharePreview({
    title: fitTitle(`${p.name} — ${p.tagline}`, p.name),
    description: p.description,
    alternates: { canonical: `${SITE_URL}/products/${p.slug}` },
  });
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const products = await getProducts();
  const p = products.find((x) => x.slug === slug);
  if (!p) notFound();
  const caseStudies = await getCaseStudies();

  const others = products.filter((x) => x.slug !== p.slug);
  // A case study that mentions this product by name, if one exists.
  const relatedCase = caseStudies.find(
    (c) => c.title.includes(p.name) || c.result.includes(p.name)
  );

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: p.faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  const productSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: p.name,
    description: p.description,
    applicationCategory: "BusinessApplication",
    operatingSystem: p.platform,
    author: { "@type": "Organization", name: "Ukvalley Technologies" },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(productSchema) }} />
      {faqSchema.mainEntity.length > 0 && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(faqSchema) }} />}
      <ScrollProgress />
      <Header />
      <main id="main">
        <PageHero variant="work"
          image={heroArtwork.work}
          eyebrow={ukText(p.tagline)}
          crumbs={[
            { label: "Home", href: "/" },
            { label: "Products", href: "/products" },
            { label: p.name },
          ]}
          title={ukText(p.name)}
          description={ukText(p.description)}
        />

        {/* Overview */}
        <section className="relative bg-uk-surface-2 section-py">
          <Container className="max-w-5xl">
            <Reveal className="grid grid-cols-1 gap-6 lg:grid-cols-[1.3fr_1fr]">
              <div>
                <span className="inline-flex w-fit items-center gap-2 rounded-full border border-uk-blue/30 bg-uk-blue/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.22em] text-uk-blue">
                  <Target className="h-3.5 w-3.5" />{ukText("The problem it removes")}</span>
                <div className="mt-5 flex flex-col gap-4">
                  {p.problem.map((para, i) => (
                    <p key={i} className="text-justify-prose text-base leading-relaxed text-uk-body sm:text-lg">
                      {ukText(para)}
                    </p>
                  ))}
                </div>
              </div>
              <div className="flex flex-col gap-4">
                {p.metric && (
                  <div className="flex items-end gap-4 rounded-2xl border border-uk-blue/20 bg-uk-surface-blue p-6">
                    <span className="font-heading text-5xl font-bold text-uk-blue">{ukText(p.metric.value)}</span>
                    <span className="pb-1 text-sm text-uk-gray">{ukText(p.metric.label)}</span>
                  </div>
                )}
                <div className="flex items-start gap-3 rounded-xl border border-uk-line bg-uk-card p-4">
                  <Smartphone className="mt-0.5 h-5 w-5 flex-none text-uk-blue" />
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-uk-gray">{ukText("Platform")}</p>
                    <p className="text-sm font-medium text-uk-body">{ukText(p.platform)}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 rounded-xl border border-uk-line bg-uk-card p-4">
                  <Users className="mt-0.5 h-5 w-5 flex-none text-uk-blue" />
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-uk-gray">{ukText("Built for")}</p>
                    <p className="text-sm font-medium text-uk-body">{ukText(p.audience)}</p>
                  </div>
                </div>
              </div>
            </Reveal>
          </Container>
        </section>

        {/* Features */}
        <section className="relative bg-uk-surface section-py">
          <div className="absolute inset-0 bg-dots opacity-20" aria-hidden />
          <Container className="relative">
            <Reveal className="max-w-2xl">
              <span className="inline-flex w-fit items-center gap-2 rounded-full border border-uk-blue/30 bg-uk-blue/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.22em] text-uk-blue">
                <Sparkles className="h-3.5 w-3.5" />{ukText("Features")}</span>
              <h2 className="mt-5 font-heading text-2xl font-bold text-uk-heading sm:text-3xl">{ukText("What ")}{ukText(p.name)}{" "}{ukText("does")}</h2>
            </Reveal>
            <Reveal staggerChildren className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {p.features.map((f) => (
                <div
                  key={f.title}
                  className="flex flex-col gap-2 rounded-2xl border border-uk-line bg-uk-card p-6 card-hover"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-uk-blue/12 text-uk-blue">
                    <Check className="h-5 w-5" />
                  </span>
                  <h3 className="font-heading text-base font-bold text-uk-heading">{ukText(f.title)}</h3>
                  <p className="text-sm leading-relaxed text-uk-gray">{ukText(f.desc)}</p>
                </div>
              ))}
            </Reveal>

            <Reveal className="mt-10 flex flex-col gap-3">
              <h3 className="flex items-center gap-2 font-heading text-base font-bold text-uk-heading">
                <Layers className="h-4 w-4 text-uk-blue" />{ukText("Built with")}</h3>
              <div className="flex flex-wrap gap-2">
                {p.stack.map((t) => (
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

        {/* Outcomes + use cases */}
        <section className="relative bg-uk-surface-2 section-py">
          <Container className="max-w-5xl">
            <Reveal className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div className="rounded-2xl border border-uk-blue/20 bg-uk-surface-blue p-6 sm:p-8">
                <h2 className="font-heading text-2xl font-bold text-uk-heading">{ukText("What customers see")}</h2>
                <ul className="mt-5 flex flex-col gap-3">
                  {p.outcomes.map((o) => (
                    <li key={o} className="flex items-start gap-3 text-sm leading-relaxed text-uk-body sm:text-base">
                      <span className="mt-0.5 flex h-5 w-5 flex-none items-center justify-center rounded-full bg-uk-blue/12 text-uk-blue">
                        <Check className="h-3 w-3" strokeWidth={3} />
                      </span>
                      {ukText(o)}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-2xl border border-uk-line bg-uk-card p-6 sm:p-8">
                <h2 className="font-heading text-2xl font-bold text-uk-heading">{ukText("Who it fits")}</h2>
                <ul className="mt-5 flex flex-col gap-3">
                  {p.useCases.map((u) => (
                    <li key={u} className="flex items-start gap-3 text-sm leading-relaxed text-uk-body sm:text-base">
                      <Users className="mt-0.5 h-4 w-4 flex-none text-uk-blue" />
                      {ukText(u)}
                    </li>
                  ))}
                </ul>
                {relatedCase && (
                  <Link
                    href={ukText(`/case-studies/${relatedCase.slug}`)}
                    className="group mt-6 inline-flex items-center gap-2 rounded-full border border-uk-line bg-uk-surface-blue px-4 py-2 text-xs font-semibold text-uk-blue transition-colors hover:border-uk-blue/50"
                  >{ukText("Read the ")}{ukText(p.name)}{" "}{ukText("case study")}<ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                )}
              </div>
            </Reveal>
          </Container>
        </section>

        {/* FAQs */}
        <section className="relative bg-uk-surface section-py">
          <Container className="max-w-5xl">
            <Reveal className="max-w-2xl">
              <h2 className="font-heading text-2xl font-bold text-uk-heading sm:text-3xl">{ukText("Common questions about ")}{ukText(p.name)}
              </h2>
            </Reveal>
            <Reveal staggerChildren className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {p.faqs.map((f) => (
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
          </Container>
        </section>

        {/* Other products + CTA */}
        <section className="relative bg-uk-surface-2 section-py">
          <Container className="max-w-5xl">
            <Reveal className="max-w-2xl">
              <h2 className="font-heading text-2xl font-bold text-uk-heading sm:text-3xl">{ukText("Other products we run")}</h2>
            </Reveal>
            <Reveal staggerChildren className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {others.map((o) => (
                <Link
                  key={o.slug}
                  href={ukText(`/products/${o.slug}`)}
                  className="group flex items-center justify-between gap-3 rounded-xl border border-uk-line bg-uk-card px-4 py-3 transition-colors hover:border-uk-blue/40"
                >
                  <span className="flex flex-col">
                    <span className="text-sm font-semibold text-uk-heading">{ukText(o.name)}</span>
                    <span className="text-xs text-uk-muted">{ukText(o.tagline)}</span>
                  </span>
                  <ArrowRight className="h-4 w-4 flex-none text-uk-blue opacity-0 transition-opacity group-hover:opacity-100" />
                </Link>
              ))}
            </Reveal>

            <Reveal className="mt-10 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-uk-blue/20 bg-uk-surface-blue p-6">
              <div>
                <h3 className="font-heading text-lg font-bold text-uk-heading">{ukText("Want ")}{ukText(p.name)}{" "}{ukText("for your team — or something like it, built for you?")}</h3>
                <p className="mt-1 text-sm text-uk-gray">{ukText("Deploy the product as-is, customise it, or start a build of your own. A free scoping call decides which.")}</p>
              </div>
              <ScopingButton className="btn-sheen btn-lift group inline-flex cursor-pointer items-center gap-2 rounded-full bg-uk-blue px-5 py-2.5 text-sm font-semibold text-white shadow-glow-blue-sm hover:bg-uk-blue-bright">{ukText("Book a scoping call")}<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </ScopingButton>
            </Reveal>

            <Reveal className="mt-10 border-t border-uk-line pt-8">
              <Link
                href={ukText("/products")}
                className="group inline-flex items-center gap-2 text-sm font-semibold text-uk-blue transition-colors hover:text-uk-blue-bright"
              >
                <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />{ukText("All products")}</Link>
            </Reveal>
          </Container>
        </section>

        <CtaBand />
      </main>
      <Footer />
    </>
  );
}
