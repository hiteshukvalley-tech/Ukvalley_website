"use client";

import { useRef, useState } from "react";
import { CopyButton } from "./copy-button";
import { T } from "./texts-context";
import { cn } from "@/lib/utils";

export type Boilerplate = { key: string; label: string; size: string; use: string; text: string };

/**
 * Press-kit company descriptions as tabs (25 / 50 / 100 words): a tab bar with
 * a sliding underline, then the chosen text with a "Use for" card beside it.
 */
export function BoilerplateTabs({ items }: { items: Boilerplate[] }) {
  const [active, setActive] = useState(0);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const current = items[active];
  const select = (i: number) => {
    setActive(i);
    tabs.current[i]?.focus();
  };

  return (
    <div>
      <div role="tablist" aria-label="Description length" className="grid border-b border-uk-line" style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}>
        {items.map((b, i) => (
          <button
            key={b.key}
            ref={(el) => { tabs.current[i] = el; }}
            role="tab"
            type="button"
            id={`bp-tab-${b.key}`}
            aria-selected={i === active}
            aria-controls={`bp-panel-${b.key}`}
            tabIndex={i === active ? 0 : -1}
            onClick={() => setActive(i)}
            onKeyDown={(e) => {
              if (e.key === "ArrowRight") select((i + 1) % items.length);
              else if (e.key === "ArrowLeft") select((i - 1 + items.length) % items.length);
            }}
            className={cn(
              "relative pb-3 text-left transition-colors",
              i === active ? "text-uk-heading" : "text-uk-muted hover:text-uk-heading"
            )}
          >
            <span className="block text-sm font-semibold"><T>{b.label}</T></span>
            <span className="block text-xs"><T>{b.size}</T></span>
            <span
              aria-hidden
              className={cn("absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-uk-blue transition-opacity", i === active ? "opacity-100" : "opacity-0")}
            />
          </button>
        ))}
      </div>

      <div
        role="tabpanel"
        id={`bp-panel-${current.key}`}
        aria-labelledby={`bp-tab-${current.key}`}
        className="mt-10 grid gap-8 lg:grid-cols-[1.6fr_1fr] lg:items-start"
      >
        <div className="flex flex-col gap-5">
          <h3 className="font-heading text-2xl font-bold uppercase tracking-tight text-uk-heading sm:text-3xl">
            <T>{`${current.label.replace(/\s*words?$/i, "")}-word overview`}</T>
          </h3>
          <p className="text-base leading-relaxed text-uk-body sm:text-lg">{current.text}</p>
          <div><CopyButton text={current.text} /></div>
        </div>
        <div className="rounded-2xl border border-uk-line border-t-2 border-t-uk-blue bg-uk-card p-5 shadow-float">
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-uk-muted"><T>Use for</T></p>
          <p className="mt-2 text-sm font-medium text-uk-heading"><T>{current.use}</T></p>
        </div>
      </div>
    </div>
  );
}
