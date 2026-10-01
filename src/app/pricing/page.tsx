import type { Metadata } from "next";
import { Check, Minus, ArrowRight, CalendarClock, Layers, Target, Gauge } from "lucide-react";
import { Header } from "@/components/site/header";
import { ScopingButton } from "@/components/site/scoping-modal";
import { Footer } from "@/components/site/footer";
import { ScrollProgress } from "@/components/site/scroll-progress";
import { PageHero, heroExtras } from "@/components/site/page-hero";
import { Container } from "@/components/site/container";
import { Reveal } from "@/components/site/reveal";
import { SectionHeading } from "@/components/site/section-heading";
import { CtaBand } from "@/components/site/cta";
import { getEngagementModels } from "@/lib/engagement-store";

export const metadata: Metadata = {
  title: "Pricing — how Ukvalley quotes, honestly",
  description:
    "How Ukvalley quotes custom software: what actually drives cost, from a single-workflow tool to a multi-department platform, plus dedicated-developer and retainer models. Written estimates in 3 days.",
  alternates: { canonical: "https://ukvalley.com/pricing" },
};

const bands = [
  {
    band: "Tier 1",
    name: "Single-workflow tool",
    shape: "One workflow · one admin role · no integrations",
    examples: ["A quotation generator", "An internal admin tool", "A single-purpose calculator or portal"],
    includes: ["Thin-slice prototype in week 3", "Fixed-bid with milestones", "Source code handover + docs"],
    time: "4–8 weeks",
  },
  {
    band: "Tier 2",
    name: "Departmental system",
    shape: "CRM/ERP/HRMS · 2–5 roles · 1–3 integrations",
    examples: ["CRM with Tally sync & role-based access", "POS + inventory across a few stores", "HRMS with payroll for one entity"],
    featured: true,
    includes: ["Everything in tier one", "Role-based access & audit trail", "Data migration & integrations", "Training + 1 quarter of support"],
    time: "8–14 weeks",
  },
  {
    band: "Tier 3",
    name: "Platform / multi-department",
    shape: "Multi-department ERP · customer-facing apps · audit requirements",
    examples: ["Loan origination for an NBFC", "Multi-store retail platform with HQ dashboards", "SaaS product with mobile apps"],
    includes: ["Architecture & data-model sign-off", "Staged rollout with training", "Managed-support options", "Scale, security & audit hardening"],
    time: "3–6+ months",
  },
];

const always = [
  "A written scope before any code",
  "Thin-slice prototype by week three",
  "Code, repos & credentials in your ownership",
  "NDA & IP assignment signed day one",
  "24-hour response SLA in the contract",
  "Clean exit rights at any point",
];

const compare = [
  { label: "Written scope & estimate before commit", us: true, agency: true, freelance: true },
  { label: "You own code & credentials from day one", us: true, agency: false, freelance: true },
  { label: "Response SLA stated in the contract", us: true, agency: false, freelance: false },
  { label: "Working software by week three", us: true, agency: false, freelance: false },
  { label: "Replace-anytime engineer guarantee", us: true, agency: false, freelance: false },
  { label: "Team continuity (no lone-bus factor)", us: true, agency: true, freelance: false },
];

