import type { Metadata } from "next";
import { Target, ShieldCheck, Check } from "lucide-react";
import { Header } from "@/components/site/header";
import { Footer } from "@/components/site/footer";
import { ScrollProgress } from "@/components/site/scroll-progress";
import { EditableHero, PageBlocks } from "@/components/site/page-extras";
import { Industries } from "@/components/site/industries";
import { ByTheNumbers } from "@/components/site/by-the-numbers";
import { Container } from "@/components/site/container";
import { Reveal } from "@/components/site/reveal";
import { CtaBand } from "@/components/site/cta";

import { getCaseStudies } from "@/lib/cases-store";
import { getIndustries } from "@/lib/industries-store";
import { ukText } from "@/lib/texts";

// Re-render at least once a minute so admin text overrides always show up.
export const revalidate = 60;

export const metadata: Metadata = {
  title: "Industries — fourteen sectors, production-proven software",
  description:
    "From NBFC lending to agri supply chains: the fourteen verticals where Ukvalley runs live systems today — each with measured outcomes and the case study to back it.",
  alternates: { canonical: "https://ukvalley.com/industries" },
};

export default async function IndustriesPage() {
  const industries = await getIndustries();
  const caseStudies = await getCaseStudies();
  return (
    <>
      <ScrollProgress />
      <Header />
      <main id="main">
        <EditableHero pageKey="industries"
          eyebrow={ukText("Industry expertise")}
          crumbs={[{ label: "Home", href: "/" }, { label: "Industries" }]}
          title={
            <>{ukText("Fourteen sectors. One standard —")}{" "}
              <span className="text-gradient-blue">{ukText("systems that ship.")}</span>
            </>
          }
          description={ukText("We work where regulation is strict, margins are tight and downtime is expensive. Every vertical below is live work in production — not a capability slide — with the measured results and case studies to prove it.")}
        />

        {/* What sector expertise means here */}
        <section className="relative bg-uk-surface section-py">
          <Container>
            <Reveal className="grid grid-cols-1 gap-8 lg:grid-cols-[1.2fr_1fr] lg:items-start lg:gap-16">
              <div>
                <span className="inline-flex w-fit items-center gap-2 rounded-full border border-uk-blue/30 bg-uk-blue/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.22em] text-uk-blue">
                  <Target className="h-3.5 w-3.5" />{ukText("The problem it solves")}</span>
                <h2 className="mt-5 font-heading text-2xl font-bold text-uk-heading sm:text-3xl">{ukText("The rules, the edge cases and the month-end are different in every sector.")}</h2>
                <div className="text-justify-prose mt-4 space-y-4 text-base leading-relaxed text-uk-body sm:text-lg">
                  <p>{ukText("A lending desk needs maker-checker on every rupee. A factory needs shift rules that survive the Factories Act. A clinic needs an audit log on every record view. Generic software learns these on your budget; we already know them.")}</p>
                  <p>{ukText("Hiring a generalist vendor for a regulated or compliance-heavy sector means paying twice: once for the build, and again when the first audit, inspection or edge case exposes a rule nobody on the team had ever had to code for. That second bill usually costs more than the first — in penalties, in rework, or in a system that gets abandoned the moment it meets a real inspector.")}</p>
                  <p>{ukText("Each sector page below lists the compliance touchpoints we build for, the systems we have shipped, the measured results, and the questions buyers in that sector ask us. Pick yours and read the case study behind it.")}</p>
                </div>
              </div>
              <div className="flex flex-col gap-5 self-start">
                <div className="flex w-full flex-col rounded-2xl border border-uk-line bg-uk-card p-6 sm:p-7">
                  <h3 className="flex items-center gap-2 font-heading text-lg font-bold text-uk-heading">
                    <ShieldCheck className="h-4 w-4 text-uk-blue" />{ukText("What each sector page includes")}</h3>
                  <ul className="mt-4 flex flex-col gap-3.5">
                    {[
                      "The compliance touchpoints we build for, named",
                      "Systems already shipped in that vertical",
                      "Measured outcomes from live deployments",
                      "Buyer FAQs specific to the sector",
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

                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: String(industries.length), label: "Sectors with live systems" },
                    { value: String(caseStudies.length), label: "Documented case studies" },
                    { value: String(industries.filter((i) => i.featuredCase).length), label: "Sectors with a featured case" },
                    { value: String(industries.reduce((n, i) => n + i.compliance.length, 0)), label: "Compliance touchpoints covered" },
                    { value: `${industries.reduce((n, i) => n + i.deliverables.length, 0)}+`, label: "Named systems we deliver" },
                    { value: `${industries.reduce((n, i) => n + i.outcomes.length, 0)}+`, label: "Measurable outcomes tracked" },
                  ].map((s) => (
                    <div key={s.label} className="flex flex-col gap-1 rounded-2xl border border-uk-line bg-uk-card p-5">
                      <span className="font-heading text-3xl font-bold leading-none text-uk-blue">{ukText(s.value)}</span>
                      <span className="text-xs font-medium text-uk-muted">{ukText(s.label)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>
          </Container>
        </section>

        {/* The page hero above already introduces the switchboard, so the
            section renders without its own heading on this page only. */}
        <Industries industries={industries} heading={false} />
        <ByTheNumbers limit={4} className="bg-uk-surface" />
        <CtaBand />
        <PageBlocks pageKey="industries" />
      </main>
      <Footer />
    </>
  );
}