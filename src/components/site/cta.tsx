import { ArrowRight } from "lucide-react";
import { Reveal } from "./reveal";
import { ScopingButton } from "./scoping-modal";
import { RelatedChips } from "./related-chips";
import { defaultHome, type HomeContent } from "@/lib/home-defaults";
import { ukText } from "@/lib/texts";

/**
 * The closing panel: a deep-indigo rounded box with a centred capitals
 * heading, a short line of text, an outlined button and a small note under
 * it. Used by CtaBand (every page) and by pages with their own closing ask
 * (/press-kit, /media), which pass their own button(s) as children.
 */
export function ClosingPanel({
  badge, title, description, note, children,
}: {
  badge?: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  note?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Reveal>
      <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#120c3a] px-6 py-14 text-center shadow-premium sm:px-14 sm:py-20 dark:bg-[#0d0830]">
        {/* soft brand light in the corners and a faint blueprint grid */}
        <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-uk-blue/40 blur-[110px]" aria-hidden />
        <div className="absolute -bottom-28 -right-20 h-80 w-80 rounded-full bg-[#287BFF]/25 blur-[120px]" aria-hidden />
        <div className="absolute inset-0 bg-blueprint opacity-[0.12]" aria-hidden />

        <div className="relative mx-auto flex max-w-3xl flex-col items-center gap-5">
          {badge && (
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-white">
              <span className="h-1.5 w-1.5 rounded-full bg-uk-yellow" aria-hidden />
              {badge}
            </span>
          )}
          <h2 className="font-heading text-balance text-3xl font-bold uppercase leading-[1.08] tracking-tight text-white sm:text-5xl">
            {title}
          </h2>
          {description && <p className="max-w-2xl text-base leading-relaxed text-white/80 sm:text-lg">{description}</p>}
          <div className="mt-2 flex w-full flex-col items-center justify-center gap-3 sm:w-auto sm:flex-row">{children}</div>
          {note && <p className="text-sm text-white/70">{note}</p>}
        </div>
      </div>
    </Reveal>
  );
}

/** Outlined light button for use inside ClosingPanel. */
export const closingButtonCls =
  "group inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg border border-white/70 px-7 text-sm font-semibold text-white transition-colors hover:bg-white hover:text-[#120c3a] sm:w-auto";

/**
 * Closing call-to-action band. The home page passes its admin-edited text
 * (Admin → Home page → Closing call-to-action); other pages use the defaults
 * and name their site section in `related` for the "Related" links above it.
 */
export function CtaBand({ content: c = defaultHome.cta, related }: { content?: HomeContent["cta"]; related?: string }) {
  return (
    <section id="contact" className="relative bg-uk-surface px-5 section-py lg:px-8">
      <div className="relative mx-auto flex max-w-6xl flex-col gap-14">
        <RelatedChips page={related} />
        <ClosingPanel
          badge={c.badge ? ukText(c.badge) : undefined}
          title={ukText(c.title)}
          description={c.description ? ukText(c.description) : undefined}
          // phone number & email live on the Contact page only
          note={c.note ? ukText(c.note) : undefined}
        >
          <ScopingButton className={closingButtonCls}>
            {ukText(c.buttonLabel)}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </ScopingButton>
        </ClosingPanel>
      </div>
    </section>
  );
}
