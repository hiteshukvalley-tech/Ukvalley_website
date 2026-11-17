"use client";

import { useEffect, useRef } from "react";
import { onceInView, prefersReducedMotion } from "@/lib/in-view";

/**
 * Outcome bar — grows left→right when scrolled into view (a CSS transition
 * on scaleX, GPU-composited). Decorative, aria-hidden; reduced-motion
 * renders fully grown.
 */
export function GrowBar({ className, delay = 0 }: { className?: string; delay?: number }) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const grow = () => (el.style.transform = "scaleX(1)");
    if (prefersReducedMotion()) {
      grow();
      return;
    }
    return onceInView(el, grow, "0px 0px -10% 0px");
  }, []);

  return (
    <span
      ref={ref}
      className={className}
      style={{
        transform: "scaleX(0.12)",
        transformOrigin: "left center",
        transition: `transform 0.9s cubic-bezier(0.215, 0.61, 0.355, 1) ${delay}ms`,
      }}
      aria-hidden
    />
  );
}
