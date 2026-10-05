"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
  // Mobile browsers fire `resize` every time the address bar slides in or
  // out while scrolling. Recomputing every trigger then makes the page
  // jump and stutter on Android/iOS — ignore those height-only resizes.
  // (ScrollTrigger still refreshes itself on real width/orientation changes.)
  ScrollTrigger.config({ ignoreMobileResize: true });
}

/**
 * App-wide smooth-scroll provider.
 *
 * Drives Lenis through the GSAP ticker so smooth scrolling and
 * ScrollTrigger stay perfectly in sync (single rAF source). Owns
 * scroll-reset on route change because Next 16 no longer overrides
 * scroll-behavior during navigation by default.
 *
 * Respects prefers-reduced-motion: disables Lenis entirely so users
 * who opted out get native scrolling with ScrollTrigger still working.
 */
export function SmoothScroll({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    // Reduced-motion: skip Lenis, keep native scroll. ScrollTrigger still
    // works on native scroll; refresh ensures correct trigger positions.
    // Touch devices and low-core machines: native scrolling is smoother than
    // JS-driven smoothing and saves a per-frame rAF loop.
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    const lowEnd = (navigator.hardwareConcurrency ?? 8) <= 4;
    // The admin panel is a plain app UI — native scroll there.
    const inAdmin = window.location.pathname.startsWith("/admin");
    if (prefersReduced || coarse || lowEnd || inAdmin) {
      ScrollTrigger.refresh();
      return;
    }

    const lenis = new Lenis({
      duration: 1.1,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      touchMultiplier: 1.5,
    });
    lenisRef.current = lenis;

    // Bridge Lenis → ScrollTrigger.
    lenis.on("scroll", ScrollTrigger.update);

    // GSAP ticker is the single animation frame source for both.
    const tickerFn = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tickerFn);
    gsap.ticker.lagSmoothing(0);

    // Recompute trigger positions once the layout has settled.
    // (Window resizes are handled by ScrollTrigger's own debounced
    // auto-refresh, which honours ignoreMobileResize above.)
    const refreshTimer = window.setTimeout(() => ScrollTrigger.refresh(), 120);

    // Deep-link / in-page anchor support (e.g. "#work", "#contact").
    const onHashClick = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement)?.closest(
        'a[href^="#"]'
      ) as HTMLAnchorElement | null;
      if (!anchor) return;
      const id = anchor.getAttribute("href");
      if (!id || id === "#" || id.length < 2) return;
      const el = document.querySelector(id);
      if (el) {
        e.preventDefault();
        lenis.scrollTo(el as HTMLElement, { offset: -96, duration: 1.2 });
      }
    };
    document.addEventListener("click", onHashClick);

    return () => {
      window.clearTimeout(refreshTimer);
      document.removeEventListener("click", onHashClick);
      gsap.ticker.remove(tickerFn);
      lenis.destroy();
      lenisRef.current = null;
      ScrollTrigger.refresh();
    };
  }, []);

  // Route change → reset scroll position. Lenis owns this (Next 16's
  // default scroll-behavior override was removed in v16). Not on the first
  // load (the browser handles deep links like /careers#open-roles and restored
  // positions), and a link with a #section lands on that section, not the top.
  const lastPath = useRef(pathname);
  useEffect(() => {
    if (lastPath.current === pathname) return;
    lastPath.current = pathname;
    const hash = window.location.hash.slice(1);
    const target = hash ? document.getElementById(decodeURIComponent(hash)) : null;
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