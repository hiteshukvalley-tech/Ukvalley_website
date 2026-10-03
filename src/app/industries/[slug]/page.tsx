import type { Metadata } from "next";
import Link from "@/components/site/intent-link";
import { notFound } from "next/navigation";
import {
  Landmark, HeartPulse, ShoppingBag, Building, Factory, Truck, Wheat, Users, HardHat,
  GraduationCap, Plane, Clapperboard, Zap, HeartHandshake, Briefcase,
  ArrowLeft, ArrowRight, Check, CircleAlert, ShieldCheck, ChevronRight, type LucideIcon,
} from "lucide-react";
import { Header } from "@/components/site/header";
import { Footer } from "@/components/site/footer";
import { ScrollProgress } from "@/components/site/scroll-progress";
import { PageHero } from "@/components/site/page-hero";
import { Container } from "@/components/site/container";
import { Reveal } from "@/components/site/reveal";
import { CtaBand } from "@/components/site/cta";
import { serviceDetails } from "@/lib/site-data";
import { getServices } from "@/lib/services-store";
import { getIndustries } from "@/lib/industries-store";
import { jsonLd } from "@/lib/utils";
import { ukText } from "@/lib/texts";

// Re-render at least once a minute so admin text overrides always show up.
export const revalidate = 60;

