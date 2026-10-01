import type { Metadata } from "next";
import { ArrowRight, Target, Check, Gauge } from "lucide-react";
import { Header } from "@/components/site/header";
import { Footer } from "@/components/site/footer";
import { ScrollProgress } from "@/components/site/scroll-progress";
import { PageHero, heroExtras } from "@/components/site/page-hero";
import { Process } from "@/components/site/process";
import { getProcessSteps } from "@/lib/process-store";
import { TimeSavers } from "@/components/site/time-savers";
import { PhotoPanel, photos } from "@/components/site/photo-panel";
import { CtaBand } from "@/components/site/cta";
import { Container } from "@/components/site/container";
import { Reveal } from "@/components/site/reveal";
import { ScopingButton } from "@/components/site/scoping-modal";

export const metadata: Metadata = {
  title: "How we work — our software delivery process",
  description:
    "From a free scoping call to a thin-slice prototype in week three, two-week build sprints with weekly demos, to launch and ongoing support with a 24-hour SLA.",
  alternates: { canonical: "https://ukvalley.com/process" },
};

export default async function ProcessPage() {
  const steps = await getProcessSteps();
  return (
    <>
      <ScrollProgress />
      <Header />
      <main id="main">
        <PageHero variant="company"
          extras={heroExtras.company}
          eyebrow="How we work"
          crumbs={[{ label: "Home", href: "/" }, { label: "Process" }]}
          title={
            <>
              Real software by week three —{" "}
              <span className="text-gradient-blue">not slides.</span>
            </>
          }
          description="A four-stage process built around working software, weekly demos and full visibility. You get shared Jira, a Slack channel and an architect on the call — not a sales bot."
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
                  Why most software projects go dark between kickoff and launch
                </h2>
                <p className="text-justify-prose text-base leading-relaxed text-uk-body sm:text-lg">
                  A typical vendor engagement starts with an enthusiastic kickoff call, then disappears into a black box for two or three months. You get a status email that says "on track" whether or not it's true, and the first time you see working software is the week it's supposed to launch — which is also the worst possible week to discover it doesn't do what you needed.
                </p>
                <p className="text-justify-prose text-base leading-relaxed text-uk-body sm:text-lg">
                  That silence is expensive: by the time a misunderstanding surfaces, months of work sit on the wrong foundation, and fixing it costs far more than catching it in week three would have. Worse, "on track" status updates train stakeholders to stop asking questions, right up until the deadline slips.
                </p>
                <p className="text-justify-prose text-base leading-relaxed text-uk-body sm:text-lg">
                  Our process removes the black box entirely: a working thin slice by week three, a live demo every Friday, and a written sprint note every Monday. You always know exactly where the project stands, because you can see it running.
                </p>
              </Reveal>

              <Reveal className="flex flex-col gap-5">
                <div className="flex w-full flex-col rounded-2xl border border-uk-line bg-uk-card p-6 sm:p-7">
                  <h3 className="font-heading text-lg font-bold text-uk-heading">Signs you're in a black box</h3>
                  <ul className="mt-4 flex flex-col gap-3.5">
                    {[
                      "\"On track\" is the only update you ever get",
                      "You haven't seen working software after week four",
                      "Questions get answered by a project manager, not an engineer",
                      "Scope changes surface as an invoice, not a conversation first",
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
                    Our process, at a glance
                  </h3>
                  <dl className="mt-4 flex flex-col divide-y divide-uk-line">
                    {[
                      { label: "Written scope", value: "3 days", sub: "After the scoping call" },
                      { label: "Working thin slice", value: "Week 3", sub: "Not a slide, real software" },
                      { label: "Live demo cadence", value: "Weekly", sub: "Every Friday, on real software" },
                      { label: "Response time", value: "24 hrs", sub: "Usually under 4" },
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

        <Process steps={steps} />

        <PhotoPanel
          photo={photos.work}
          flip
          eyebrow="A week with us"
          title="What lands in your inbox every single week."
          facts={[
            "Friday: a live demo on real software, 30 minutes",
            "Monday: a written sprint note — shipped, next, decisions needed",
            "Any day: a reply inside 24 hours, usually under 4",
            "Month-end: a health and cost report you can forward to finance",
          ]}
          caption="Shared board, shared channel, one architect — the whole project visible at any hour."
        >
          <p>
            You never have to ask where the project stands. The shared board shows every ticket,
            the Slack channel carries every decision, and the Friday demo shows the software as it
            actually is — not as a slide describes it.
          </p>
          <p>
            That rhythm is also where your time comes back. One demo replaces the status meetings,
            the written sprint note replaces the chase-up emails, and the 24-hour SLA means no
            decision waits on a vendor who has gone quiet.
          </p>
        </PhotoPanel>

        <TimeSavers className="bg-uk-surface-2" />

        {/* What happens next */}
        <section className="relative bg-uk-surface section-py">
          <Container>
            <Reveal className="mx-auto max-w-3xl rounded-3xl border border-uk-blue/20 bg-uk-surface-blue p-8 text-center sm:p-12">
              <span className="inline-flex items-center gap-2 rounded-full bg-uk-blue/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-uk-blue">
                What happens next
              </span>
              <h2 className="mt-5 font-heading text-2xl font-bold text-uk-heading sm:text-3xl">
                A reply within 1 business hour.
              </h2>
              <p className="mt-3 text-uk-gray">
                A rough estimate in 3 business days. A fixed proposal in 7. No
                charge, no obligation — and no &ldquo;let&apos;s hop on a quick
                call&rdquo; loops that go nowhere.
              </p>
              <div className="mt-7 flex justify-center">
                <ScopingButton className="btn-sheen btn-lift group inline-flex h-13 cursor-pointer items-center gap-2 rounded-full bg-uk-blue px-7 font-heading text-base font-bold text-white shadow-glow-blue-sm hover:bg-uk-blue-bright">
                  Book a free scoping call
                  <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </ScopingButton>
              </div>
            </Reveal>
          </Container>
        </section>

        <CtaBand />
      </main>
      <Footer />
    </>
  );
}