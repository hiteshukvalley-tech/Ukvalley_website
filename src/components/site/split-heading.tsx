"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

type SplitHeadingProps = {
  children: string;
  as?: "h1" | "h2" | "p" | "span";
  className?: string;
  /** stagger per word, seconds */
  stagger?: number;
  delay?: number;
  /** indexes of words to render with the yellow marker highlight */
  highlight?: number[];
  /**
   * Play the entrance animation immediately on mount instead of waiting
   * for a ScrollTrigger. Use for above-the-fold content (hero h1).
   */
  immediate?: boolean;
};

/**
 * Word-mask headline reveal — each word rises out of an overflow-hidden
 * mask with a slight blur, staggered left→right. Words are split in the
 * DOM into spans (no GSAP plugin needed), so screen readers still get a
 * complete string via aria-label. Reduced-motion renders instantly.
 */
export function SplitHeading({
  children,
  as: Tag = "h2",
  className,
  stagger = 0.055,
  delay = 0,
  highlight,
  immediate = false,
}: SplitHeadingProps) {
  const ref = useRef<HTMLElement>(null);

  // Split into words once, statically — safe for SSR/hydration.
  const words = typeof children === "string" ? children.split(" ") : null;

  useEffect(() => {
    const el = ref.current;
    if (!el || !words) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const inners = el.querySelectorAll<HTMLElement>("[data-sh-inner]");
    if (!inners.length) return;

    if (reduced) {
      gsap.set(inners, { yPercent: 0, opacity: 1, filter: "none" });
      return;
    }

    const ctx = gsap.context(() => {
      gsap.set(inners, { yPercent: 115, opacity: 0, filter: "blur(6px)" });

      const anim = {
        yPercent: 0,
        opacity: 1,
        filter: "blur(0px)",
        duration: 0.9,
        ease: "expo.out" as const,
        stagger,
        delay,
      };

      if (immediate) {
        // Play on mount — no ScrollTrigger, works above the fold.
        gsap.to(inners, anim);
      } else {
        gsap.to(inners, {
          ...anim,
          scrollTrigger: { trigger: el, start: "top 88%", once: true },
        });
      }
    }, el);

    return () => ctx.revert();
  }, [words, stagger, delay, immediate]);

  if (!words) {
    return <Tag ref={ref as never} className={className}>{children}</Tag>;
  }

  return (
    <Tag ref={ref as never} className={className} aria-label={words.join(" ")}>
      {words.map((w, i) => (
        <span
          key={`${w}-${i}`}
          aria-hidden
          className="inline-block overflow-hidden pb-[0.08em] -mb-[0.08em] align-bottom"
        >
          <span data-sh-inner className="inline-block will-change-transform">
            {highlight?.includes(i) ? <span className="highlight-yellow">{w}</span> : w}
            {i < words.length - 1 ? " " : ""}
          </span>
        </span>
      ))}
    </Tag>
  );
}