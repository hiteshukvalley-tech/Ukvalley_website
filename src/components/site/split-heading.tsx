"use client";

import { Fragment, useEffect, useRef, type CSSProperties } from "react";
import { prefersReducedMotion, watchInView } from "@/lib/in-view";

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
   * Play the entrance as soon as the page paints instead of on scroll. Use
   * for above-the-fold content (hero h1): it is a pure CSS animation, so the
   * headline never waits for JavaScript.
   */
  immediate?: boolean;
};

/**
 * Word-mask headline reveal: each word rises out of an overflow-hidden mask,
 * staggered left→right. Words are split in the DOM into spans, so screen
 * readers still get a complete string via aria-label. Reduced-motion renders
 * instantly. Styles: `[data-sh-*]` and `.sh-rise` in globals.css.
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
    if (!el || !words || immediate || prefersReducedMotion()) return;
    // On screen when the page appears: leave it as rendered. Below the fold:
    // hide the words, then let them rise when scrolled to.
    let stop = () => {};
    stop = watchInView(
      el,
      ({ visible, first, above }) => {
        if (first && (visible || above)) return stop();
        if (first) return el.setAttribute("data-sh-root", "hidden");
        if (visible) {
          el.setAttribute("data-sh-root", "");
          stop();
        }
      },
      "0px 0px -12% 0px"
    );
    return () => {
      stop();
      el.setAttribute("data-sh-root", "");
    };
  }, [words, immediate]);

  if (!words) {
    return <Tag ref={ref as never} className={className}>{children}</Tag>;
  }

  return (
    <Tag ref={ref as never} className={className} aria-label={words.join(" ")} data-sh-root="">
      {words.map((w, i) => (
        // The space goes between the word boxes, not inside them: a space at
        // the end of an inline-block is dropped, which ran the words together.
        <Fragment key={`${w}-${i}`}>
          <span
            aria-hidden
            className="inline-block overflow-hidden pb-[0.08em] -mb-[0.08em] align-bottom"
          >
            <span
              data-sh-inner
              className={immediate ? "sh-rise inline-block" : "inline-block"}
              style={{ [immediate ? "animationDelay" : "transitionDelay"]: `${delay + i * stagger}s` } as CSSProperties}
            >
              {highlight?.includes(i) ? <span className="highlight-yellow">{w}</span> : w}
            </span>
          </span>
          {i < words.length - 1 ? " " : null}
        </Fragment>
      ))}
    </Tag>
  );
}
