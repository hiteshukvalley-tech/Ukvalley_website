import Link from "@/components/site/intent-link";
import { ArrowRight, TrendingUp } from "lucide-react";
import { SectionHeading } from "./section-heading";
import { Reveal } from "./reveal";
import { GrowBar } from "./grow-bar";
import { Marked } from "./marked";
import { getCaseStudies } from "@/lib/cases-store";
import { fill } from "@/lib/home-schema";
import type { HomeContent } from "@/lib/home-defaults";
import { ukText } from "@/lib/texts";

// The homepage previews a few engagements ("A few anonymised engagements");
// the full set lives on /case-studies. Showing all of them made the home
// page dozens of screens long on phones.
const PREVIEW_COUNT = 4;

/** Cards come from Admin → Case studies; text from Admin → Home page → Case studies. */
export async function CaseStudies({ content: c }: { content: HomeContent["caseStudies"] }) {
  const { challengeLabel, outcomeLabel } = c;
  const caseStudies = await getCaseStudies();
  return (
    <section id="work" className="relative bg-uk-surface section-py">
      <div className="relative mx-auto max-w-7xl pl-[max(1.25rem,env(safe-area-inset-left))] pr-[max(1.25rem,env(safe-area-inset-right))] lg:px-8">
        <div className="flex flex-col items-center">
          <SectionHeading
            align="center"
            eyebrow={ukText(c.eyebrow)}
            title={<Marked text={ukText(c.title)} />}
            description={ukText(c.description || undefined)}
          />
          <Reveal className="mt-6 self-end">
            <Link
              href={ukText("/case-studies")}
              className="group inline-flex items-center gap-2 text-sm font-semibold text-uk-blue transition-colors hover:text-uk-blue-bright"
            >
              {ukText(fill(c.linkLabel, { count: caseStudies.length }))}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </Reveal>
        </div>

        <Reveal staggerChildren className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-2">
          {caseStudies.slice(0, PREVIEW_COUNT).map((c) => (
            <article
              key={c.title}
              className="group relative flex flex-col overflow-hidden rounded-3xl border border-uk-line card-premium card-spotlight bg-uk-card"
            >
              {/* top accent */}
              <div className="h-1 w-full bg-gradient-to-r from-uk-blue/40 to-uk-yellow/40 opacity-60 transition-opacity group-hover:opacity-100" aria-hidden />
              <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-uk-blue/0 blur-3xl transition-all duration-500 group-hover:bg-uk-blue/20" aria-hidden />

              <div className="flex flex-1 flex-col p-7 sm:p-8">
                <div className="flex items-center justify-between gap-4">
                  <span className="inline-flex flex-none items-center gap-2 whitespace-nowrap rounded-full bg-uk-blue/12 px-3 py-1 text-xs font-bold uppercase tracking-wider text-uk-blue">
                    {ukText(c.sector)}
                  </span>
                  <span className="text-right text-xs font-medium text-uk-gray">{ukText(c.client)}</span>
                </div>

                <h3 className="mt-5 font-heading text-xl font-bold leading-snug text-uk-heading sm:text-2xl">
                  {ukText(c.title)}
                </h3>

                <div className="mt-4 flex flex-col gap-3 text-sm leading-relaxed text-uk-gray">
                  <p>
                    <span className="font-semibold text-uk-heading">{ukText(challengeLabel)} </span>
                    {ukText(c.problem)}
                  </p>
                  <p>
                    <span className="font-semibold text-uk-heading">{ukText(outcomeLabel)} </span>
                    {ukText(c.result)}
                  </p>
                </div>

                {/* metrics — mini outcome bars */}
                <div className="mt-6 grid grid-cols-1 gap-2.5 border-t border-uk-line pt-6 xl:grid-cols-3 xl:gap-3">
                  {c.metrics.map((m, mi) => (
                    <div key={m.label} className="flex flex-col gap-1.5">
                      <span className="font-heading text-balance text-xl font-bold text-uk-blue">{ukText(m.value)}</span>
                      <GrowBar
                        className="h-1 w-full rounded-full bg-gradient-to-r from-uk-blue to-uk-yellow"
                        delay={mi * 120}
                      />
                      <span className="text-[0.72rem] leading-tight text-uk-gray">{ukText(m.label)}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-5 flex items-center justify-between">
                  <div className="flex flex-wrap gap-1.5">
                    {c.stack.map((t) => (
                      <span key={t} className="rounded-md bg-uk-surface-blue px-2 py-1 text-[0.7rem] font-medium text-uk-body">
                        {ukText(t)}
                      </span>
                    ))}
                  </div>
                  <Link
                    href={ukText(`/case-studies/${c.slug}`)}
                    className="inline-flex h-9 w-9 flex-none items-center justify-center rounded-full bg-uk-blue/10 text-uk-blue transition-all group-hover:bg-uk-blue group-hover:text-uk-white"
                    aria-label={`Read ${c.title} case study`}
                  >
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </Reveal>

        {c.footnote && (
          <Reveal className="mt-10 flex items-center justify-center gap-2 text-sm text-uk-gray">
            <TrendingUp className="h-4 w-4 text-uk-blue" />
            {ukText(c.footnote)}
          </Reveal>
        )}
      </div>
    </section>
  );
}