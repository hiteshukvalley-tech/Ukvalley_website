"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

/**
 * Outcome bar — grows left→right when scrolled into view (GSAP-scrubbed
 * scaleX, GPU-composited). Decorative, aria-hidden; reduced-motion
 * renders fully grown.
 */
export function GrowBar({ className, delay = 0 }: { className?: string; delay?: number }) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduced) {
      el.style.transform = "scaleX(1)";
      return;
    }

    const ctx = gsap.context(() => {
      gsap.fromTo(
        el,
        { scaleX: 0.12 },
        {
          scaleX: 1,
          duration: 0.9,
          delay: delay / 1000,
          ease: "power3.out",
          scrollTrigger: { trigger: el, start: "top 90%", once: true },
        }
      );
    }, el);

    return () => ctx.revert();
  }, [delay]);

  return (
    <span
      ref={ref}
      className={className}
      style={{ transform: "scaleX(0.12)", transformOrigin: "left center" }}
      aria-hidden
    />
  );
}