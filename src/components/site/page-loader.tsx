"use client";

import { useEffect, useState } from "react";

/**
 * First-paint branded loader. Shown only on the initial hard load,
 * fades out once the window finishes loading (or after a short safety
 * timeout). Route changes use the `template.tsx` entrance animation
 * instead, so this never flashes on navigation.
 */
export function PageLoader({
  logo,
  logoDark,
  alt,
}: {
  /** The site logo (Admin → Header; the official logo unless another was uploaded). */
  logo: string;
  /** Optional dark-mode version of the logo. */
  logoDark?: string;
  alt: string;
}) {
  const [done, setDone] = useState(false);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const finish = () => {
      setDone(true);
      // Remove from DOM after the fade completes.
      window.setTimeout(() => setHidden(true), 300);
    };

    // Hydration has finished by the time this effect runs, so there is
    // nothing left to wait for — don't hold the page behind the loader
    // until every image/font fires window "load".
    void reduced;
    finish();
  }, []);

  if (hidden) return null;

  return (
    <div
      aria-hidden
      // `page-loader-failsafe` (globals.css) hides the overlay with pure CSS
      // after a few seconds, so the site stays usable even if JavaScript
      // fails to load (slow mobile networks, blocked chunks).
      className={`page-loader-failsafe fixed inset-0 z-[100] flex flex-col items-center justify-center bg-uk-surface transition-opacity duration-300 ease-out ${
        done ? "pointer-events-none opacity-0" : "opacity-100"
      }`}
    >
      <div className="absolute inset-0 loader-grid opacity-60" aria-hidden />
      <div className="absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-uk-blue/15 blur-[120px]" aria-hidden />

      <div className="relative flex flex-col items-center gap-6">
        {/* plain <img>: the logo can be /media/<id> or any https address; it must paint with the first HTML */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={logo}
          alt={alt}
          fetchPriority="high"
          className={`h-14 w-auto max-w-[15rem] object-contain sm:h-16 sm:max-w-[18rem] ${logoDark ? "dark:hidden" : ""}`}
        />
        {logoDark && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logoDark} alt={alt} className="hidden h-14 w-auto max-w-[15rem] object-contain sm:h-16 sm:max-w-[18rem] dark:block" />
        )}
        <div className="h-0.5 w-40 overflow-hidden rounded-full bg-uk-line">
          <div className="loader-shimmer h-full w-full" />
        </div>
      </div>
    </div>
  );
}