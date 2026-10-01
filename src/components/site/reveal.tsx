"use client";

import { createElement, useEffect, useRef, type ElementType, type ReactNode } from "react";
// createElement is used to render a dynamic tag while passing a ref through
// cleanly; the ref is only consumed inside an effect, never during render.
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

type RevealProps = {
  children: ReactNode;
  as?: ElementType;
  className?: string;
  delay?: number;
  y?: number;
  stagger?: number;
  /** animate direct children individually instead of the wrapper */
  staggerChildren?: boolean;
  once?: boolean;
  /** entrance style; default "up" keeps legacy behavior */
  variant?: "up" | "fade" | "clip" | "blur";
};

/**
 * Premium scroll-reveal wrapper built on GSAP ScrollTrigger.
 * Respects prefers-reduced-motion (renders final state immediately).
 */
export function Reveal({
  children,
  as: Tag = "div",
  className,
  delay = 0,
  y = 28,
  stagger = 0.08,
  staggerChildren = false,
  once = true,
  variant = "up",
}: RevealProps) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (prefersReduced) {
      gsap.set(el, { opacity: 1, y: 0, filter: "none", clipPath: "none" });
      return;
    }

    // Content already on screen when the page appears stays as rendered.
    // Hiding it after hydration and fading it back in made every page change
    // look like it was still loading; only content further down animates in
    // as it is scrolled to.
    if (once && el.getBoundingClientRect().top < window.innerHeight * 0.9) return;

    const ctx = gsap.context(() => {
      const targets = staggerChildren
        ? Array.from(el.children) as HTMLElement[]
        : [el];

      const fromVars: gsap.TweenVars = { opacity: 0 };
      if (variant === "up") fromVars.y = y;
      // "blur" variant renders as a plain fade: animating a CSS blur filter
      // repaints the whole element every frame.
      if (variant === "clip") fromVars.clipPath = "inset(0 0 100% 0)";

      gsap.set(targets, fromVars);

      gsap.to(targets, {
        opacity: 1,
        y: 0,
        clipPath: "inset(0% 0% 0% 0)",
        duration: 0.6,
        ease: "power3.out",
        delay,
        stagger: staggerChildren ? stagger : 0,
        /* GSAP leaves its final transform as an inline style, which
           outranks every CSS hover rule and kills card hover-lifts
           forever. Clear the inline props once the entrance is done so
           hover effects (card-hover, universal lift) can take over. */
        onComplete:
          once
            ? () =>
                gsap.set(targets, {
                  clearProps: "transform,filter,clipPath",
                })
            : undefined,
        scrollTrigger: {
          trigger: el,
          start: "top 85%",
          toggleActions: once
            ? "play none none none"
            : "play reverse none reverse",
        },
      });
    }, el);

    return () => ctx.revert();
  }, [delay, y, stagger, staggerChildren, once, variant]);

  // eslint-disable-next-line react-hooks/refs -- ref is forwarded to a host element and only read inside the effect above
  return createElement(Tag, { ref, className }, children);
}