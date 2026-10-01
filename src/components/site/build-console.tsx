"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";

const SCRIPT: { text: string; tone: "dim" | "blue" | "yellow" | "ok" }[] = [
  { text: "$ ukvalley deploy --env production", tone: "dim" },
  { text: "✓ Architecture review passed", tone: "blue" },
  { text: "✓ 1,847 tests green · 0 regressions", tone: "blue" },
  { text: "✓ Bundle 218kb · Lighthouse 99/100", tone: "blue" },
  { text: "→ Shipping to Mumbai + Virginia edges…", tone: "yellow" },
  { text: "✓ Live in 41s · 0 downtime", tone: "ok" },
];

const TONE_CLASS: Record<string, string> = {
  dim: "text-uk-muted",
  blue: "text-uk-blue",
  yellow: "text-[#fff500] dark:text-[#fff500]",
  ok: "text-emerald-600 dark:text-emerald-400",
};

/**
 * Live build/deploy console — a typewriter loop that signals "engineers
 * run this company." Pure text cycling; decorative, aria-hidden.
 * Reduced-motion: renders the final full script statically.
 */
const REDUCED_QUERY = "(prefers-reduced-motion: reduce)";

function subscribeReduced(onChange: () => void) {
  const mq = window.matchMedia(REDUCED_QUERY);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

export function BuildConsole({ className }: { className?: string }) {
  // hydration-safe reduced-motion signal (server snapshot = false)
  const reduced = useSyncExternalStore(
    subscribeReduced,
    () => window.matchMedia(REDUCED_QUERY).matches,
    () => false
  );
  const [lines, setLines] = useState<string[]>([]);
  const [current, setCurrent] = useState("");
  const timer = useRef<number | null>(null);

  useEffect(() => {
    if (reduced) return; // static full-script render below

    let char = 0;
    let idx = 0;

    const tick = () => {
      const target = SCRIPT[idx].text;
      if (char <= target.length) {
        setCurrent(target.slice(0, char));
        char += 1;
        timer.current = window.setTimeout(tick, 26);
      } else {
        // commit the finished line, pause, move on
        setLines((prev) => [...prev.slice(-4), target]);
        setCurrent("");
        idx = (idx + 1) % SCRIPT.length;
        char = 0;
        if (idx === 0) setLines([]); // loop clean
        timer.current = window.setTimeout(tick, idx === 0 ? 900 : 520);
      }
    };

    timer.current = window.setTimeout(tick, 600);
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, [reduced]);

  const displayLines = reduced ? SCRIPT.map((s) => s.text) : lines;

  return (
    <div
      aria-hidden
      className={`console rounded-2xl p-4 text-left ${className ?? ""}`}
    >
      <div className="mb-2.5 flex items-center justify-between border-b border-uk-line pb-2">
        <div className="flex gap-1.5" aria-hidden>
          <span className="h-2 w-2 rounded-full bg-uk-blue/30" />
          <span className="h-2 w-2 rounded-full bg-uk-blue/50" />
          <span className="h-2 w-2 rounded-full bg-uk-yellow" />
        </div>
        <span className="text-[0.6rem] font-semibold uppercase tracking-[0.22em] text-uk-muted">
          build · ukvalley
        </span>
      </div>
      <div className="flex min-h-[7.2rem] flex-col justify-end gap-0.5">
        {displayLines.map((l, i) => (
          <p key={`${l}-${i}`} className={TONE_CLASS[SCRIPT.find((s) => s.text === l)?.tone ?? "dim"]}>
            {l}
          </p>
        ))}
        <p className={TONE_CLASS[SCRIPT.find((s) => s.text.startsWith(current))?.tone ?? "dim"]}>
          {current}
          <span className="console-cursor ml-0.5" />
        </p>
      </div>
    </div>
  );
}