export default async function PricingPage() {
  const engagementModels = await getEngagementModels();
  return (
    <>
      <ScrollProgress />
      <Header />
      <main id="main">
        <PageHero
          variant="company"
          extras={heroExtras.company}
          eyebrow="Pricing"
          crumbs={[{ label: "Home", href: "/" }, { label: "Pricing" }]}
          title={
            <>
              Honest pricing logic —{" "}
              <span className="text-gradient-blue">before you ever talk to us.</span>
            </>
          }
          description="Custom software quotes for 'the same app' can differ by ten times or more. Here's why, and which tier your project actually falls in — published openly, because informed buyers make better clients."
        />

        {/* The problem it solves */}
        <section className="relative bg-uk-surface section-py">
          <Container>
            <Reveal>
              <span className="inline-flex w-fit items-center gap-2 rounded-full border border-uk-blue/30 bg-uk-blue/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.22em] text-uk-blue">
                <Target className="h-3.5 w-3.5" />
                The problem it solves
              </span>
            </Reveal>
            <div className="mt-6 grid grid-cols-1 gap-10 lg:grid-cols-[1.25fr_1fr] lg:items-start lg:gap-16">
              <Reveal className="flex flex-col gap-5">
                <h2 className="font-heading text-2xl font-bold text-uk-heading sm:text-3xl">
                  Why quotes for "the same app" differ by ten times
                </h2>
                <p className="text-justify-prose text-base leading-relaxed text-uk-body sm:text-lg">
                  Ask five vendors what a custom CRM costs and you'll get five wildly different answers. Nobody is lying — they're quoting different things, because most buyers describe the app by its screens, and screen count is almost irrelevant to what actually drives the price.
                </p>
                <p className="text-justify-prose text-base leading-relaxed text-uk-body sm:text-lg">
                  The opacity costs buyers at the negotiation table: without knowing which variables actually move the number, it's impossible to tell whether a low quote is a genuine efficiency or a bait price that grows once the contract is signed, or whether a high quote reflects real complexity or just a bigger logo on the invoice.
                </p>
                <p className="text-justify-prose text-base leading-relaxed text-uk-body sm:text-lg">
                  We publish the three variables that actually drive cost — distinct user roles, external integrations and how much of the workflow is genuinely custom — so you can sanity-check any quote, including ours, before you sign anything.
                </p>
              </Reveal>

              <Reveal className="flex flex-col gap-5">
                <div className="flex w-full flex-col rounded-2xl border border-uk-line bg-uk-card p-6 sm:p-7">
                  <h3 className="font-heading text-lg font-bold text-uk-heading">What actually moves the price</h3>
                  <ul className="mt-4 flex flex-col gap-3.5">
                    {[
                      "Distinct user roles needing different screens",
                      "External systems that must be integrated",
                      "How much of the workflow is genuinely custom",
                      "Screen count — almost irrelevant, despite appearances",
                    ].map((item) => (
                      <li key={item} className="flex items-start gap-3">
                        <span className="mt-0.5 flex h-6 w-6 flex-none items-center justify-center rounded-full bg-uk-blue/12 text-uk-blue">
                          <Check className="h-3.5 w-3.5" strokeWidth={3} />
                        </span>
                        <p className="text-sm leading-relaxed text-uk-body">{item}</p>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex w-full flex-col rounded-2xl border border-uk-blue/20 bg-uk-surface-blue p-6 sm:p-7">
                  <h3 className="flex items-center gap-2 font-heading text-lg font-bold text-uk-heading">
                    <Gauge className="h-4 w-4 text-uk-blue" />
                    At a glance
                  </h3>
                  <dl className="mt-4 flex flex-col divide-y divide-uk-line">
                    {[
                      { label: "Pricing tiers published", value: "3", sub: "Scope-based, not screen count" },
                      { label: "Written rough estimate", value: "3 days", sub: "After the scoping call" },
                      { label: "Fixed proposal", value: "7 days", sub: "No discovery-loop billing" },
                      { label: "Always included", value: String(always.length), sub: "Never sold as an upsell" },
                    ].map((f) => (
                      <div key={f.label} className="flex items-baseline justify-between gap-4 py-3">
                        <dt className="text-sm text-uk-gray">
                          {f.label}
                          <span className="block text-xs text-uk-muted">{f.sub}</span>
                        </dt>
                        <dd className="whitespace-nowrap font-heading text-base font-bold text-uk-blue">{f.value}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              </Reveal>
            </div>
          </Container>
        </section>

        {/* Bands */}
        <section className="relative bg-uk-surface-2 section-py">
          <Container>
            <Reveal className="max-w-2xl">
              <h2 className="font-heading text-2xl font-bold text-uk-heading sm:text-3xl">
                The three tiers
              </h2>
              <p className="mt-3 text-uk-gray">
                Three variables, not screen counts: how many distinct user roles
                need different screens, how many external systems must be
                integrated, and how much of the workflow is genuinely custom.
              </p>
            </Reveal>
            <Reveal staggerChildren className="mt-10 grid grid-cols-1 gap-5 lg:grid-cols-3">
              {bands.map((b) => (
                <div
                  key={b.band}
                  className={`flex flex-col rounded-3xl border p-7 transition-all duration-300 hover:-translate-y-1 ${
                    b.featured
                      ? "border-uk-blue/40 bg-uk-surface-blue shadow-glow-blue-sm"
                      : "border-uk-line bg-uk-card"
                  }`}
                >
                  {b.featured && (
                    <span className="mb-4 w-fit rounded-full bg-uk-blue px-3 py-1 text-[0.65rem] font-bold uppercase tracking-widest text-uk-white">
                      Most common
                    </span>
                  )}
                  <span className="font-heading text-3xl font-bold text-uk-blue">
                    {b.band}
                  </span>
                  <h3 className="mt-2 font-heading text-lg font-bold text-uk-heading">
                    {b.name}
                  </h3>
                  <p className="mt-1 text-xs text-uk-gray">{b.shape}</p>
                  <p className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-uk-muted">
                    <CalendarClock className="h-3.5 w-3.5 text-uk-blue" />
                    Typically {b.time}
                  </p>
                  <ul className="mt-5 flex flex-1 flex-col gap-2.5 border-t border-uk-line pt-4">
                    {b.includes.map((i) => (
                      <li key={i} className="flex items-start gap-2.5 text-sm text-uk-body">
                        <Check className="mt-0.5 h-4 w-4 flex-none text-uk-blue" />
                        {i}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-5 flex flex-col gap-1.5 border-t border-uk-line pt-4">
                    <span className="text-[0.68rem] font-bold uppercase tracking-[0.2em] text-uk-muted">
                      Fits
                    </span>
                    {b.examples?.map((e) => (
                      <span key={e} className="text-xs text-uk-gray">
                        {e}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </Reveal>
          </Container>
        </section>

        {/* Engagement models + always included */}
        <section className="relative bg-uk-surface section-py">
          <Container>
            <SectionHeading
              eyebrow="Billing models"
              title={<>Pick the model — the inclusions never change.</>}
            />
            <Reveal staggerChildren className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {engagementModels.map((m) => (
                <div
                  key={m.name}
                  className="flex flex-col gap-3 rounded-2xl border border-uk-line bg-uk-card p-6 card-hover"
                >
                  <h3 className="font-heading text-base font-bold text-uk-blue">
                    {m.name}
                  </h3>
                  <p className="text-sm leading-relaxed text-uk-gray">{m.desc}</p>
                  <span className="mt-auto inline-flex w-fit items-center gap-1.5 rounded-full bg-uk-surface-blue px-3 py-1 text-xs font-medium text-uk-body">
                    <Layers className="h-3 w-3" />
                    {m.best}
                  </span>
                </div>
              ))}
            </Reveal>

            <Reveal className="mt-10 rounded-2xl border border-uk-blue/20 bg-uk-surface-blue p-6 sm:p-8">
              <h3 className="font-heading text-lg font-bold text-uk-heading">
                Included in every quote — never an upsell
              </h3>
              <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {always.map((a) => (
                  <span key={a} className="flex items-center gap-2.5 text-sm text-uk-heading">
                    <Check className="h-4 w-4 flex-none text-uk-blue" />
                    {a}
                  </span>
                ))}
              </div>
            </Reveal>
          </Container>
        </section>

        {/* Comparison */}
        <section className="relative bg-uk-surface section-py">
          <div className="absolute inset-0 bg-dots opacity-20" aria-hidden />
          <Container className="relative">
            <Reveal className="max-w-2xl">
              <h2 className="font-heading text-2xl font-bold text-uk-heading sm:text-3xl">
                Us vs. agency vs. freelancer
              </h2>
              <p className="mt-3 text-uk-gray">
                All three are legitimate choices. Here&apos;s the honest
                trade-off table so you can pick the right one for your risk
                tolerance.
              </p>
            </Reveal>
            <Reveal className="mt-10 overflow-x-auto">
              <table className="w-full min-w-[560px] border-separate border-spacing-0">
                <thead>
                  <tr>
                    <th className="rounded-tl-2xl border-b border-uk-line bg-uk-card px-5 py-4 text-left font-heading text-sm font-bold text-uk-heading">
                      Guarantee
                    </th>
                    <th className="border-b border-uk-line bg-uk-blue/10 px-5 py-4 text-center font-heading text-sm font-bold text-uk-blue">
                      Ukvalley
                    </th>
                    <th className="border-b border-uk-line bg-uk-card px-5 py-4 text-center font-heading text-sm font-bold text-uk-heading">
                      Metro agency
                    </th>
                    <th className="rounded-tr-2xl border-b border-uk-line bg-uk-card px-5 py-4 text-center font-heading text-sm font-bold text-uk-heading">
                      Freelancer
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {compare.map((c, i) => (
                    <tr key={c.label}>
                      <td className={`border-b border-uk-line bg-uk-card px-5 py-4 text-sm font-medium text-uk-heading ${i === compare.length - 1 ? "rounded-bl-2xl" : ""}`}>
                        {c.label}
                      </td>
                      {[c.us, c.agency, c.freelance].map((v, j) => (
                        <td
                          key={j}
                          className={`border-b border-uk-line ${j === 0 ? "bg-uk-blue/5" : "bg-uk-card"} px-5 py-4 text-center ${i === compare.length - 1 && j === 2 ? "rounded-br-2xl" : ""}`}
                        >
                          {v ? (
                            <Check className="mx-auto h-4 w-4 text-uk-blue" aria-label="Yes" />
                          ) : (
                            <Minus className="mx-auto h-4 w-4 text-uk-muted/50" aria-label="No" />
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </Reveal>

            <Reveal className="mt-12 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-uk-blue/20 bg-uk-surface-blue p-6 sm:p-8">
              <div className="max-w-xl">
                <h3 className="font-heading text-lg font-bold text-uk-heading">
                  Get your tier confirmed in 3 days.
                </h3>
                <p className="mt-1 text-sm text-uk-gray">
                  A free scoping call, a written rough estimate in 3 business
                  days, a fixed proposal in 7 — no charge, no obligation.
                </p>
              </div>
              <ScopingButton className="btn-sheen btn-lift group inline-flex cursor-pointer items-center gap-2 rounded-full bg-uk-blue px-5 py-2.5 text-sm font-semibold text-white shadow-glow-blue-sm hover:bg-uk-blue-bright">
                Get an estimate
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </ScopingButton>
            </Reveal>
          </Container>
        </section>

        <CtaBand />
      </main>
      <Footer />
    </>
  );
}