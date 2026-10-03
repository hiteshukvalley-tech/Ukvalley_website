import { ArrowRight, ArrowUpRight } from "lucide-react";
import { SectionHeading } from "./section-heading";
import { Reveal } from "./reveal";
import { Marked } from "./marked";
import { SmartLink } from "./smart-link";
import { cn } from "@/lib/utils";
import type { CustomSectionContent } from "@/lib/site-content-schema";
import { ukText } from "@/lib/texts";

/**
 * A section added in Admin → Home page → Add a new section. Heading, text,
 * optional image, optional cards and an optional button, all from the admin.
 * Plain <img> on purpose: images are /media/<id> files or any https address.
 */
export function CustomSection({ id, content: c }: { id: string; content: CustomSectionContent }) {
  const hasImage = Boolean(c.image);
  return (
    <section id={id} className="relative bg-uk-surface section-py">
      <div className="relative mx-auto max-w-7xl pl-[max(1.25rem,env(safe-area-inset-left))] pr-[max(1.25rem,env(safe-area-inset-right))] lg:px-8">
        <div className={cn("grid items-center gap-10", hasImage && "lg:grid-cols-2 lg:gap-14")}>
          <div className={cn("flex flex-col", !hasImage && "items-center text-center")}>
            {(c.title || c.eyebrow || c.description) && (
              <SectionHeading
                align={hasImage ? "left" : "center"}
                eyebrow={c.eyebrow || undefined}
                title={<Marked text={c.title} />}
                description={c.description ? <span className="whitespace-pre-line">{ukText(c.description)}</span> : undefined}
              />
            )}
            {c.buttonLabel && c.buttonHref && (
              <Reveal className="mt-8">
                <SmartLink
                  href={c.buttonHref}
                  className="btn-sheen btn-lift group inline-flex h-12 items-center gap-2 rounded-full bg-uk-blue px-7 text-sm font-semibold text-uk-white shadow-glow-blue-sm transition-colors hover:bg-uk-blue-bright"
                >
                  {ukText(c.buttonLabel)}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </SmartLink>
              </Reveal>
            )}
          </div>
          {hasImage && (
            <Reveal>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={c.image}
                alt={ukText(c.imageAlt)}
                loading="lazy"
                className="h-auto w-full rounded-3xl border border-uk-line object-cover shadow-premium"
              />
            </Reveal>
          )}
        </div>

        {c.cards.length > 0 && (
          <Reveal
            staggerChildren
            className={cn(
              "mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2",
              c.cards.length >= 3 && "lg:grid-cols-3"
            )}
          >
            {c.cards.map((card, i) => (
              <article
                key={i}
                className="group relative flex flex-col overflow-hidden rounded-3xl border border-uk-line card-premium card-spotlight bg-uk-card"
              >
                {card.image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={card.image} alt="" loading="lazy" className="aspect-[16/10] w-full object-cover" />
                )}
                <div className="flex flex-1 flex-col gap-3 p-7">
                  <h3 className="font-heading text-xl font-bold leading-snug text-uk-heading">{ukText(card.title)}</h3>
                  {card.text && <p className="whitespace-pre-line text-sm leading-relaxed text-uk-gray">{ukText(card.text)}</p>}
                  {card.linkLabel && card.href && (
                    <SmartLink
                      href={card.href}
                      className="mt-auto inline-flex items-center gap-2 pt-2 text-sm font-semibold text-uk-blue transition-colors hover:text-uk-blue-bright"
                    >
                      {ukText(card.linkLabel)}
                      <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </SmartLink>
                  )}
                </div>
              </article>
            ))}
          </Reveal>
        )}
      </div>
    </section>
  );
}
