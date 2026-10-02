"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CircleAlert, CircleCheck, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

/*
 * Admin pop-up notifications ("toasts"). Call `toast.success(…)` /
 * `toast.error(…)` from any client component; <Toaster /> in the admin shell
 * shows them in the corner. The store lives at module level, so a toast
 * survives the navigation that follows a save.
 */

type Kind = "success" | "error" | "info";
type Toast = { id: number; kind: Kind; message: string };

let toasts: Toast[] = [];
let nextId = 1;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
// The same message twice within this window is shown once (React dev mode
// runs effects twice; a double click fires an action twice).
const DEDUPE_MS = 1000;
const recent = new Map<string, number>();

function push(kind: Kind, message: string) {
  const key = `${kind}:${message}`;
  const now = Date.now();
  if (now - (recent.get(key) ?? 0) < DEDUPE_MS) return;
  recent.set(key, now);
  toasts = [...toasts, { id: nextId++, kind, message }].slice(-4);
  emit();
}

function dismiss(id: number) {
  toasts = toasts.filter((t) => t.id !== id);
  emit();
}

export const toast = {
  success: (message: string) => push("success", message),
  error: (message: string) => push("error", message),
  info: (message: string) => push("info", message),
  /** Success or error from an action's `{ ok, message }` result. */
  result: (r: { ok: boolean; message?: string } | undefined | void, success: string, failure = "Something went wrong. Please try again.") => {
    if (!r) return;
    if (r.ok) push("success", r.message || success);
    else push("error", r.message || failure);
  },
};

/** Shows a toast for each new result of a `useActionState` form. */
export function useResultToast(state: { status?: string; message?: string; nonce?: number }) {
  const shown = useRef<number | undefined>(undefined);
  useEffect(() => {
    if (!state.nonce || !state.message || shown.current === state.nonce) return;
    shown.current = state.nonce;
    if (state.status === "error") toast.error(state.message);
    else toast.success(state.message);
  }, [state.nonce, state.message, state.status]);
}

/**
 * For actions that redirect after succeeding (create, delete): the target page
 * renders this with the message; it shows the toast once and drops the
 * `?saved=` flag from the URL so a reload doesn't repeat it.
 */
export function FlashToast({ message, param = "saved" }: { message: string; param?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  useEffect(() => {
    toast.success(message);
    const rest = new URLSearchParams(params.toString());
    rest.delete(param);
    const qs = rest.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    // Run once per arrival on the page.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}

const styles: Record<Kind, { icon: typeof CircleCheck; box: string; iconClass: string }> = {
  success: {
    icon: CircleCheck,
    box: "border-emerald-500/30",
    iconClass: "text-emerald-600 dark:text-emerald-400",
  },
  error: {
    icon: CircleAlert,
    box: "border-destructive/40",
    iconClass: "text-destructive",
  },
  info: {
    icon: Info,
    box: "border-uk-blue/30",
    iconClass: "text-uk-blue",
  },
};

function ToastItem({ t }: { t: Toast }) {
  const [paused, setPaused] = useState(false);
  // Errors stay up longer — they usually need reading.
  useEffect(() => {
    if (paused) return;
    const timer = window.setTimeout(() => dismiss(t.id), t.kind === "error" ? 8000 : 4500);
    return () => window.clearTimeout(timer);
  }, [t.id, t.kind, paused]);

  const s = styles[t.kind];
  const Icon = s.icon;
  return (
    <li
      role={t.kind === "error" ? "alert" : "status"}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      className={cn(
        "toast-in pointer-events-auto flex w-full items-start gap-3 rounded-xl border bg-uk-card px-4 py-3 text-sm text-uk-heading shadow-premium-lg",
        s.box
      )}
    >
      <Icon className={cn("mt-0.5 h-5 w-5 shrink-0", s.iconClass)} aria-hidden />
      <p className="min-w-0 flex-1 break-words leading-snug">{t.message}</p>
      <button
        type="button"
        onClick={() => dismiss(t.id)}
        aria-label="Dismiss notification"
        className="-mr-1 -mt-0.5 rounded-md p-1 text-uk-muted transition-colors hover:bg-uk-surface-2 hover:text-uk-heading"
      >
        <X className="h-4 w-4" />
      </button>
    </li>
  );
}

const subscribe = (onChange: () => void) => {
  listeners.add(onChange);
  return () => {
    listeners.delete(onChange);
  };
};
const NONE: Toast[] = [];

/** Renders the toast stack. Mount once, in the admin shell. */
export function Toaster() {
  const items = useSyncExternalStore(subscribe, () => toasts, () => NONE);

  return (
    <ol
      aria-label="Notifications"
      className="pointer-events-none fixed inset-x-4 top-20 z-[70] flex flex-col items-end gap-2 sm:left-auto sm:right-6 sm:w-96"
    >
      {items.map((t) => (
        <ToastItem key={t.id} t={t} />
      ))}
    </ol>
  );
}
