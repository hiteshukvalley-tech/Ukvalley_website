"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * "12 / 200" under a field. Follows the input with the given id, so it works
 * with any input (plain, password) without making the field controlled.
 */
export function CharCounter({ htmlFor, max, className }: { htmlFor: string; max: number; className?: string }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const el = document.getElementById(htmlFor) as HTMLInputElement | null;
    if (!el) return;
    const form = el.form;
    const sync = () => setCount(el.value.length);
    // A form reset doesn't fire "input"; read the value once it has cleared.
    const onReset = () => setTimeout(sync);
    sync();
    el.addEventListener("input", sync);
    form?.addEventListener("reset", onReset);
    return () => {
      el.removeEventListener("input", sync);
      form?.removeEventListener("reset", onReset);
    };
  }, [htmlFor]);

  const full = count >= max;
  return (
    <span
      id={`${htmlFor}-count`}
      className={cn(
        "ml-auto shrink-0 text-xs tabular-nums",
        full ? "font-medium text-amber-600 dark:text-amber-400" : "text-uk-muted",
        className
      )}
    >
      {count} / {max}
      <span className="sr-only"> characters</span>
    </span>
  );
}
