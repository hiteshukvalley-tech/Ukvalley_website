"use client";

import { createElement, useEffect, useRef, type CSSProperties, type ElementType, type ReactNode } from "react";
// createElement is used to render a dynamic tag while passing a ref through
// cleanly; the ref is only consumed inside an effect, never during render.
import { prefersReducedMotion, watchInView } from "@/lib/in-view";

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
  /** accessible name, e.g. for a Reveal rendered as a <section> */
  "aria-label"?: string;
  id?: string;
};

const DURATION_MS = 600;

/**
 * Scroll-reveal wrapper: CSS transitions started by a shared
 * IntersectionObserver (lib/in-view.ts), so no layout is read while the page
 * loads. Server-rendered content is visible as-is (no JavaScript needed);
 * only content still below the fold is hidden once the page is running, and
 * fades in as it is scrolled to. Respects prefers-reduced-motion.
 * The styles are the `[data-reveal]` rules in globals.css.
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
  "aria-label": ariaLabel,
  id,
}: RevealProps) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;

    const targets = () => (staggerChildren ? (Array.from(el.children) as HTMLElement[]) : [el]);
    let cleanup = 0;

    const hide = () => {
      window.clearTimeout(cleanup);
      el.setAttribute("data-reveal", "hidden");
    };
    const show = () => {
      const list = targets();
      list.forEach((t, i) => {
        t.style.transitionDelay = `${delay + (staggerChildren ? i * stagger : 0)}s`;
      });
      el.setAttribute("data-reveal", "shown");
      if (!once) return;
      // Once it has played, drop the reveal styles so the element's own
      // transitions and hover lifts work as before.
      const total = (delay + (staggerChildren ? list.length * stagger : 0)) * 1000 + DURATION_MS + 80;
      cleanup = window.setTimeout(() => {
        el.removeAttribute("data-reveal");
        list.forEach((t) => (t.style.transitionDelay = ""));
      }, total);
    };

    let stop = () => {};
    stop = watchInView(el, ({ visible, first, above }) => {
      if (first) {
        // Already on screen (or scrolled past) when the page appeared: leave it as rendered.
        if (visible || above) {
          if (once) stop();
          return;
        }
        hide();
        return;
      }
      if (visible) {
        show();
        if (once) stop();
      } else if (!once && !above) {
        hide();
      }
    });

    return () => {
      stop();
      window.clearTimeout(cleanup);
      el.removeAttribute("data-reveal");
      for (const t of targets()) t.style.transitionDelay = "";
    };
  }, [delay, stagger, staggerChildren, once]);

  // 28px is the stylesheet's default distance
  const style = y === 28 ? undefined : ({ "--reveal-y": `${y}px` } as CSSProperties);
  return createElement(
    Tag,
    // eslint-disable-next-line react-hooks/refs -- ref is forwarded to a host element and only read inside the effect above
    {
      ref,
      className,
      style,
      "data-reveal-variant": variant === "blur" ? "fade" : variant,
      ...(ariaLabel ? { "aria-label": ariaLabel } : {}),
      ...(id ? { id } : {}),
      ...(staggerChildren ? { "data-reveal-children": "" } : {}),
    },
    children
  );
}
