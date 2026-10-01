"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

/**
 * Parses a stat string like "1,500+", "7+", "24h", "50+" into a
 * numeric target + trailing suffix, then counts up from 0 on scroll-in.
 * Renders the final value immediately under prefers-reduced-motion.
 */
function parseStat(value: string): { target: number; suffix: string } | null {
  const match = value.match(/^([\d,]+)(.*)$/);
  if (!match) return null;
  const target = parseInt(match[1].replace(/,/g, ""), 10);
  if (Number.isNaN(target)) return null;
  return { target, suffix: match[2] ?? "" };
}

const formatter = new Intl.NumberFormat("en-US");

export function StatCounter({
  value,
  className,
  duration = 1.8,
}: {
  value: string;
  className?: string;
  duration?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const parsed = parseStat(value);
    if (!parsed) {
      el.textContent = value;
      return;
    }

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      el.textContent = formatter.format(parsed.target) + parsed.suffix;
      return;
    }

    const obj = { v: 0 };
    const ctx = gsap.context(() => {
      gsap.to(obj, {
        v: parsed.target,
        duration,
        ease: "power2.out",
        scrollTrigger: { trigger: el, start: "top 90%", once: true },
        onUpdate: () => {
          el.textContent =
            formatter.format(Math.round(obj.v)) + parsed.suffix;
        },
      });
    }, el);

    return () => ctx.revert();
  }, [value, duration]);

  return <span ref={ref} className={className}>0{parseStat(value)?.suffix ?? ""}</span>;
}