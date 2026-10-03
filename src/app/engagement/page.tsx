import type { Metadata } from "next";
import { Header } from "@/components/site/header";
import { Footer } from "@/components/site/footer";
import { ScrollProgress } from "@/components/site/scroll-progress";
import { heroExtras } from "@/components/site/page-hero";
import { EditableHero, PageBlocks } from "@/components/site/page-extras";
import { Engagement } from "@/components/site/engagement";
import { Container } from "@/components/site/container";
import { Reveal } from "@/components/site/reveal";
import { CtaBand } from "@/components/site/cta";
import { Check, Target, Gauge } from "lucide-react";
import { ukText } from "@/lib/texts";

// Re-render at least once a minute so admin text overrides always show up.
export const revalidate = 60;

const fitGuide = [
  {
    model: "Fixed-bid project",
    when: "You can describe every screen, rule and integration in writing, and you are buying execution rather than discovery.",
    signals: ["Scope documented", "Clear launch date", "Budget approved up front"],
    time: "Saves the weeks a moving target costs — no change-request fights.",
  },
  {
    model: "Dedicated team",
    when: "The product is still being discovered: priorities shift monthly and the backlog is fed by user feedback.",
    signals: ["Ongoing roadmap", "Weekly priorities change", "You want engineers in your standups"],
    time: "Saves the ramp-up of re-briefing a new vendor for every feature.",
  },
  {
    model: "Monthly retainer",
    when: "A live system needs steady improvements, fixes and support on a predictable budget.",
    signals: ["System already in production", "Small features monthly", "Support SLA matters"],
    time: "Saves the negotiation overhead of quoting every small change.",
  },
  {
    model: "Staff augmentation",
    when: "You have an engineering team and a process, and need specific skills without recruitment lead time.",
    signals: ["In-house tech lead", "Skill gap, not process gap", "Start within 48 hours"],
    time: "Saves the 8–12 weeks a typical hiring cycle takes.",
  },
];

export const metadata: Metadata = {
  title: "Engagement models — fixed-bid, dedicated team, retainer, staff augmentation",
  description:
    "Four transparent ways to work with Ukvalley: fixed-bid projects, dedicated teams, monthly retainers and staff augmentation. Pick the model that fits your scope and budget.",
  alternates: { canonical: "https://ukvalley.com/engagement" },
};

