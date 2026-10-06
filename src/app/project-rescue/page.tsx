import type { Metadata } from "next";
import { SITE_URL } from "@/lib/site-origin";
import { editableMetadata } from "@/lib/page-metadata";
import { Siren, KeyRound, FileSearch, Wrench, ArrowRight, ShieldAlert, GitBranch, DatabaseBackup, Target, Gauge, Check } from "lucide-react";
import { Header } from "@/components/site/header";
import { ScopingButton } from "@/components/site/scoping-modal";
import { Footer } from "@/components/site/footer";
import { ScrollProgress } from "@/components/site/scroll-progress";
import { heroExtras } from "@/components/site/page-hero";
import { EditableHero, PageBlocks } from "@/components/site/page-extras";
import { Container } from "@/components/site/container";
import { Reveal } from "@/components/site/reveal";
import { ByTheNumbers } from "@/components/site/by-the-numbers";
import { CtaBand } from "@/components/site/cta";
import { ukText } from "@/lib/texts";

// Re-render at least once a minute so admin text overrides always show up.
export const revalidate = 60;

// Title and description can be replaced in Admin → Page text (SEO fields).
export const generateMetadata = () => editableMetadata("project-rescue", baseMetadata);
const baseMetadata: Metadata = {
  title: "Project rescue — when your software is failing",
  description:
    "The vendor disappeared, the code is undocumented and every change breaks something. Ukvalley's audit-first rescue sequence stabilises inherited codebases — ownership first, then a written audit, then fixes.",
  alternates: { canonical: `${SITE_URL}/project-rescue` },
};

const signs = [
  "The original vendor has disappeared — or gone quiet at every milestone.",
  "Nobody can explain how the system actually works, including the last team that touched it.",
  "Every change breaks something that used to work.",
  "There are no backups you've personally verified can be restored.",
  "Deploying feels dangerous, so releases happen rarely and at night.",
  "You're paying for \"maintenance\" that never seems to improve anything.",
];

const steps = [
  {
    icon: KeyRound,
    title: "Week 1 — Secure ownership",
    desc: "Get the code, databases, servers and every credential under your control. We've seen rescues stall for weeks because the old vendor held deployment access. Ownership first, always — and it should have been yours from day one.",
  },
  {
    icon: FileSearch,
    title: "Weeks 2–3 — Written audit",
    desc: "What the system actually does, which parts are load-bearing, where the tests are (usually: nowhere), and which three changes would stabilise it most. The output is a ranked list you can act on — not a 60-page report nobody reads.",
  },
  {
    icon: ShieldAlert,
    title: "Weeks 3–6 — Stabilise",
    desc: "Automated backups you've actually restored, monitoring with alerts that reach a human, a deploy process that doesn't require heroics, and regression tests on the flows that make you money. The floor stops moving before we build on it.",
  },
  {
    icon: GitBranch,
    title: "Then — Extend, or rewrite with a plan",
    desc: "Only after stabilisation do we re-ask the rewrite question, with real information. Roughly a third of the time the answer is yes — but now it's a planned rewrite with a migration path, not an escape from a fire.",
  },
];

const weTake = [
  { icon: DatabaseBackup, title: "Any stack, any age", desc: "Legacy PHP, .NET, Node, Python — raw SQL, no tests, undocumented. We start where the code is, not where a pitch deck wishes it was." },
  { icon: Wrench, title: "No rewrite pressure", desc: "Our incentive is to stabilise, not to sell you a rebuild. The audit decides, and it's written down so you can hold us to it." },
  { icon: Siren, title: "Incident-ready fast", desc: "Within the first month: monitoring with alerts, a rollback path and a named engineer who answers inside the 24-hour SLA." },
];

