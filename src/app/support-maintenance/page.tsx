import type { Metadata } from "next";
import {
  Cloud, Activity, ShieldCheck, Wrench, ArrowRight, Clock,
  FileBarChart, LifeBuoy, DatabaseBackup, RefreshCcw, Gauge, Target, Check,
} from "lucide-react";
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

export const metadata: Metadata = {
  title: "Support & maintenance — a 24-hour SLA, stated in writing",
  description:
    "Ukvalley's support and maintenance plans: 24-hour response SLA, 24×7 monitoring, patching, backups with tested restores and monthly health reports for the systems we build — and ones we didn't.",
  alternates: { canonical: "https://ukvalley.com/support-maintenance" },
};

const plans = [
  {
    name: "Essential care",
    tagline: "Keep it healthy",
    for: "Systems we built, light-touch support",
    items: [
      "24-hour response SLA on tickets",
      "Bug fixes & small improvements",
      "Monthly health & uptime report",
      "Backup monitoring & restore drills",
      "Dependency & patch updates",
    ],
    best: "Best for stable systems with steady traffic",
  },
  {
    name: "Managed operations",
    tagline: "We run it, you build",
    for: "24×7 monitoring with on-call cover",
    items: [
      "Everything in Essential care",
      "24×7 monitoring, alerting & on-call",
      "1-hour first response on incidents",
      "Infrastructure-as-code upkeep",
      "Cost & performance optimisation",
      "Quarterly architecture review",
    ],
    best: "Best for revenue-critical platforms",
  },
  {
    name: "Growth retainer",
    tagline: "Maintain & extend",
    for: "Ongoing features on a predictable budget",
    items: [
      "Everything in Managed operations",
      "Reserved hours for new features",
      "Priority sprint planning",
      "Dedicated Slack channel",
      "Named engineer continuity",
    ],
    best: "Best for products under active growth",
  },
];

const coverage = [
  { icon: Activity, title: "24×7 monitoring", desc: "Metrics, logs and alert routes that reach a human — with uptime and incident history in your monthly report." },
  { icon: DatabaseBackup, title: "Backups that restore", desc: "Scheduled backups with periodic restore drills — an untested backup is a hope, not a plan." },
  { icon: RefreshCcw, title: "Patching & upgrades", desc: "Dependency updates, security patches and framework upgrades scheduled, tested and documented." },
  { icon: Gauge, title: "Performance upkeep", desc: "Slow queries caught before users feel them — with monthly reviews of latency and error budgets." },
  { icon: FileBarChart, title: "Monthly reporting", desc: "Uptime, incidents, cost and backlog movement — one written report you can actually read." },
  { icon: LifeBuoy, title: "Named engineers", desc: "You talk to the people who know your system, not a ticket queue reading from a script." },
];

