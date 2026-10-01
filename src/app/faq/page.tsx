import type { Metadata } from "next";
import Link from "@/components/site/intent-link";
import { ChevronRight, Target, Check, Gauge } from "lucide-react";
import { Header } from "@/components/site/header";
import { Footer } from "@/components/site/footer";
import { ScrollProgress } from "@/components/site/scroll-progress";
import { PageHero, heroExtras } from "@/components/site/page-hero";
import { Container } from "@/components/site/container";
import { Reveal } from "@/components/site/reveal";
import { CtaBand } from "@/components/site/cta";
import { getFaqs } from "@/lib/faqs-store";
import { jsonLd } from "@/lib/utils";

export const metadata: Metadata = {
  title: "FAQ — honest answers about working with Ukvalley",
  description:
    "Straight answers on IP and code ownership, pricing, timelines, response SLAs, vendor takeovers and technology choices — the questions buyers actually ask before signing.",
  alternates: { canonical: "https://ukvalley.com/faq" },
};

type FaqGroup = { label: string; items: { q: string; a: string }[] };

// The admin-managed FAQs (Admin → FAQs, also shown on the home page) lead the
// topic groups below by position; any added beyond the original six are listed
// in their own group so nothing created in the admin goes missing here.
function buildGroups(faqs: { q: string; a: string }[]): FaqGroup[] {
  const groups: FaqGroup[] = [
  {
    label: "Ownership & security",
    items: [
      ...faqs.slice(0, 1),
      {
        q: "How is our data protected during development?",
        a: "Least-privilege access, encrypted secrets and credentials vaulted — never in code. Your data lives on infrastructure you own, in regions you choose. We never pool, reuse or hold client data, and access is revoked the day an engagement ends.",
      },
      {
        q: "What happens if we want to leave mid-project?",
        a: "You can exit cleanly at any point. Code, documentation and credentials are handed over in a documented handover, and there are no penalties or hostage clauses — that's exactly why we can offer it: nothing depends on staying with us.",
      },
    ],
  },
  {
    label: "Pricing & engagement",
    items: [
      ...faqs.slice(1, 2),
      {
        q: "What does a dedicated developer cost per month?",
        a: "It depends on seniority and specialisation, and we quote it in writing after a 30-minute call — typically 30–40% below metro agency rates for equal experience. Every quote includes the 24-hour SLA, code review culture and replace-anytime guarantee.",
      },
      {
        q: "Do you charge for scoping and estimates?",
        a: "No. The scoping call is free, and the written rough estimate within 3 business days is free too. The first paid artefact is the fixed proposal (in 7 days) or the first sprint — you decide which.",
      },
      {
        q: "Can we start small before committing?",
        a: "Yes — most clients start with a paid trial slice: one real task on your codebase or a thin-slice prototype. It prices out the fit and the unknowns before any long-term agreement.",
      },
    ],
  },
  {
    label: "Timelines & process",
    items: [
      ...faqs.slice(2, 3),
      {
        q: "How soon can work start?",
        a: "For dedicated engineers, typically within 48 hours of the scoping call. For projects, a thin-slice prototype ships in week three and the first production release usually lands in 6–8 weeks depending on scope.",
      },
      {
        q: "What do weekly demos look like?",
        a: "Every Friday, a live demo on real software — not a slide deck. You see what shipped, what's next and any decisions needed. It's the same rhythm we run on our own products.",
      },
      {
        q: "How do you handle scope changes?",
        a: "In writing, with a priced change note before the work starts. No surprise invoices: if a change affects cost or timeline, you approve it first — that's part of the fixed-bid discipline.",
      },
      {
        q: "Who do we talk to day to day?",
        a: "A named architect plus a dedicated Slack channel and shared Jira. The architect who scoped your project stays on it — no hand-offs to a faceless pool, no ticket-queue runarounds.",
      },
    ],
  },
  {
    label: "Technology & quality",
    items: [
      ...faqs.slice(5, 6),
      {
        q: "Do you write tests and documentation?",
        a: "Both, as standard: automated test suites wired into CI on every merge, and documentation written for the engineers who come after us — including a handover walkthrough at project end.",
      },
      {
        q: "Can you audit our existing system before we commit?",
        a: "Yes — a paid audit engagement produces a written assessment: what the system does, what's fragile, where the tests are, and a ranked stabilisation plan. The fee is credited against the first sprint if you proceed with us.",
      },
      {
        q: "What's your QA process?",
        a: "Risk-based test plans, automated regression suites in CI, real-device mobile testing, and release sign-off checklists. Bugs found after launch are root-caused, not just patched.",
      },
    ],
  },
  {
    label: "Working across locations",
    items: [
      ...faqs.slice(3, 5),
      {
        q: "Which time zones do you work with?",
        a: "India-first IST hours with overlap windows for US, Canada and the Gulf. Weekly demos are scheduled in your working morning, and communication is async-first with written updates so distance never slows a decision.",
      },
    ],
  },
];
  const extra = faqs.slice(6);
  if (extra.length) groups.push({ label: "More questions", items: extra });
  return groups.filter((g) => g.items.length > 0);
}

