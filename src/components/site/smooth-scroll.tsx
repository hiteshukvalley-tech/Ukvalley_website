"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
// Type only: the library itself is downloaded only where it runs (below).
import type Lenis from "lenis";

/**
 * Safari (macOS and iOS) already scrolls with smooth native momentum; JS
 * smoothing on top of it makes trackpad scrolling feel heavy and laggy.
 */
const isSafari = () =>
  /^((?!chrome|chromium|crios|fxios|edg|android).)*safari/i.test(navigator.userAgent);

// The running Lenis instance (null when native scrolling is in use), for
// components that scroll the page themselves, e.g. "Back to top".
let activeLenis: Lenis | null = null;
export const getLenis = () => activeLenis;

/** The element a "#section" hash points at; ids like "1-intro" aren't valid CSS selectors. */
function hashTarget(hash: string): HTMLElement | null {
  const raw = hash.replace(/^#/, "");
  if (!raw) return null;
  try {
    return document.getElementById(decodeURIComponent(raw));
  } catch {
    return document.getElementById(raw);
  }
}

/**
 * App-wide smooth-scroll provider.
 *
 * Lenis runs its own animation-frame loop (desktop Chrome/Edge/Firefox
 * with a mouse only). Owns scroll-reset on route change because Next 16 no
 * longer overrides scroll-behavior during navigation by default.
 *
 * Respects prefers-reduced-motion: disables Lenis entirely so users
 * who opted out get native scrolling.
 */
export function SmoothScroll({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const lenisRef = useRef<Lenis | null>(null);
  // The admin panel is a plain app UI — native scroll there. Follows client
  // navigation between the website and the admin panel.
  const inAdmin = /^\/admin(?:\/|$)/i.test(pathname ?? "");

  useEffect(() => {
    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    // Reduced-motion, Safari, touch devices and low-core machines: native
    // scrolling is smoother than JS-driven smoothing and saves a per-frame
    // rAF loop.
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    const lowEnd = (navigator.hardwareConcurrency ?? 8) <= 4;
    if (prefersReduced || coarse || lowEnd || inAdmin || isSafari()) return;

    // Loaded here, not imported at the top: phones, tablets and Safari never
    // run Lenis, so they no longer download it with every page.
    let cancelled = false;
    let cleanup = () => {
      cancelled = true;
    };
    void import("lenis").then(({ default: LenisClass }) => {
      if (cancelled) return;
      const lenis = new LenisClass({
        duration: 1.1,
        easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smoothWheel: true,
        touchMultiplier: 1.5,
        // Driven below instead: Lenis's own loop runs on every frame forever,
        // keeping the page busy even when nobody scrolls.
        autoRaf: false,
      });
      lenisRef.current = lenis;
      activeLenis = lenis;

      // The frame loop runs only while the page is being scrolled: it starts
      // on the wheel or a programmatic scrollTo, and goes to sleep half a
      // second after the scroll has settled.
      let rafId = 0;
      let idleFrames = 0;
      const tick = (time: number) => {
        lenis.raf(time);
        idleFrames = lenis.isScrolling === "smooth" ? 0 : idleFrames + 1;
        rafId = idleFrames > 30 ? 0 : requestAnimationFrame(tick);
      };
      const wake = () => {
        idleFrames = 0;
        if (rafId) return;
        // Restart Lenis's clock, so the first frame after a sleep isn't one huge step.
        lenis.time = 0;
        rafId = requestAnimationFrame(tick);
      };
      const scrollTo = lenis.scrollTo.bind(lenis);
      lenis.scrollTo = (...args: Parameters<typeof scrollTo>) => {
        wake();
        return scrollTo(...args);
      };
      window.addEventListener("wheel", wake, { passive: true });

      // Deep-link / in-page anchor support (e.g. "#work", "#contact").
      const onHashClick = (e: MouseEvent) => {
        const anchor = (e.target as HTMLElement)?.closest(
          'a[href^="#"]'
        ) as HTMLAnchorElement | null;
        if (!anchor) return;
        const el = hashTarget(anchor.getAttribute("href") ?? "");
        if (el) {
          e.preventDefault();
          lenis.scrollTo(el, { offset: -96, duration: 1.2 });
        }
      };
      document.addEventListener("click", onHashClick);

      cleanup = () => {
        document.removeEventListener("click", onHashClick);
        window.removeEventListener("wheel", wake);
        cancelAnimationFrame(rafId);
        lenis.destroy();
        lenisRef.current = null;
        if (activeLenis === lenis) activeLenis = null;
      };
    });

    return () => cleanup();
  }, [inAdmin]);

  // Route change → reset scroll position. Lenis owns this (Next 16's
  // default scroll-behavior override was removed in v16). Not on the first
  // load (the browser handles deep links like /careers#open-roles and restored
  // positions), and a link with a #section lands on that section, not the top.
  const lastPath = useRef(pathname);
  useEffect(() => {
    if (lastPath.current === pathname) return;
    lastPath.current = pathname;
    const target = hashTarget(window.location.hash);
    if (target) {
      if (lenisRef.current) lenisRef.current.scrollTo(target, { offset: -96, immediate: true });
      else target.scrollIntoView();
    } else if (lenisRef.current) {
      lenisRef.current.scrollTo(0, { immediate: true });
    } else {
      window.scrollTo(0, 0);
    }
  }, [pathname]);

  return <>{children}</>;
}