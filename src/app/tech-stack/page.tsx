import type { Metadata } from "next";
import { Header } from "@/components/site/header";
import { Footer } from "@/components/site/footer";
import { ScrollProgress } from "@/components/site/scroll-progress";
import { EditableHero, PageBlocks } from "@/components/site/page-extras";
import { TechStack } from "@/components/site/tech-stack";
import { CtaBand } from "@/components/site/cta";
import { Container } from "@/components/site/container";
import { Reveal } from "@/components/site/reveal";
import { Users, Gauge, Wallet, ShieldCheck, Target, Check } from "lucide-react";
import { getTechStack } from "@/lib/tech-stack-store";
import { defaultHome } from "@/lib/home-defaults";
import { ukText } from "@/lib/texts";

// Re-render at least once a minute so admin text overrides always show up.
export const revalidate = 60;

const criteria = [
  {
    icon: Users,
    title: "Your team's fluency",
    desc: "A team that knows Postgres builds better on Postgres than on a database they are learning under deadline. We start from who will maintain the system in year three.",
  },
  {
    icon: Gauge,
    title: "The load it must carry",
    desc: "Transactional ledgers, real-time dashboards and ingest-heavy pipelines want different stacks. We size for the traffic you will have, not the traffic a demo has.",
  },
  {
    icon: Wallet,
    title: "Total cost, not licence cost",
    desc: "Hosting, hiring and upgrade paths are part of the bill. Open-source, well-staffed stacks usually win for Indian SMEs on the three-year number.",
  },
  {
    icon: ShieldCheck,
    title: "Compliance and longevity",
    desc: "Audit logs, encryption and vendor support horizons decide whether a stack survives an inspection or a framework's end of life. We write the reasoning down.",
  },
];

export const metadata: Metadata = {
  title: "Tech stack — the platforms we build on",
  description:
    "React, Next.js, Angular, Vue, Flutter, Kotlin, Node, Laravel, Django, Python, PHP, Java, MongoDB and PostgreSQL on AWS and Azure. We pick the stack that fits your team — not ours.",
  alternates: { canonical: "https://ukvalley.com/tech-stack" },
};

export default async function TechStackPage() {
  const categories = await getTechStack();
  return (
    <>
      <ScrollProgress />
      <Header />
      <main id="main">
        <EditableHero pageKey="tech-stack"
          eyebrow={ukText("Tech stack")}
          crumbs={[{ label: "Home", href: "/" }, { label: "Tech Stack" }]}
          title={
            <>{ukText("We recommend the stack that fits")}{" "}
              <span className="text-gradient-blue">{ukText("your team")}</span>{ukText("— not ours.")}</>
          }
          description={ukText("The platforms below are what we work with daily. We don't push a preferred stack onto a client; we choose based on your constraints, your team's familiarity and the problem in front of us.")}
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
                <h2 className="font-heading text-2xl font-bold text-uk-heading sm:text-3xl">{ukText("Why the wrong stack costs more than the wrong price")}</h2>
                <p className="text-justify-prose text-base leading-relaxed text-uk-body sm:text-lg">{ukText("Most vendors pick a stack once and quote every project the same way, whether it's a five-page marketing site or a real-time trading dashboard. That's resume-driven development dressed up as expertise — the tool fits the vendor's comfort, not your problem.")}</p>
                <p className="text-justify-prose text-base leading-relaxed text-uk-body sm:text-lg">{ukText("The cost shows up two years in: a marketing site built on a heavyweight framework nobody on your team can maintain, or a lightweight prototype stack straining under production load it was never sized for. By then the rewrite conversation starts, and it starts from a worse position than day one.")}</p>
                <p className="text-justify-prose text-base leading-relaxed text-uk-body sm:text-lg">{ukText("We write the stack decision down before a line of code, against your team's fluency, your real load and your three-year cost — not ours. If the honest answer is a framework we don't specialise in, we say so in writing.")}</p>
              </Reveal>

              <Reveal className="flex flex-col gap-5">
                <div className="flex w-full flex-col rounded-2xl border border-uk-line bg-uk-card p-6 sm:p-7">
                  <h3 className="font-heading text-lg font-bold text-uk-heading">{ukText("Our stack promise")}</h3>
                  <p className="mt-1 text-sm text-uk-gray">{ukText("What you get regardless of which stack fits.")}</p>
                  <ul className="mt-5 flex flex-col gap-4">
                    {[
                      "A written reason for every technology choice, not a house preference",
                      "Sized for the traffic you'll actually have, not a demo's",
                      "Open-source defaults by default — no vendor lock-in on the license",
                      "We'll recommend against our own preference if yours genuinely fits better",
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
                      { label: "Technology categories", value: String(categories.length), sub: "Frontend to testing & QA" },
                      { label: "Technologies covered", value: "33+", sub: "Across every category" },
                      { label: "Reasoning documented", value: "100%", sub: "For every recommendation" },
                      { label: "Vendor lock-in", value: "0%", sub: "Open-source defaults" },
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

        {/* How we choose */}
        <section className="relative bg-uk-surface-2 section-py">
          <Container>
            <Reveal className="max-w-2xl">
              <span className="inline-flex w-fit items-center gap-2 rounded-full border border-uk-blue/30 bg-uk-blue/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.22em] text-uk-blue">{ukText("How we choose")}</span>
              <h2 className="mt-5 font-heading text-2xl font-bold text-uk-heading sm:text-3xl">{ukText("Four questions before any stack decision")}</h2>
              <p className="mt-3 text-sm leading-relaxed text-uk-gray sm:text-base">{ukText("Every recommendation comes as a written note that answers these four questions for your project. It saves the weeks that stack debates usually cost, and in year three the reasoning matters more than the framework name.")}</p>
            </Reveal>
            <Reveal staggerChildren className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {criteria.map((c) => (
                <div key={c.title} className="flex flex-col gap-3 rounded-2xl border border-uk-line bg-uk-card p-6 card-hover">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-uk-blue/12 text-uk-blue">
                    <c.icon className="h-5 w-5" />
                  </span>
                  <h3 className="font-heading text-base font-bold text-uk-heading">{ukText(c.title)}</h3>
                  <p className="text-sm leading-relaxed text-uk-gray">{ukText(c.desc)}</p>
                </div>
              ))}
            </Reveal>
          </Container>
        </section>

        {/* The page hero above already introduces the stack, so the section
            renders without its own heading on this page only. */}
        <TechStack categories={categories} heading={false} content={defaultHome.tech} />

        <section className="relative bg-uk-surface-2 section-py">
          <Container>
            <Reveal className="mx-auto max-w-3xl text-center">
              <h2 className="font-heading text-2xl font-bold text-uk-heading sm:text-3xl">{ukText("Not sure which stack you need?")}</h2>
              <p className="mt-3 text-lg text-uk-gray">{ukText("Tell us your goals and constraints and we'll recommend a stack in writing — no charge, no obligation, and no bias toward the tools we happen to like.")}</p>
            </Reveal>
          </Container>
        </section>

        <CtaBand />
        <PageBlocks pageKey="tech-stack" />
      </main>
      <Footer />
    </>
  );
}