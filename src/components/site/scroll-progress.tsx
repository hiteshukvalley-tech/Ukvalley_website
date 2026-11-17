"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUp } from "lucide-react";
import { getLenis } from "@/components/site/smooth-scroll";

export function ScrollProgress() {
  const bar = useRef<HTMLDivElement>(null);
  const [showTop, setShowTop] = useState(false);

  useEffect(() => {
    // The bar is drawn straight onto the element, once per frame at most;
    // React only re-renders when the back-to-top button shows or hides.
    let frame = 0;
    const update = () => {
      frame = 0;
      const h = document.documentElement;
      const scrolled = h.scrollTop;
      const height = h.scrollHeight - h.clientHeight;
      if (bar.current) bar.current.style.transform = `scaleX(${height > 0 ? Math.min(scrolled / height, 1) : 0})`;
      setShowTop(scrolled > 700);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <>
      {/* progress bar */}
      <div className="fixed inset-x-0 top-0 z-[60] h-0.5 bg-transparent" aria-hidden>
        <div
          ref={bar}
          className="h-full origin-left bg-gradient-to-r from-uk-blue via-uk-blue-bright to-uk-yellow transition-transform duration-150 ease-out"
          style={{ transform: "scaleX(0)" }}
        />
      </div>

      {/* back to top — out of the tab order and hidden from screen readers while invisible */}
      <button
        type="button"
        onClick={() => {
          const lenis = getLenis();
          if (lenis) lenis.scrollTo(0);
          else window.scrollTo({ top: 0, behavior: "smooth" });
        }}
        aria-label="Back to top"
        aria-hidden={!showTop || undefined}
        tabIndex={showTop ? undefined : -1}
        inert={!showTop}
        className={`btn-lift fixed bottom-6 right-6 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-uk-blue text-uk-white shadow-glow-blue hover:bg-uk-blue-bright ${
          showTop ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0"
        }`}
      >
        <ArrowUp className="h-5 w-5" />
      </button>
    </>
  );
}
