import type { ReactNode } from "react";
import type { HeaderContent } from "@/lib/site-content-schema";

/**
 * The site logo, shared by the header and footer (Admin → Header): the logo
 * picture (the official Ukvalley logo unless another was uploaded), and the
 * dark-mode version in the dark theme when one is set. The text logo (letter
 * badge, name, sub-line) is only a fallback for content without an image.
 * `text` renders a line of text, so the caller decides how it is translated.
 */
export function SiteLogo({
  content: c,
  text,
  pulse = false,
}: {
  content: HeaderContent;
  text: (s: string) => ReactNode;
  /** the animated yellow dot on the letter badge (header only) */
  pulse?: boolean;
}) {
  if (c.logoImage) {
    const alt = `${c.logoName} ${c.logoSub}`.trim();
    const cls = "h-10 w-auto max-w-[10.5rem] object-contain sm:h-11 sm:max-w-[13rem]";
    return (
      <>
        {/* plain <img>: the admin can point this at /media/<id> or any https address */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={c.logoImage} alt={alt} className={c.logoImageDark ? `${cls} dark:hidden` : cls} />
        {c.logoImageDark && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={c.logoImageDark} alt={alt} className={`${cls} hidden dark:block`} />
        )}
      </>
    );
  }
  return (
    <>
      <span className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-uk-blue to-uk-blue-bright shadow-glow-blue-sm transition-transform duration-300 group-hover:scale-105">
        <span className="font-heading text-lg font-bold text-uk-white">{text(c.logoMark)}</span>
        <span className={`absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-uk-yellow ${pulse ? "shadow-glow-yellow animate-pulse" : ""}`} />
      </span>
      <span className="flex flex-col leading-none">
        <span className="font-heading text-base font-bold tracking-tight text-uk-heading transition-colors">{text(c.logoName)}</span>
        {c.logoSub && (
          <span className="text-[0.62rem] font-medium uppercase tracking-[0.28em] text-uk-muted transition-colors">{text(c.logoSub)}</span>
        )}
      </span>
    </>
  );
}