const icons: Record<string, LucideIcon> = {
  landmark: Landmark,
  heartPulse: HeartPulse,
  shoppingBag: ShoppingBag,
  building: Building,
  factory: Factory,
  truck: Truck,
  wheat: Wheat,
  users: Users,
  hardHat: HardHat,
  graduationCap: GraduationCap,
  plane: Plane,
  clapperboard: Clapperboard,
  zap: Zap,
  heartHandshake: HeartHandshake,
  briefcase: Briefcase,
};

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return (await getIndustries()).map((i) => ({ slug: i.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const ind = (await getIndustries()).find((i) => i.slug === slug);
  if (!ind) return {};
  return {
    title: `${ind.name} software development — Ukvalley`,
    description: ind.blurb,
    alternates: { canonical: `https://ukvalley.com/industries/${ind.slug}` },
  };
}

export default async function IndustryPage({ params }: Props) {
  const { slug } = await params;
  const industries = await getIndustries();
  const ind = industries.find((i) => i.slug === slug);
  if (!ind) notFound();

  const Icon = icons[ind.icon] ?? Landmark;

  const relatedServices = (await getServices())
    .filter((s) => {
      const slug = s.href.split("/").pop() ?? "";
      return serviceDetails[slug]?.relatedIndustries.includes(ind.slug);
    })
    .slice(0, 4);

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: ind.faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(faqSchema) }} />
      <ScrollProgress />
      <Header />
      <main id="main">
        <PageHero
          eyebrow={ukText("Products & consulting")}
          crumbs={[
            { label: "Home", href: "/" },
            { label: "Industries", href: "/industries" },
            { label: ind.name },
          ]}
          title={
            <span className="inline-flex items-center gap-4">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-uk-blue/12 text-uk-blue">
                <Icon className="h-6 w-6" />
              </span>
              {ukText(ind.name)}
            </span>
          }
          description={ukText(ind.blurb)}
        />

        {/* Sector reality — the problems we design against, and the rules we build for */}
        <section className="relative bg-uk-surface section-py">
          <div className="absolute inset-0 bg-dots opacity-20" aria-hidden />
          <Container className="relative">
            <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_1.4fr]">
              <Reveal>
                <span className="inline-flex w-fit items-center gap-2 rounded-full border border-uk-blue/30 bg-uk-blue/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.22em] text-uk-blue">{ukText("Sector reality")}</span>
                <h2 className="mt-5 font-heading text-2xl font-bold text-uk-heading sm:text-3xl">{ukText("What slows ")}{ukText(ind.name)}{" "}{ukText("teams down")}</h2>
                <div className="mt-3 flex flex-col gap-3">
                  {ind.overview.map((para, i) => (
                    <p key={i} className="text-justify-prose text-sm leading-relaxed text-uk-gray">
                      {ukText(para)}
                    </p>
                  ))}
                </div>
                {ind.compliance.length > 0 && (
                  <div className="mt-7 rounded-2xl border border-uk-line bg-uk-card p-6">
                    <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-uk-muted">
                      <ShieldCheck className="h-4 w-4 text-uk-blue" />{ukText("Built for the rules")}</p>
                    <ul className="mt-3 flex flex-wrap gap-2">
                      {ind.compliance.map((c) => (
                        <li
                          key={c}
                          className="inline-flex items-center rounded-full border border-uk-blue/20 bg-uk-surface-blue px-3 py-1.5 text-xs font-medium text-uk-body"
                        >
                          {ukText(c)}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </Reveal>
              <Reveal staggerChildren className="flex flex-col gap-3.5">
                {ind.challenges.map((ch) => (
                  <div
                    key={ch}
                    className="flex items-start gap-4 rounded-2xl border border-uk-line bg-uk-card p-5 card-hover"
                  >
                    <span className="flex h-9 w-9 flex-none items-center justify-center rounded-lg bg-uk-blue/12 text-uk-blue">
                      <CircleAlert className="h-4.5 w-4.5" />
                    </span>
                    <span className="pt-1.5 text-sm font-medium leading-relaxed text-uk-heading sm:text-base">
                      {ukText(ch)}
                    </span>
                  </div>
                ))}
              </Reveal>
            </div>
          </Container>
        </section>

        {/* Outcomes we deliver — heading on the left, cards below */}
        <section className="relative bg-uk-surface-2 section-py">
          <Container>
            <Reveal className="max-w-2xl">
              <span className="inline-flex w-fit items-center gap-2 rounded-full border border-uk-blue/30 bg-uk-blue/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.22em] text-uk-blue">{ukText("Outcomes")}</span>
              <h2 className="mt-5 font-heading text-2xl font-bold text-uk-heading sm:text-3xl">{ukText("Outcomes we deliver here")}</h2>
              <p className="mt-3 text-sm leading-relaxed text-uk-gray">{ukText("The systems ")}{ukText(ind.name)}{" "}{ukText("teams run on after we ship — measured, owned and supported.")}</p>
            </Reveal>
            <Reveal
              staggerChildren
              className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2"
            >
              {ind.outcomes.map((o) => (
                <div
                  key={o}
                  className="flex items-start gap-4 rounded-2xl border border-uk-line bg-uk-card p-6 card-hover"
                >
                  <span className="flex h-11 w-11 flex-none items-center justify-center rounded-xl bg-uk-blue/12 text-uk-blue">
                    <Check className="h-5 w-5" />
                  </span>
                  <span className="pt-2 text-base font-medium leading-snug text-uk-heading">
                    {ukText(o)}
                  </span>
                </div>
              ))}
            </Reveal>
          </Container>
        </section>

        {/* What we build for this sector */}
        <section className="relative bg-uk-surface section-py">
          <Container>
            <Reveal className="max-w-2xl">
              <span className="inline-flex w-fit items-center gap-2 rounded-full border border-uk-blue/30 bg-uk-blue/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.22em] text-uk-blue">{ukText("What we build")}</span>
              <h2 className="mt-5 font-heading text-2xl font-bold text-uk-heading sm:text-3xl">{ukText("Systems we deliver for ")}{ukText(ind.name)}
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-uk-gray">{ukText("Each of these has shipped for a client in this sector or one adjacent to it — customised to the workflow, not sold as a template.")}</p>
            </Reveal>
            <Reveal staggerChildren className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2">
              {ind.deliverables.map((d, i) => (
                <div
                  key={d.title}
                  className="flex gap-4 rounded-2xl border border-uk-line bg-uk-card p-6 card-hover"
                >
                  <span className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-uk-blue/12 font-heading text-sm font-bold text-uk-blue">
                    {ukText(String(i + 1).padStart(2, "0"))}
                  </span>
                  <div className="flex flex-col gap-1.5">
                    <h3 className="font-heading text-base font-bold text-uk-heading">{ukText(d.title)}</h3>
                    <p className="text-sm leading-relaxed text-uk-gray">{ukText(d.desc)}</p>
                  </div>
                </div>
              ))}
            </Reveal>

            {/* Proof + featured case study */}
            {(ind.proof || ind.featuredCase) && (
              <Reveal className="mt-10 grid grid-cols-1 gap-5 lg:grid-cols-[1fr_1.2fr]">
                {ind.proof && (
                  <div className="grid grid-cols-3 gap-3 rounded-2xl border border-uk-blue/15 bg-uk-blue/[0.06] p-5">
                    {ind.proof.map((s) => (
                      <div key={s.label} className="flex flex-col gap-0.5">
                        <span className="font-heading text-xl font-bold text-uk-blue sm:text-2xl">{ukText(s.value)}</span>
                        <span className="text-[0.72rem] leading-tight text-uk-muted">{ukText(s.label)}</span>
                      </div>
                    ))}
                  </div>
                )}
                {ind.featuredCase && (
                  <Link
                    href={ukText(ind.featuredCase.href)}
                    className="group flex items-center justify-between gap-4 rounded-2xl border border-uk-line bg-uk-card p-5 transition-colors hover:border-uk-blue/40"
                  >
                    <span className="flex flex-col gap-1">
                      <span className="text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-uk-muted">{ukText("Featured case study")}</span>
                      <span className="font-heading text-base font-bold leading-snug text-uk-heading">
                        {ukText(ind.featuredCase.title)}
                      </span>
                    </span>
                    <span className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-uk-blue/10 text-uk-blue transition-all group-hover:bg-uk-blue group-hover:text-uk-white">
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  </Link>
                )}
              </Reveal>
            )}
          </Container>
        </section>

        {/* Sector FAQs */}
        <section className="relative bg-uk-surface-2 section-py">
          <Container className="max-w-5xl">
            <Reveal className="max-w-2xl">
              <h2 className="font-heading text-2xl font-bold text-uk-heading sm:text-3xl">
                {ukText(ind.name)}{" "}{ukText("— questions buyers ask us")}</h2>
            </Reveal>
            <Reveal staggerChildren className="mt-8 flex flex-col gap-4">
              {ind.faqs.map((f) => (
                <details
                  key={f.q}
                  className="group rounded-2xl border border-uk-line bg-uk-card px-5 py-4 transition-colors hover:border-uk-blue/40 open:border-uk-blue/40"
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

        {/* How we can help — heading on the left, service cards below */}
        <section className="relative bg-uk-surface section-py">
          <div className="absolute inset-0 bg-dots opacity-20" aria-hidden />
          <Container className="relative">
            <Reveal className="max-w-2xl">
              <span className="inline-flex w-fit items-center gap-2 rounded-full border border-uk-blue/30 bg-uk-blue/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.22em] text-uk-blue">{ukText("How we help")}</span>
              <h2 className="mt-5 font-heading text-2xl font-bold text-uk-heading sm:text-3xl">{ukText("How we can help")}</h2>
              <p className="mt-3 text-sm leading-relaxed text-uk-gray">{ukText("The products we sell and the consulting we deliver in ")}{ukText(ind.name)}{" "}{ukText("— one accountable team across all of them.")}</p>
            </Reveal>
            <Reveal
              staggerChildren
              className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2"
            >
              {relatedServices.map((s) => (
                <Link
                  key={s.href}
                  href={ukText(s.href)}
                  className="group flex items-center justify-between gap-4 rounded-2xl border border-uk-line bg-uk-card p-6 card-premium card-spotlight transition-colors hover:border-uk-blue/40"
                >
                  <span className="font-heading text-base font-bold leading-snug text-uk-heading">
                    {ukText(s.title)}
                  </span>
                  <span className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-uk-blue/10 text-uk-blue transition-all group-hover:bg-uk-blue group-hover:text-uk-white">
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </Link>
              ))}
              {/* complete the 2-column grid when the service count is odd */}
              {relatedServices.length % 2 === 1 && (
                <Link
                  href={ukText("/contact")}
                  className="group flex items-center justify-between gap-4 rounded-2xl border border-uk-blue/25 bg-uk-surface-blue p-6 transition-colors hover:border-uk-blue/50"
                >
                  <span className="font-heading text-base font-bold leading-snug text-uk-heading">{ukText("Need a different stack?")}{" "}
                    <span className="block text-sm font-medium text-uk-muted">{ukText("Talk to an architect about your ")}{ukText(ind.name.toLowerCase())}{" "}{ukText("project.")}</span>
                  </span>
                  <span className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-uk-blue text-uk-white transition-all group-hover:bg-uk-blue-bright">
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </Link>
              )}
            </Reveal>

            <Reveal className="mt-12 border-t border-uk-line pt-8">
              <Link
                href={ukText("/industries")}
                className="group inline-flex items-center gap-2 text-sm font-semibold text-uk-blue transition-colors hover:text-uk-blue-bright"
              >
                <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />{ukText("All industries")}</Link>
            </Reveal>
          </Container>
        </section>

        <CtaBand />
      </main>
      <Footer />
    </>
  );
}