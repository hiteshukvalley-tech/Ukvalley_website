import Link from "@/components/site/intent-link";
import { ArrowRight, Check, Handshake, Users, RefreshCw, UserPlus } from "lucide-react";
import { SectionHeading } from "./section-heading";
import { Reveal } from "./reveal";
import { Marked } from "./marked";
import { getEngagementModels } from "@/lib/engagement-store";
import { countVars, fill } from "@/lib/home-schema";
import { defaultHome, type HomeContent } from "@/lib/home-defaults";

const icons = [Handshake, Users, RefreshCw, UserPlus];

/**
 * Models come from Admin → Engagement; text from Admin → Home page →
 * Engagement models (the /engagement page uses the defaults).
 */
export async function Engagement({ content: c = defaultHome.engagement }: { content?: HomeContent["engagement"] }) {
  const engagementModels = await getEngagementModels();
  const vars = countVars(engagementModels.length);
  return (
    <section id="engagement" className="relative bg-uk-surface-2 section-py">
      <div className="relative mx-auto max-w-7xl px-5 lg:px-8">
        <div className="flex flex-col items-center">
          <SectionHeading
            align="center"
            eyebrow={c.eyebrow}
            title={<Marked text={fill(c.title, vars)} />}
            description={fill(c.description, vars) || undefined}
          />
        </div>

        <Reveal staggerChildren className="mt-14 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {engagementModels.map((m, i) => {
            const Icon = icons[i] ?? Handshake;
            return (
              <div
                key={m.name}
                className="group relative flex flex-col overflow-hidden rounded-2xl border border-uk-line card-premium card-spotlight bg-uk-card"
              >
                {/* top accent */}
                <div className="h-1 w-full bg-gradient-to-r from-uk-blue/40 to-uk-yellow/40 opacity-60 transition-opacity group-hover:opacity-100" aria-hidden />

                <div className="flex flex-1 flex-col gap-3 p-6">
                  {/* icon + number */}
                  <div className="flex items-center justify-between">
                    <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-uk-blue/12 text-uk-blue transition-colors group-hover:bg-uk-blue group-hover:text-uk-white">
                      <Icon className="h-5 w-5" strokeWidth={2.2} />
                    </span>
                    <span className="font-heading text-5xl font-bold text-uk-blue/8 transition-colors group-hover:text-uk-blue/20">
                      0{i + 1}
                    </span>
                  </div>

                  <h3 className="font-heading text-lg font-bold text-uk-heading">{m.name}</h3>
                  <p className="text-sm leading-relaxed text-uk-gray">{m.desc}</p>

                  {/* bullet points */}
                  {"bullets" in m && m.bullets && (
                    <ul className="flex flex-col gap-1.5">
                      {m.bullets.map((b: string) => (
                        <li key={b} className="flex items-center gap-2 text-xs font-medium text-uk-body">
                          <span className="h-1.5 w-1.5 flex-none rounded-full bg-uk-yellow" />
                          {b}
                        </li>
                      ))}
                    </ul>
                  )}

                  {/* best-for tag */}
                  <div className="mt-auto flex items-center gap-2 border-t border-uk-line pt-4">
                    <Check className="h-4 w-4 flex-none text-uk-blue" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-uk-body">
                      {m.best}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </Reveal>

        <Reveal className="mt-10 flex justify-center">
          <Link
            href="/contact"
            className="btn-sheen btn-lift group inline-flex items-center gap-2 rounded-full bg-uk-blue px-6 py-3 text-sm font-semibold text-uk-white shadow-glow-blue-sm hover:bg-uk-blue-bright"
          >
            {c.ctaLabel}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </Reveal>
      </div>
    </section>
  );
}