import type { CSSProperties, ReactNode } from "react";
import type { HeaderContent } from "@/lib/site-content-schema";

/**
 * The site logo, shared by the header and footer (Admin → Header): the logo
 * picture (the official Ukvalley logo unless another was uploaded), and the
 * dark-mode version in the dark theme when one is set. The text logo (letter
 * badge, name, sub-line) is only a fallback for content without an image.
 * `text` renders a line of text, so the caller decides how it is translated.
 */
/** A size from Admin → Header ("100" = standard) as a scale factor, kept within the slider's range. */
function logoScale(size: string | undefined): number {
  const n = Number(size);
  return Number.isFinite(n) && n > 0 ? Math.min(160, Math.max(60, n)) / 100 : 1;
}

export function SiteLogo({
  content: c,
  text,
  pulse = false,
  place = "header",
}: {
  content: HeaderContent;
  text: (s: string) => ReactNode;
  /** the animated yellow dot on the letter badge (header only) */
  pulse?: boolean;
  /** which size setting applies (Admin → Header: logo size in the header / footer) */
  place?: "header" | "footer";
}) {
  if (c.logoImage) {
    const alt = `${c.logoName} ${c.logoSub}`.trim();
    // Standard size 48px tall on phones, 56px from sm — scaled by the admin's
    // size setting, with the width cap growing in step so wide logos keep their shape.
    const cls =
      "h-[calc(3rem*var(--logo-scale))] w-auto max-w-[calc(13rem*var(--logo-scale))] object-contain sm:h-[calc(3.5rem*var(--logo-scale))] sm:max-w-[calc(16rem*var(--logo-scale))]";
    const style = { "--logo-scale": logoScale(place === "footer" ? c.footerLogoSize : c.logoSize) } as CSSProperties;
    return (
      <>
        {/* plain <img>: the admin can point this at /media/<id> or any https address */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={c.logoImage} alt={alt} style={style} className={c.logoImageDark ? `${cls} dark:hidden` : cls} />
        {c.logoImageDark && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={c.logoImageDark} alt={alt} style={style} className={`${cls} hidden dark:block`} />
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