export default function SupportMaintenancePage() {
  return (
    <>
      <ScrollProgress />
      <Header />
      <main id="main">
        <EditableHero pageKey="support-maintenance"
          variant="company"
          extras={heroExtras.company}
          eyebrow={ukText("Support & SLA")}
          crumbs={[{ label: "Home", href: "/" }, { label: "Support & Maintenance" }]}
          title={
            <>{ukText("Software is a living system —")}{" "}
              <span className="text-gradient-blue">{ukText("we keep it alive.")}</span>
            </>
          }
          description={ukText("Launch is the start, not the finish line. Our support plans keep the systems we build — and the ones we didn't — patched, monitored and improving, with a 24-hour response SLA stated in every contract.")}
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
                <h2 className="font-heading text-2xl font-bold text-uk-heading sm:text-3xl">{ukText("Why launch day is where most vendor relationships quietly end")}</h2>
                <p className="text-justify-prose text-base leading-relaxed text-uk-body sm:text-lg">{ukText("Most development contracts end at launch, which is exactly the point where a system starts needing attention: dependencies drift out of date, traffic patterns emerge that the original build never anticipated, and the one person who understood the deployment pipeline has moved on to the next client. Nobody notices until a backup fails to restore during an actual incident.")}</p>
                <p className="text-justify-prose text-base leading-relaxed text-uk-body sm:text-lg">{ukText("The cost is invisible right up until it isn't: a security patch that never shipped becomes the entry point for a breach, a slow query nobody profiled becomes a customer-facing outage, and an untested backup turns a recoverable mistake into a permanent one. By then the original vendor is unreachable or quoting emergency rates.")}</p>
                <p className="text-justify-prose text-base leading-relaxed text-uk-body sm:text-lg">{ukText("We treat support as a continuation of the same engineering discipline, not a separate downgraded tier — the same architects, the same 24-hour SLA, and backups we actually restore-test rather than just schedule.")}</p>
              </Reveal>

              <Reveal className="flex flex-col gap-5">
                <div className="flex w-full flex-col rounded-2xl border border-uk-line bg-uk-card p-6 sm:p-7">
                  <h3 className="font-heading text-lg font-bold text-uk-heading">{ukText("Signs a system is unsupported")}</h3>
                  <ul className="mt-4 flex flex-col gap-3.5">
                    {[
                      "Nobody has restore-tested a backup in the last year",
                      "Dependencies and security patches are months behind",
                      "No one can name who gets paged if it goes down tonight",
                      "The last vendor is unreachable or quoting emergency rates",
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
                      { label: "Response SLA", value: "24 hrs", sub: "Stated in every contract" },
                      { label: "Incident first response", value: "1 hr", sub: "On managed operations" },
                      { label: "Support tiers", value: String(plans.length), sub: "Month-to-month after quarter one" },
                      { label: "Systems we didn't build", value: "Welcome", sub: "Audit first, then stabilise" },
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

        {/* Coverage grid */}
        <section className="relative bg-uk-surface-2 section-py">
          <Container>
            <Reveal className="max-w-2xl">
              <h2 className="font-heading text-2xl font-bold text-uk-heading sm:text-3xl">{ukText("What every plan covers")}</h2>
              <p className="mt-3 text-uk-gray">{ukText("The unglamorous discipline that keeps systems live for years — standard on every plan, never an upsell.")}</p>
            </Reveal>
            <Reveal staggerChildren className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {coverage.map((c) => (
                <div
                  key={c.title}
                  className="flex flex-col gap-3 rounded-2xl border border-uk-line bg-uk-card p-6 card-hover"
                >
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-uk-blue/12 text-uk-blue">
                    <c.icon className="h-5 w-5" />
                  </span>
                  <h3 className="font-heading text-base font-bold text-uk-heading">
                    {ukText(c.title)}
                  </h3>
                  <p className="text-sm leading-relaxed text-uk-gray">{ukText(c.desc)}</p>
                </div>
              ))}
            </Reveal>
          </Container>
        </section>

        <ByTheNumbers title={ukText("Support scoreboard")} className="bg-uk-surface" />

        {/* Plans */}
        <section className="relative bg-uk-surface-2 section-py">
          <Container>
            <Reveal className="max-w-2xl">
              <h2 className="font-heading text-2xl font-bold text-uk-heading sm:text-3xl">{ukText("Support plans")}</h2>
              <p className="mt-3 text-uk-gray">{ukText("Three tiers, transparent scope, no lock-in — every plan is month-to-month after the first quarter.")}</p>
            </Reveal>
            <Reveal staggerChildren className="mt-10 grid grid-cols-1 gap-5 lg:grid-cols-3">
              {plans.map((p, i) => (
                <div
                  key={p.name}
                  className={`flex flex-col rounded-3xl border p-7 transition-all duration-300 hover:-translate-y-1 ${
                    i === 1
                      ? "border-uk-blue/40 bg-uk-surface-blue shadow-glow-blue-sm"
                      : "border-uk-line bg-uk-card"
                  }`}
                >
                  {i === 1 && (
                    <span className="mb-4 w-fit rounded-full bg-uk-blue px-3 py-1 text-[0.65rem] font-bold uppercase tracking-widest text-uk-white">{ukText("Most popular")}</span>
                  )}
                  <h3 className="font-heading text-xl font-bold text-uk-heading">
                    {ukText(p.name)}
                  </h3>
                  <p className="mt-1 text-sm font-medium text-uk-blue">{ukText(p.tagline)}</p>
                  <p className="mt-2 text-xs text-uk-gray">{ukText(p.for)}</p>
                  <ul className="mt-5 flex flex-col gap-2.5">
                    {p.items.map((item) => (
                      <li key={item} className="flex items-start gap-2.5 text-sm text-uk-body">
                        <Clock className="mt-0.5 h-4 w-4 flex-none text-uk-blue" />
                        {ukText(item)}
                      </li>
                    ))}
                  </ul>
                  <p className="mt-5 border-t border-uk-line pt-4 text-xs text-uk-muted">
                    {ukText(p.best)}
                  </p>
                  <div className="mt-4">
                    <ScopingButton className="group inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-uk-blue px-5 py-2.5 text-sm font-semibold text-white shadow-glow-blue-sm transition-all hover:bg-uk-blue-bright">{ukText("Get a quote")}<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </ScopingButton>
                  </div>
                </div>
              ))}
            </Reveal>

            <Reveal className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-3">
              <div className="flex gap-3 rounded-2xl border border-uk-line bg-uk-card p-5">
                <ShieldCheck className="h-5 w-5 flex-none text-uk-blue" />
                <p className="text-sm leading-relaxed text-uk-gray">
                  <span className="font-semibold text-uk-heading">{ukText("We take over existing systems.")}</span>{" "}{ukText("Audit first, stabilise second, then support — even if another vendor built it.")}</p>
              </div>
              <div className="flex gap-3 rounded-2xl border border-uk-line bg-uk-card p-5">
                <Wrench className="h-5 w-5 flex-none text-uk-blue" />
                <p className="text-sm leading-relaxed text-uk-gray">
                  <span className="font-semibold text-uk-heading">{ukText("Nothing depends on us.")}</span>{" "}{ukText("Code, infrastructure and credentials stay in your ownership throughout.")}</p>
              </div>
              <div className="flex gap-3 rounded-2xl border border-uk-line bg-uk-card p-5">
                <Cloud className="h-5 w-5 flex-none text-uk-blue" />
                <p className="text-sm leading-relaxed text-uk-gray">
                  <span className="font-semibold text-uk-heading">{ukText("Cost stays honest.")}</span>{" "}{ukText("Monthly cost reviews with budget alerts — no silent cloud-bill creep.")}</p>
              </div>
            </Reveal>
          </Container>
        </section>

        <CtaBand />
        <PageBlocks pageKey="support-maintenance" />
      </main>
      <Footer />
    </>
  );
}