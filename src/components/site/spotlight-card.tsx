"use client";

import { useCallback, useRef } from "react";

/**
 * Cursor-follow spotlight for premium cards. Attach the returned ref
 * and onMouseMove to any element that also carries the
 * `.card-premium .card-spotlight` classes. The radial highlight in
 * `.card-spotlight::after` reads the `--mx` / `--my` CSS vars this sets.
 *
 * Falls back gracefully: without JS the spotlight simply sits centered
 * and only shows on hover (opacity transition in CSS).
 */
export function useSpotlight<T extends HTMLElement>() {
  const ref = useRef<T>(null);

  const onMouseMove = useCallback((e: React.MouseEvent<T>) => {
    const el = e.currentTarget;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${((e.clientX - r.left) / r.width) * 100}%`);
    el.style.setProperty("--my", `${((e.clientY - r.top) / r.height) * 100}%`);
  }, []);

  return { ref, onMouseMove };
}