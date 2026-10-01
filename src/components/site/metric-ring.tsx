"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

type MetricRingProps = {
  /** numeric portion, e.g. 60 for "60%" */
  value: number;
  /** suffix like "%" */
  suffix?: string;
  label: string;
  size?: number;
};

/**
 * SVG progress ring that sweeps + counts up when scrolled into view.
 * Yellow sweep on a blue track — strategic accent, one per viewport area.
 */
export function MetricRing({ value, suffix = "%", label, size = 120 }: MetricRingProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const ring = el.querySelector<SVGCircleElement>("[data-ring-progress]");
    const circumference = 2 * Math.PI * 52;

    const setProgress = (v: number) => {
      setDisplay(Math.round(v));
      if (ring) ring.style.strokeDashoffset = String(circumference * (1 - v / 100));
    };

    if (reduced) {
      setProgress(value);
      return;
    }

    const state = { v: 0 };
    const ctx = gsap.context(() => {
      setProgress(0);
      gsap.to(state, {
        v: value,
        duration: 1.6,
        ease: "power3.out",
        onUpdate: () => setProgress(state.v),
        scrollTrigger: { trigger: el, start: "top 85%", once: true },
      });
    }, el);

    return () => ctx.revert();
  }, [value]);

  return (
    <div ref={ref} className="flex flex-col items-center gap-1.5">
      <div className="relative" style={{ width: size, height: size }}>
        <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
          <circle cx="60" cy="60" r="52" fill="none" stroke="var(--uk-line)" strokeWidth="10" />
          <circle
            data-ring-progress
            cx="60"
            cy="60"
            r="52"
            fill="none"
            stroke="var(--uk-blue)"
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={2 * Math.PI * 52}
            strokeDashoffset={2 * Math.PI * 52}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-heading text-2xl font-bold text-uk-blue">
            {display}
            {suffix}
          </span>
        </div>
      </div>
      <span className="text-xs font-medium text-uk-muted">{label}</span>
    </div>
  );
}