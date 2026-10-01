"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

/**
 * Subtle scroll-driven vertical parallax. Moves the element between
 * +speed and -speed px as it travels through the viewport (scrubbed).
 * Use for decorative background blobs / glow layers — never for text.
 * Reduced-motion → element stays static.
 */
export function Parallax({
  children,
  speed = 60,
  className,
  triggerRef,
}: {
  children?: ReactNode;
  speed?: number;
  className?: string;
  /** optional external trigger element; defaults to this element */
  triggerRef?: React.RefObject<HTMLElement | null>;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;

    const trigger = triggerRef?.current ?? el;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        el,
        { y: speed },
        {
          y: -speed,
          ease: "none",
          scrollTrigger: {
            trigger,
            start: "top bottom",
            end: "bottom top",
            scrub: true,
          },
        }
      );
    }, el);

    return () => ctx.revert();
  }, [speed, triggerRef]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}