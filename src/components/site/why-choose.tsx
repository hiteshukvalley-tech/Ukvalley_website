import { Check, Building2, Users, FileCode2, Clock, BadgeCheck, IndianRupee } from "lucide-react";
import { SectionHeading } from "./section-heading";
import { Reveal } from "./reveal";
import { StatCounter } from "./stat-counter";
import { Marked } from "./marked";
import { isRealIdentifier } from "@/lib/site-core";
import { getSiteSettings } from "@/lib/settings";
import { getProducts } from "@/lib/products-store";
import { fill } from "@/lib/home-schema";
import type { HomeContent } from "@/lib/home-defaults";
import { ukText } from "@/lib/texts";

/** Reason-card icons, by position. */
const icons = [FileCode2, Clock, Users, Building2, IndianRupee, BadgeCheck];

/** Text comes from Admin → Home page → Why Ukvalley. */
export async function WhyChoose({ content: c }: { content: HomeContent["why"] }) {
  const [productCount, company] = await Promise.all([
    getProducts().then((p) => p.length),
    getSiteSettings(),
  ]);
  const vars = {
    products: productCount,
    // Only a real CIN is shown — never the placeholder.
    registration: isRealIdentifier(company.cin) ? `CIN: ${company.cin}` : company.name,
  };
  const items = c.items.map((d, i) => ({ ...d, icon: icons[i % icons.length], detail: fill(d.detail, vars) }));
  return (
    <section id="why" className="relative overflow-hidden bg-uk-surface-2 section-py">
      <div className="absolute right-0 top-1/4 h-80 w-80 rounded-full bg-uk-blue/15 blur-[130px]" aria-hidden />
      <div className="relative mx-auto max-w-7xl pl-[max(1.25rem,env(safe-area-inset-left))] pr-[max(1.25rem,env(safe-area-inset-right))] lg:px-8">
        <SectionHeading
          align="center"
          eyebrow={ukText(c.eyebrow)}
          title={<Marked text={ukText(c.title)} className="text-gradient-blue" />}
          description={ukText(c.description || undefined)}
        />

        {/* stats band */}
        <Reveal
          staggerChildren
          className="mt-14 grid grid-cols-2 gap-px overflow-hidden rounded-3xl border border-uk-line bg-uk-line lg:grid-cols-4"
        >
          {c.stats.map((s, i) => (
            <div key={`${s.label}-${i}`} className="flex flex-col items-center gap-1.5 bg-uk-card px-4 py-8 text-center">
              <StatCounter
                value={s.value}
                className="font-heading text-4xl font-bold text-uk-blue sm:text-5xl"
              />
              {/* strategic yellow accent under each stat */}
              <span className="h-1 w-8 rounded-full bg-uk-yellow" aria-hidden />
              <span className="text-sm font-semibold text-uk-heading">{ukText(s.label)}</span>
              <span className="text-xs text-uk-gray">{ukText(s.sub)}</span>
            </div>
          ))}
        </Reveal>

        {/* differentiators */}
        <Reveal
          staggerChildren
          className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3"
        >
          {items.map((d, i) => (
            <div
              key={`${d.title}-${i}`}
              className="group relative flex flex-col overflow-hidden rounded-2xl border border-uk-line card-premium card-spotlight bg-uk-card"
            >
              {/* subtle top accent */}
              <div className="h-0.5 w-full bg-gradient-to-r from-uk-blue/30 to-transparent opacity-0 transition-opacity group-hover:opacity-100" aria-hidden />
              <div className="flex flex-1 flex-col gap-3 p-6">
                <div className="flex items-start gap-4">
                  <span className="flex h-11 w-11 flex-none items-center justify-center rounded-xl bg-uk-blue/12 text-uk-blue transition-colors group-hover:bg-uk-blue group-hover:text-uk-white">
                    <d.icon className="h-5 w-5" />
                  </span>
                  <h3 className="font-heading text-base font-bold text-uk-heading pt-2">{ukText(d.title)}</h3>
                </div>
                <p className="text-sm leading-relaxed text-uk-gray">{ukText(d.desc)}</p>
                {d.detail && (
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-uk-blue">
                    <Check className="h-3 w-3" />
                    {ukText(d.detail)}
                  </span>
                )}
                <Check className="absolute right-5 top-5 h-4 w-4 text-uk-blue/30" aria-hidden />
              </div>
            </div>
          ))}
        </Reveal>
      </div>
    </section>
  );
}