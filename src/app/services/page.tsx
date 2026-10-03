import type { Metadata } from "next";
import { Header } from "@/components/site/header";
import { Footer } from "@/components/site/footer";
import { ScrollProgress } from "@/components/site/scroll-progress";
import { heroArtwork } from "@/components/site/page-hero";
import { EditableHero, PageBlocks } from "@/components/site/page-extras";
import { Services } from "@/components/site/services";
import { TimeSavers } from "@/components/site/time-savers";
import { PhotoPanel, photos } from "@/components/site/photo-panel";
import { ByTheNumbers } from "@/components/site/by-the-numbers";
import { Container } from "@/components/site/container";
import { Reveal } from "@/components/site/reveal";
import { CtaBand } from "@/components/site/cta";
import { serviceDetails } from "@/lib/site-data";
import { getServices } from "@/lib/services-store";
import { capitalize, countWord } from "@/lib/services-validation";
import Link from "@/components/site/intent-link";
import { ArrowRight } from "lucide-react";
import { ukText } from "@/lib/texts";

// Re-render at least once a minute so admin text overrides always show up.
export const revalidate = 60;

// One row per service line, drawn from the same data the detail pages use.
const toGlance = (services: Awaited<ReturnType<typeof getServices>>) => services.map((s) => {
  const slug = s.href.split("/").pop() ?? "";
  const d = serviceDetails[slug];
  const fact = (label: string) => d?.quickFacts.find((f) => f.label === label)?.value ?? "—";
  return {
    href: s.href,
    title: s.title,
    bestFor: d?.bestFor ?? s.blurb,
    timeline: fact("Typical timeline"),
    from: fact("Starting investment"),
    first: d?.quickFacts[3]?.value ?? "—",
    firstLabel: d?.quickFacts[3]?.label ?? "First milestone",
  };
});

export const metadata: Metadata = {
  title: "Services — web, mobile, CRM, ERP, cloud & cybersecurity",
  description:
    "Service lines under one accountable team: web & mobile apps, custom CRM/ERP/HRMS, cloud & DevOps, digital marketing, managed IT, blockchain and brand design.",
  alternates: { canonical: "https://ukvalley.com/services" },
};

export default async function ServicesPage() {
  const liveServices = await getServices();
  const glance = toGlance(liveServices);
  const n = liveServices.length;
  const word = countWord(n);
  return (
    <>
      <ScrollProgress />
      <Header />
      <main id="main">
        <EditableHero pageKey="services"
          image={{ ...heroArtwork.services, stat: { ...heroArtwork.services.stat, value: String(n) } }}
          eyebrow={ukText("Services")}
          crumbs={[{ label: "Home", href: "/" }, { label: "Services" }]}
          title={
            <>{ukText("Full-stack delivery — from")}{" "}
              <span className="text-gradient-blue">{ukText("CRM to cloud")}</span>{ukText(", under one accountable team.")}</>
          }
          description={ukText(`${capitalize(word)} service lines, one team that owns the outcome. No freelance brokers, no hand-offs to a faceless offshoring pool — the engineers who scope it build it.`)}
        />

        <Services />

        {/* Service lines at a glance — one table to compare timelines and bands */}
        <section className="relative bg-uk-surface-2 section-py">
          <Container>
            <Reveal className="max-w-2xl">
              <span className="inline-flex w-fit items-center gap-2 rounded-full border border-uk-blue/30 bg-uk-blue/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.22em] text-uk-blue">{ukText("At a glance")}</span>
              <h2 className="mt-5 font-heading text-2xl font-bold text-uk-heading sm:text-3xl">
                {ukText(capitalize(word))}{" "}{ukText("service lines, compared on the numbers that matter")}</h2>
              <p className="mt-3 text-sm leading-relaxed text-uk-gray sm:text-base">{ukText("Typical timelines, starting investment and when you first see working software — so you can shortlist before the call. Every figure is a range from past engagements; your written estimate follows the scoping call within 3 business days.")}</p>
            </Reveal>
            <Reveal className="mt-8 overflow-x-auto rounded-3xl border border-uk-line bg-uk-card">
              <table className="w-full min-w-[760px] border-separate border-spacing-0 text-left text-sm">
                <thead>
                  <tr>
                    <th className="border-b border-uk-line px-5 py-4 font-heading font-bold text-uk-heading">{ukText("Service line")}</th>
                    <th className="border-b border-uk-line px-5 py-4 font-heading font-bold text-uk-heading">{ukText("Best for")}</th>
                    <th className="border-b border-uk-line px-5 py-4 font-heading font-bold text-uk-heading">{ukText("Typical timeline")}</th>
                    <th className="border-b border-uk-line px-5 py-4 font-heading font-bold text-uk-heading">{ukText("Starting from")}</th>
                    <th className="border-b border-uk-line px-5 py-4 font-heading font-bold text-uk-heading">{ukText("First milestone")}</th>
                  </tr>
                </thead>
                <tbody>
                  {glance.map((g) => (
                    <tr key={g.href} className="group transition-colors hover:bg-uk-surface">
                      <td className="border-b border-uk-line px-5 py-4">
                        <Link href={ukText(g.href)} className="inline-flex items-center gap-1.5 font-semibold text-uk-heading transition-colors group-hover:text-uk-blue">
                          {ukText(g.title)}
                          <ArrowRight className="h-3.5 w-3.5 text-uk-blue opacity-0 transition-opacity group-hover:opacity-100" />
                        </Link>
                      </td>
                      <td className="border-b border-uk-line px-5 py-4 text-uk-gray">{ukText(g.bestFor)}</td>
                      <td className="border-b border-uk-line px-5 py-4 whitespace-nowrap font-medium text-uk-body">{ukText(g.timeline)}</td>
                      <td className="border-b border-uk-line px-5 py-4 whitespace-nowrap font-heading font-bold text-uk-blue">{ukText(g.from)}</td>
                      <td className="border-b border-uk-line px-5 py-4 whitespace-nowrap text-uk-body">
                        <span className="font-medium">{ukText(g.first)}</span>
                        <span className="block text-xs text-uk-muted">{ukText(g.firstLabel)}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Reveal>
          </Container>
        </section>

        <PhotoPanel
          photo={photos.services}
          eyebrow={ukText("How the eight lines fit together")}
          title={ukText("One team from the first call to year three of support.")}
          facts={[
            "One architect owns the engagement end to end",
            "Design, build, cloud and marketing share one backlog",
            "Managed support takes over the day you launch",
            "Every line ships with code and credentials you own",
          ]}
          caption={ukText("Engineering core — architecture, web, mobile, cloud and QA under one roof.")}
        >
          <p>{ukText("Most agencies sell services as separate departments: a design team hands off to a build team, who hand off to an outsourced DevOps vendor, who has never met the marketing agency. Every hand-off loses context, and you pay for the re-learning.")}</p>
          <p>{ukText("We run all eight lines as one team. The architect who scopes your CRM designs its cloud footprint, the engineer who builds the storefront tunes it for the SEO campaign, and the support engineer who answers your ticket in year two was on the original build. That continuity is where the time savings on this page actually come from.")}</p>
        </PhotoPanel>

        <TimeSavers />
        <ByTheNumbers limit={4} />
        <CtaBand />
        <PageBlocks pageKey="services" />
      </main>
      <Footer />
    </>
  );
}