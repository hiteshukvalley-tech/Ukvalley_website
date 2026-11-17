"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Pauses the CSS animations of page sections that are off screen.
 *
 * The site has many decorative loops (pulsing dots, flowing dashes, drifting
 * glows, gradient text). Browsers keep running them even when they are far
 * below the fold, which kept the main thread busy most of the time on phones
 * and Safari. Each top-level section of <main> (and the footer) gets
 * `data-offscreen` while it is out of view; globals.css pauses every
 * animation inside it. A section is resumed a little before it scrolls in.
 * Any element marked `data-pause-offscreen` is watched the same way, for
 * costly loops inside a section that is itself on screen (e.g. the hero).
 */
export function OffscreenPause() {
  const pathname = usePathname();

  useEffect(() => {
    if (!("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          e.target.toggleAttribute("data-offscreen", !e.isIntersecting);
        }
      },
      { rootMargin: "300px 0px" }
    );
    const watched = new Set<Element>();
    const scan = () => {
      const sections = document.querySelectorAll("#main > *, body footer, [data-pause-offscreen]");
      sections.forEach((el) => {
        if (watched.has(el)) return;
        watched.add(el);
        io.observe(el);
      });
    };
    scan();
    // Sections streamed in or swapped by client navigation after the first scan.
    const main = document.getElementById("main");
    // At most one rescan per frame: counters and the hero dashboard change the DOM often.
    let frame = 0;
    const queueScan = () => {
      if (!frame) frame = requestAnimationFrame(() => { frame = 0; scan(); });
    };
    const mo = main ? new MutationObserver(queueScan) : null;
    mo?.observe(main!, { childList: true, subtree: true });
    return () => {
      cancelAnimationFrame(frame);
      io.disconnect();
      mo?.disconnect();
      watched.forEach((el) => el.removeAttribute("data-offscreen"));
    };
  }, [pathname]);

  return null;
}
