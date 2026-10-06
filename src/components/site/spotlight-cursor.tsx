"use client";

import { useEffect } from "react";

/**
 * Global cursor-follow spotlight.
 *
 * `.card-spotlight::after` renders a radial highlight that reads the
 * --mx / --my CSS vars (percentages). This component keeps those vars
 * updated for whichever card is under the cursor, so every card on the
 * site gets the Linear/Vercel-style spotlight with zero per-card
 * wiring. Only the currently-hovered card is touched, and its vars are
 * cleaned up when the cursor moves on.
 */
export function SpotlightCursor() {
  useEffect(() => {
    // A hover effect: phones and tablets have no cursor, and a pointermove
    // handler there only runs layout reads (getBoundingClientRect) during
    // finger drags and scrolls.
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    let current: HTMLElement | null = null;

    const onMove = (e: PointerEvent) => {
      const target = e.target as HTMLElement | null;
      const card = (target?.closest?.(".card-spotlight") ??
        null) as HTMLElement | null;

      if (card !== current) {
        current?.style.removeProperty("--mx");
        current?.style.removeProperty("--my");
        current = card;
      }
      if (!card) return;

      const r = card.getBoundingClientRect();
      card.style.setProperty(
        "--mx",
        `${(((e.clientX - r.left) / r.width) * 100).toFixed(2)}%`
      );
      card.style.setProperty(
        "--my",
        `${(((e.clientY - r.top) / r.height) * 100).toFixed(2)}%`
      );
    };

    document.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      document.removeEventListener("pointermove", onMove);
      current?.style.removeProperty("--mx");
      current?.style.removeProperty("--my");
    };
  }, []);

  return null;
}