export default function EngagementPage() {
  return (
    <>
      <ScrollProgress />
      <Header />
      <main id="main">
        <EditableHero pageKey="engagement" variant="company"
          extras={heroExtras.company}
          eyebrow={ukText("Engagement model")}
          crumbs={[{ label: "Home", href: "/" }, { label: "Engagement Model" }]}
          title={
            <>{ukText("Four ways to work with us —")}{" "}
              <span className="text-gradient-blue">{ukText("priced transparently.")}</span>
            </>
          }
          description={ukText("We don't force you into one model. Fixed-bid for defined scope, a dedicated team for ongoing product work, a retainer for maintain-and-grow, or staff augmentation to scale your existing team.")}
        />

        {/* The problem it solves */}
        <section className="relative bg-uk-surface section-py">
          <Container>
            <Reveal>
              <span className="inline-flex w-fit items-center gap-2 rounded-full border border-uk-blue/30 bg-uk-blue/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.22em] text-uk-blue">
                <Target className="h-3.5 w-3.5" />{ukText("The problem it solves")}</span>
            </Reveal>
            <div className="mt-6 grid grid-cols-1 gap-10 lg:grid-cols-[1.25fr_1fr] lg:items-start lg:gap-16">
              <Reveal className="flex flex-col gap-5">
                <h2 className="font-heading text-2xl font-bold text-uk-heading sm:text-3xl">{ukText("Why the wrong engagement model costs more than the wrong vendor")}</h2>
                <p className="text-justify-prose text-base leading-relaxed text-uk-body sm:text-lg">{ukText("Most vendors push whichever engagement model suits their own cash flow, not your actual situation — a fixed-bid quote for a product that's still being discovered, or a dedicated team billed monthly for a scope that was fully known on day one. The mismatch isn't obvious until month two, when either the change-request invoices start piling up or the team sits half-idle waiting on decisions that were never yours to make quickly.")}</p>
                <p className="text-justify-prose text-base leading-relaxed text-uk-body sm:text-lg">{ukText("A fixed-bid engagement run on a discovery-stage product produces padded prices and change-request fights, because the vendor priced in the uncertainty you didn't know you had. A dedicated team hired for a fully-scoped project burns budget on standups and re-prioritisation meetings a fixed-bid would have skipped entirely.")}</p>
                <p className="text-justify-prose text-base leading-relaxed text-uk-body sm:text-lg">{ukText("We ask which situation you're actually in before recommending a model — and when two models genuinely fit, the hybrid we suggest most is a fixed-bid first phase that proves the thin slice, followed by a dedicated team working from an earned backlog.")}</p>
              </Reveal>

              <Reveal className="flex flex-col gap-5">
                <div className="flex w-full flex-col rounded-2xl border border-uk-line bg-uk-card p-6 sm:p-7">
                  <h3 className="font-heading text-lg font-bold text-uk-heading">{ukText("Signs you're in the wrong model")}</h3>
                  <ul className="mt-4 flex flex-col gap-3.5">
                    {[
                      "Change requests arrive as invoices, not conversations",
                      "A dedicated team sits idle waiting on your next decision",
                      "Scope was fully known, but you're paying for discovery anyway",
                      "The model was recommended before your situation was understood",
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
                    {[
                      { label: "Engagement models", value: "4", sub: "Fixed-bid to staff augmentation" },
                      { label: "Most recommended", value: "Hybrid", sub: "Fixed-bid phase, then dedicated" },
                      { label: "Staff augmentation start", value: "48 hrs", sub: "No recruitment lead time" },
                      { label: "Scale or pause notice", value: "1 week", sub: "No lock-in, ever" },
                    ].map((f) => (
                      <div key={f.label} className="flex items-baseline justify-between gap-4 py-3">
                        <dt className="text-sm text-uk-gray">
                          {ukText(f.label)}
                          <span className="block text-xs text-uk-muted">{ukText(f.sub)}</span>
                        </dt>
                        <dd className="whitespace-nowrap font-heading text-base font-bold text-uk-blue">{ukText(f.value)}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              </Reveal>
            </div>
          </Container>
        </section>

        <Engagement />

        {/* Which model fits — decision guide */}
        <section className="relative bg-uk-surface section-py">
          <div className="absolute inset-0 bg-dots opacity-20" aria-hidden />
          <Container className="relative">
            <Reveal className="max-w-2xl">
              <span className="inline-flex w-fit items-center gap-2 rounded-full border border-uk-blue/30 bg-uk-blue/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.22em] text-uk-blue">{ukText("Which model fits")}</span>
              <h2 className="mt-5 font-heading text-2xl font-bold text-uk-heading sm:text-3xl">{ukText("A two-minute guide to choosing")}</h2>
              <p className="mt-3 text-sm leading-relaxed text-uk-gray sm:text-base">{ukText("Vendors tend to push the model that suits their cash flow. The honest test is how well you know what you want. Match your situation to the signals below — and if two rows fit, the hybrid we recommend most is a fixed-bid first phase followed by a dedicated team.")}</p>
            </Reveal>
            <Reveal staggerChildren className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-2">
              {fitGuide.map((g) => (
                <div key={g.model} className="flex flex-col gap-3 rounded-2xl border border-uk-line bg-uk-card p-6 card-hover">
                  <h3 className="font-heading text-lg font-bold text-uk-blue">{ukText(g.model)}</h3>
                  <p className="text-sm leading-relaxed text-uk-gray">{ukText(g.when)}</p>
                  <ul className="flex flex-wrap gap-2">
                    {g.signals.map((s) => (
                      <li key={s} className="inline-flex items-center gap-1.5 rounded-full border border-uk-line bg-uk-surface-blue px-3 py-1 text-xs font-medium text-uk-body">
                        <Check className="h-3 w-3 text-uk-blue" />
                        {ukText(s)}
                      </li>
                    ))}
                  </ul>
                  <p className="mt-auto border-t border-uk-line pt-3 text-xs font-medium text-uk-muted">{ukText(g.time)}</p>
                </div>
              ))}
            </Reveal>
          </Container>
        </section>

        <CtaBand />
        <PageBlocks pageKey="engagement" />
      </main>
      <Footer />
    </>
  );
}