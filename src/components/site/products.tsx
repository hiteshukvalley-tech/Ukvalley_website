import Link from "@/components/site/intent-link";
import { ArrowUpRight, Check, MonitorSmartphone, Users } from "lucide-react";
import { SectionHeading } from "./section-heading";
import { Reveal } from "./reveal";
import { FlagshipProductCard } from "./flagship-product-card";
import { Marked } from "./marked";
import { FLAGSHIP_SIDE_CARDS, FLAGSHIP_SPAN, getProducts, splitFlagship } from "@/lib/products-store";
import type { HomeContent } from "@/lib/home-defaults";
import { ukText } from "@/lib/texts";

/** Cards come from Admin → Products; heading from Admin → Home page → Products. */
export async function Products({ content: c }: { content: HomeContent["products"] }) {
  const { flagship, rest: all } = splitFlagship(await getProducts());
  // The home page shows a preview — the cards beside the flagship plus one
  // full row of four below it; the full list is on /products.
  const rest = all.slice(0, flagship ? FLAGSHIP_SIDE_CARDS + 4 : 8);
  return (
    <section id="products" className="relative overflow-hidden bg-uk-surface-3 section-py">
      <div className="absolute -left-20 top-10 h-72 w-72 rounded-full bg-uk-blue/12 blur-[120px]" aria-hidden />
      <div className="relative mx-auto max-w-7xl pl-[max(1.25rem,env(safe-area-inset-left))] pr-[max(1.25rem,env(safe-area-inset-right))] lg:px-8">
        <div className="flex flex-col items-center">
          <SectionHeading
            align="center"
            eyebrow={ukText(c.eyebrow)}
            title={<Marked text={ukText(c.title)} />}
            description={ukText(c.description || undefined)}
          />
        </div>

        {/* Bento grid with the same card sizes as the Services section: four
            columns, the flagship spanning two columns (and FLAGSHIP_ROWS rows,
            since its content is taller than the services feature card), the
            products in single cells beside and below it. */}
        <Reveal staggerChildren className="mt-14 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {flagship && (
            <div className={FLAGSHIP_SPAN}>
              <FlagshipProductCard featured={flagship} />
            </div>
          )}
            {rest.map((p) => (
              <article
                key={p.name}
                className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-uk-line card-premium card-spotlight bg-uk-card"
              >
                {/* colored top accent */}
                <div className="h-1 w-full bg-gradient-to-r from-uk-blue/40 to-uk-yellow/40 opacity-60 transition-opacity group-hover:opacity-100" aria-hidden />

                <div className="flex flex-1 flex-col gap-2.5 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex flex-col gap-1">
                      <h4 className="font-heading text-xl font-bold text-uk-heading">{ukText(p.name)}</h4>
                      <p className="text-sm text-uk-blue">{ukText(p.tagline)}</p>
                    </div>
                    <Link
                      href={ukText(`/products/${p.slug}`)}
                      className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-uk-surface-blue text-uk-blue transition-all group-hover:bg-uk-blue group-hover:text-uk-white"
                      aria-label={`Explore ${p.name}`}
                    >
                      <ArrowUpRight className="h-4 w-4" />
                    </Link>
                  </div>
                  <p className="text-sm leading-relaxed text-uk-gray">{ukText(p.description)}</p>

                  {/* highlights with checks */}
                  <ul className="flex flex-wrap gap-2">
                    {p.highlights.map((h) => (
                      <li key={h} className="inline-flex items-center gap-1.5 rounded-full border border-uk-line bg-uk-surface-blue px-2.5 py-1 text-xs font-medium text-uk-body">
                        <Check className="h-3 w-3 text-uk-blue" />
                        {ukText(h)}
                      </li>
                    ))}
                  </ul>

                  {/* platform + audience footer */}
                  <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-uk-line pt-3">
                    <span className="inline-flex items-center gap-1.5 text-xs text-uk-muted">
                      <MonitorSmartphone className="h-3.5 w-3.5" />
                      {ukText(p.platform)}
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-xs text-uk-muted">
                      <Users className="h-3.5 w-3.5" />
                      {ukText(p.audience)}
                    </span>
                  </div>
                </div>
              </article>
            ))}
        </Reveal>

        <Reveal className="mt-10 flex justify-center">
          <Link
            href={ukText("/products")}
            className="group inline-flex items-center gap-2 rounded-full border border-uk-line bg-white dark:bg-uk-card px-5 py-2.5 text-sm font-semibold text-uk-heading transition-colors hover:border-uk-blue/50 hover:text-uk-blue-bright"
          >
            {ukText(c.linkLabel)}
            <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
        </Reveal>
      </div>
    </section>
  );
}