export default async function FaqPage() {
  const groups = buildGroups(await getFaqs());
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: groups
      .flatMap((g) => g.items)
      .map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(faqSchema) }}
      />
      <ScrollProgress />
      <Header />
      <main id="main">
        <PageHero
          variant="company"
          extras={heroExtras.company}
          eyebrow="FAQ"
          crumbs={[{ label: "Home", href: "/" }, { label: "FAQ" }]}
          title={
            <>
              Straight answers —{" "}
              <span className="text-gradient-blue">no sales spin.</span>
            </>
          }
          description="Everything buyers ask us before signing: ownership, pricing, timelines, quality and what happens when things change. If your question isn't here, ask it directly — a human architect answers."
        />

        {/* The problem it solves */}
        <section className="relative bg-uk-surface section-py">
          <Container className="max-w-5xl">
            <Reveal>
              <span className="inline-flex w-fit items-center gap-2 rounded-full border border-uk-blue/30 bg-uk-blue/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.22em] text-uk-blue">
                <Target className="h-3.5 w-3.5" />
                The problem it solves
              </span>
            </Reveal>
            <div className="mt-6 grid grid-cols-1 gap-10 lg:grid-cols-[1.25fr_1fr] lg:items-start lg:gap-16">
              <Reveal className="flex flex-col gap-5">
                <h2 className="font-heading text-2xl font-bold text-uk-heading sm:text-3xl">
                  Why most vendor FAQ pages answer nothing that matters
                </h2>
                <p className="text-justify-prose text-base leading-relaxed text-uk-body sm:text-lg">
                  Most agency FAQ pages exist to be seen, not read: "Do you build websites?" "Yes!" "Do you offer support?" "Of course!" — questions with no real information in the answer, designed to fill a page rather than help a buyer decide. The actual hard questions — who owns the code, what happens if an engineer quits, what a change request costs — go conspicuously unasked.
                </p>
                <p className="text-justify-prose text-base leading-relaxed text-uk-body sm:text-lg">
                  That evasiveness costs buyers later: a verbal assurance on a sales call about ownership or timelines has no force once a dispute starts, and the FAQ page that promised "flexible, transparent pricing" turns out to have never actually defined what either word means in the contract.
                </p>
                <p className="text-justify-prose text-base leading-relaxed text-uk-body sm:text-lg">
                  We answer the questions buyers actually ask before signing — ownership, pricing, timelines, what happens when things change — in specific, checkable terms, not marketing adjectives.
                </p>
              </Reveal>

              <Reveal className="flex flex-col gap-5">
                <div className="flex w-full flex-col rounded-2xl border border-uk-line bg-uk-card p-6 sm:p-7">
                  <h3 className="font-heading text-lg font-bold text-uk-heading">Questions worth asking any vendor</h3>
                  <ul className="mt-4 flex flex-col gap-3.5">
                    {[
                      "Who owns the code and credentials from day one?",
                      "What is the response SLA, stated in the contract?",
                      "What happens if the assigned engineer leaves?",
                      "How are scope changes priced and approved?",
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
                      { label: "Questions answered", value: String(groups.reduce((n, g) => n + g.items.length, 0)), sub: "Grouped by topic" },
                      { label: "Topic categories", value: String(groups.length), sub: "Ownership to technology" },
                      { label: "Who answers", value: "An architect", sub: "Not a salesperson" },
                      { label: "Reply time", value: "1 business hr", sub: "On the scoping call" },
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

        {groups.map((g) => (
          <section
            key={g.label}
            className="relative bg-uk-surface-2 section-py first:[&>*]:pt-0"
          >
            <Container className="max-w-5xl">
              <Reveal>
                <h2 className="font-heading text-xl font-bold text-uk-heading sm:text-2xl">
                  {g.label}
                </h2>
              </Reveal>
              <Reveal staggerChildren className="mt-6 flex flex-col gap-3">
                {g.items.map((f) => (
                  <details
                    key={f.q}
                    className="group rounded-2xl border border-uk-line bg-uk-card px-5 py-4 transition-colors hover:border-uk-blue/40 open:border-uk-blue/40"
                  >
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-heading text-base font-semibold text-uk-heading [&::-webkit-details-marker]:hidden">
                      {f.q}
                      <ChevronRight className="h-4 w-4 flex-none text-uk-muted transition-transform group-open:rotate-90" />
                    </summary>
                    <p className="mt-3 text-sm leading-relaxed text-uk-gray">{f.a}</p>
                  </details>
                ))}
              </Reveal>
            </Container>
          </section>
        ))}

        <section className="relative bg-uk-surface section-py">
          <Container>
            <Reveal className="mx-auto flex max-w-2xl flex-col items-center gap-4 rounded-3xl border border-uk-blue/20 bg-uk-surface-blue p-8 text-center">
              <h2 className="font-heading text-2xl font-bold text-uk-heading">
                Still have a question?
              </h2>
              <p className="text-uk-gray">
                Ask it on a free 30-minute scoping call — a software architect
                answers, not a salesperson. A reply within 1 business hour.
              </p>
              <Link
                href="/contact"
                className="btn-sheen group inline-flex items-center gap-2 rounded-full bg-uk-blue px-6 py-3 text-sm font-semibold text-white shadow-glow-blue-sm transition-all hover:bg-uk-blue-bright"
              >
                Contact us
                <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </Reveal>
          </Container>
        </section>

        <CtaBand />
      </main>
      <Footer />
    </>
  );
}