export default function ProjectRescuePage() {
  return (
    <>
      <ScrollProgress />
      <Header />
      <main id="main">
        <EditableHero pageKey="project-rescue"
          variant="company"
          extras={heroExtras.company}
          eyebrow={ukText("Project rescue")}
          crumbs={[{ label: "Home", href: "/" }, { label: "Project Rescue" }]}
          title={
            <>{ukText("Failing software can be rescued —")}{" "}
              <span className="text-gradient-blue">{ukText("without a panic rewrite.")}</span>
            </>
          }
          description={ukText("The vendor disappeared, the code is undocumented, and every change breaks something. We've inherited dozens of codebases in exactly that state. The rescue sequence starts with an audit, not a rebuild — and you keep ownership throughout.")}
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
                <h2 className="font-heading text-2xl font-bold text-uk-heading sm:text-3xl">{ukText("Why failing projects usually get rescued twice")}</h2>
                <p className="text-justify-prose text-base leading-relaxed text-uk-body sm:text-lg">{ukText("Most \"rescues\" are really a second failed project wearing a fresh vendor logo. A new team inherits a codebase nobody documented, decides the fastest path is to rewrite it, and eighteen months later is explaining the same overrun to the same nervous stakeholders — because the business logic that made the old system painful was never actually understood, just discarded.")}</p>
                <p className="text-justify-prose text-base leading-relaxed text-uk-body sm:text-lg">{ukText("The panic rewrite is expensive in ways that don't show up until month four: features quietly disappear because nobody knew they existed, data migration turns into an archaeology project, and the business keeps running on the old system anyway — because the new one isn't ready — which means you're now paying for two systems and trusting neither.")}</p>
                <p className="text-justify-prose text-base leading-relaxed text-uk-body sm:text-lg">{ukText("We rescue in the opposite order: secure ownership first, audit before touching a line of code, stabilise what's already live, and only then decide — with evidence, not panic — whether to extend it or rewrite it on a real plan. Most inherited systems turn out to be worth keeping; the ones that don't get rebuilt on a migration path instead of a guess.")}</p>
              </Reveal>

              <Reveal className="flex flex-col gap-5">
                <div className="flex w-full flex-col rounded-2xl border border-uk-line bg-uk-card p-6 sm:p-7">
                  <h3 className="font-heading text-lg font-bold text-uk-heading">{ukText("Our rescue guarantee")}</h3>
                  <p className="mt-1 text-sm text-uk-gray">{ukText("What's written into every rescue engagement.")}</p>
                  <ul className="mt-5 flex flex-col gap-4">
                    {[
                      "Ownership secured before we review a single line of code",
                      "A written audit with a ranked list, not a verbal opinion",
                      "No pressure toward a rewrite — the audit decides, not our incentive",
                      "Replace-anytime engagement with a 24-hour response SLA from day one",
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
                    <Gauge className="h-4 w-4 text-uk-blue" />{ukText("Rescue, at a glance")}</h3>
                  <dl className="mt-4 flex flex-col divide-y divide-uk-line">
                    {[
                      { label: "First response", value: "24 hrs", sub: "From the rescue call" },
                      { label: "Ownership secured", value: "Week 1", sub: "Code, servers, every credential" },
                      { label: "Written audit", value: "Wks 2–3", sub: "A ranked, actionable list" },
                      { label: "Stabilised & live", value: "By wk 6", sub: "Backups, alerts, safe deploys" },
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
                  <p className="mt-4 border-t border-uk-line pt-3 text-xs text-uk-muted">{ukText("Ownership always comes first — before an audit, before a single fix.")}</p>
                </div>
              </Reveal>
            </div>
          </Container>
        </section>

        {/* Signs */}
        <section className="relative bg-uk-surface-2 section-py">
          <Container>
            <Reveal className="max-w-2xl">
              <h2 className="font-heading text-2xl font-bold text-uk-heading sm:text-3xl">{ukText("Sound familiar?")}</h2>
              <p className="mt-3 text-uk-gray">{ukText("If two or more of these are true, a rescue engagement is the right starting point.")}</p>
            </Reveal>
            <Reveal staggerChildren className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {signs.map((s, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 rounded-2xl border border-uk-line bg-uk-card p-5"
                >
                  <span className="mt-0.5 flex h-7 w-7 flex-none items-center justify-center rounded-lg bg-uk-yellow/25 font-heading text-xs font-bold text-uk-heading">
                    {i + 1}
                  </span>
                  <p className="text-sm font-medium leading-snug text-uk-heading">{ukText(s)}</p>
                </div>
              ))}
            </Reveal>
          </Container>
        </section>

        {/* The sequence */}
        <section className="relative bg-uk-surface section-py">
          <div className="absolute inset-0 bg-dots opacity-20" aria-hidden />
          <Container className="relative">
            <Reveal className="max-w-2xl">
              <h2 className="font-heading text-2xl font-bold text-uk-heading sm:text-3xl">{ukText("The rescue sequence")}</h2>
              <p className="mt-3 text-uk-gray">{ukText("The same four-stage sequence every time — because panic rewrites lose business logic nobody documented, and land in the same place eighteen months later.")}</p>
            </Reveal>
            <Reveal staggerChildren className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-2">
              {steps.map((s, i) => (
                <div
                  key={s.title}
                  className="flex gap-4 rounded-2xl border border-uk-line bg-uk-card p-6 card-hover"
                >
                  <span className="flex h-11 w-11 flex-none items-center justify-center rounded-xl bg-uk-blue/12 text-uk-blue">
                    <s.icon className="h-5 w-5" />
                  </span>
                  <div className="flex flex-col gap-1.5">
                    <h3 className="font-heading text-lg font-bold text-uk-heading">
                      {ukText(s.title)}
                    </h3>
                    <p className="text-sm leading-relaxed text-uk-gray">{ukText(s.desc)}</p>
                    {i === 3 && (
                      <p className="mt-2 border-t border-uk-line pt-3 text-xs font-medium text-uk-muted">{ukText("The other two-thirds of systems turn out to be worth keeping.")}</p>
                    )}
                  </div>
                </div>
              ))}
            </Reveal>
          </Container>
        </section>

        {/* What makes us different */}
        <section className="relative bg-uk-surface-2 section-py">
          <Container>
            <Reveal className="max-w-2xl">
              <h2 className="font-heading text-2xl font-bold text-uk-heading sm:text-3xl">{ukText("How we take them on")}</h2>
            </Reveal>
            <Reveal staggerChildren className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-3">
              {weTake.map((w) => (
                <div
                  key={w.title}
                  className="flex flex-col gap-3 rounded-2xl border border-uk-line bg-uk-card p-6 card-hover"
                >
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-uk-blue/12 text-uk-blue">
                    <w.icon className="h-5 w-5" />
                  </span>
                  <h3 className="font-heading text-base font-bold text-uk-heading">
                    {ukText(w.title)}
                  </h3>
                  <p className="text-sm leading-relaxed text-uk-gray">{ukText(w.desc)}</p>
                </div>
              ))}
            </Reveal>

            <Reveal className="mt-12 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-uk-blue/20 bg-uk-surface-blue p-6 sm:p-8">
              <div className="max-w-xl">
                <h3 className="font-heading text-lg font-bold text-uk-heading">{ukText("Start with a rescue call — free, and confidential.")}</h3>
                <p className="mt-1 text-sm text-uk-gray">{ukText("Bring the situation as it is. We'll tell you honestly whether it's a rescue, a rebuild or neither — in writing, within 3 days.")}</p>
              </div>
              <ScopingButton className="btn-sheen btn-lift group inline-flex cursor-pointer items-center gap-2 rounded-full bg-uk-blue px-5 py-2.5 text-sm font-semibold text-white shadow-glow-blue-sm hover:bg-uk-blue-bright">{ukText("Start the rescue")}<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </ScopingButton>
            </Reveal>
          </Container>
        </section>

        <ByTheNumbers limit={4} title={ukText("Rescue readiness")} className="bg-uk-surface" />
        <CtaBand />
        <PageBlocks pageKey="project-rescue" />
      </main>
      <Footer />
    </>
  );
}