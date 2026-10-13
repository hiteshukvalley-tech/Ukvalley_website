"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { X } from "lucide-react";

export type DateMode = "single" | "range";
type Dates = { mode: DateMode; from: string; to: string };

/**
 * Moves to the same page with new dates (?mode=range&from=&to=). Other filters
 * in the address are kept; the page number is reset.
 */
function useDateNav() {
  const pathname = usePathname();
  const router = useRouter();
  const sp = useSearchParams();
  return (next: Dates) => {
    const q = new URLSearchParams(sp.toString());
    q.delete("date");
    q.delete("page");
    for (const k of ["from", "to"] as const) {
      if (next[k]) q.set(k, next[k]);
      else q.delete(k);
    }
    if (next.mode === "range") q.set("mode", "range");
    else q.delete("mode");
    const s = q.toString();
    router.push(s ? `${pathname}?${s}` : pathname);
  };
}

/** "Single date" / "Date range" switch, shown above the applications table. */
export function DateModeSwitch({ mode, from, to }: Dates) {
  const go = useDateNav();
  const btn = (m: DateMode, label: string) => (
    <button
      type="button"
      aria-pressed={mode === m}
      // Switching to a single date keeps the first day and drops the end date.
      onClick={() => mode !== m && go({ mode: m, from, to: m === "range" ? to : "" })}
      className={
        mode === m
          ? "h-8 rounded-md bg-uk-card px-3 text-sm font-semibold text-uk-blue shadow-sm"
          : "h-8 rounded-md px-3 text-sm font-medium text-uk-muted transition-colors hover:text-uk-heading"
      }
    >
      {label}
    </button>
  );
  return (
    <div role="group" aria-label="Date filter type" className="inline-flex rounded-lg border border-uk-line bg-uk-surface-2 p-1">
      {btn("single", "Single date")}
      {btn("range", "Date range")}
    </div>
  );
}

const box =
  "h-9 cursor-pointer rounded-lg border bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

/** A date box that opens the browser's calendar on any click, not only on its icon. */
function DateBox({ id, label, value, min, max, onPick }: {
  id: string; label: string; value: string; min?: string; max: string; onPick: (v: string) => void;
}) {
  return (
    <>
      <label className="sr-only" htmlFor={id}>{label}</label>
      <input
        id={id}
        type="date"
        value={value}
        min={min}
        max={max}
        title={label}
        onClick={(e) => {
          try {
            e.currentTarget.showPicker();
          } catch {
            // Older browsers: the built-in icon still opens it.
          }
        }}
        onChange={(e) => onPick(e.target.value)}
        className={`${box} ${value ? "border-uk-blue text-uk-blue" : "border-input text-uk-body"}`}
      />
    </>
  );
}

/**
 * The date boxes in the table header. Single date: one box, that day's
 * applications. Date range: two boxes; with only the first picked it is that
 * one day, with both it is every day from the first to the second.
 */
export function DateBoxes({ mode, from, to, max }: Dates & { max: string }) {
  const go = useDateNav();
  return (
    <div className="ml-auto flex flex-wrap items-center gap-1.5">
      {mode === "single" ? (
        <DateBox id="applications-date" label="Show applications sent on this date" value={from} max={max} onPick={(v) => go({ mode, from: v, to: "" })} />
      ) : (
        <>
          <DateBox
            id="applications-from"
            label="From date"
            value={from}
            max={max}
            // A start after the chosen end clears the end.
            onPick={(v) => go({ mode, from: v, to: to && v && to < v ? "" : to })}
          />
          <span className="text-sm text-uk-muted">to</span>
          <DateBox id="applications-to" label="To date" value={to} min={from || undefined} max={max} onPick={(v) => go({ mode, from: from || v, to: from ? v : "" })} />
        </>
      )}
      {(from || to) && (
        <button
          type="button"
          onClick={() => go({ mode, from: "", to: "" })}
          aria-label="Clear dates"
          title="Clear dates"
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-uk-muted transition-colors hover:bg-uk-surface-2 hover:text-uk-heading"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
