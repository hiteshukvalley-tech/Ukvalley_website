"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { TriangleAlert, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

/*
 * Admin confirmation dialog, centred on the screen. Replaces window.confirm:
 *   if (await confirmDialog("Delete “X”? This can't be undone.")) { … }
 * <ConfirmHost /> in the admin shell renders it. The first word of the message
 * picks the button text and colour: Delete / Remove are red, Restore is blue.
 */

type Pending = { message: string; resolve: (ok: boolean) => void };

let current: Pending | null = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export function confirmDialog(message: string): Promise<boolean> {
  // A second request while one is open answers the first with "no".
  current?.resolve(false);
  return new Promise<boolean>((resolve) => {
    current = { message, resolve };
    emit();
  });
}

function answer(ok: boolean) {
  const c = current;
  current = null;
  emit();
  c?.resolve(ok);
}

const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
};

/** Renders the open confirmation (if any). Mount once, in the admin shell. */
export function ConfirmHost() {
  const open = useSyncExternalStore(subscribe, () => current, () => null);
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    cancelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") answer(false);
      // Keep Tab inside the dialog.
      if (e.key === "Tab") {
        const buttons = Array.from(document.querySelectorAll<HTMLElement>("[data-confirm-dialog] button"));
        if (!buttons.length) return;
        const i = buttons.indexOf(document.activeElement as HTMLElement);
        e.preventDefault();
        buttons[(i + (e.shiftKey ? -1 : 1) + buttons.length) % buttons.length].focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      previous?.focus?.();
    };
  }, [open]);

  if (!open || typeof document === "undefined") return null;

  const word = open.message.trim().split(/\s+/)[0]?.replace(/[^A-Za-z]/g, "") || "Confirm";
  const destructive = /^(delete|remove)$/i.test(word);
  const Icon = destructive ? TriangleAlert : RotateCcw;
  const title = destructive ? "Are you sure?" : "Please confirm";

  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" onClick={() => answer(false)} aria-hidden />
      <div
        data-confirm-dialog
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby="confirm-message"
        className="relative w-full max-w-md rounded-2xl border border-uk-line bg-uk-card p-6 shadow-premium-lg"
      >
        <div className="flex items-start gap-4">
          <span
            className={cn(
              "flex h-11 w-11 shrink-0 items-center justify-center rounded-full",
              destructive ? "bg-destructive/15 text-destructive" : "bg-uk-blue/15 text-uk-blue"
            )}
          >
            <Icon className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <h2 id="confirm-title" className="font-heading text-lg font-semibold text-uk-heading">{title}</h2>
            <p id="confirm-message" className="mt-1 break-words text-sm text-uk-body">{open.message}</p>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button
            ref={cancelRef}
            type="button"
            onClick={() => answer(false)}
            className="h-10 rounded-lg border border-uk-line px-4 text-sm font-medium text-uk-body transition-colors hover:bg-uk-surface-2 hover:text-uk-heading"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => answer(true)}
            className={cn(
              "h-10 rounded-lg px-5 text-sm font-semibold text-white transition-colors",
              destructive ? "bg-destructive hover:bg-destructive/90" : "bg-uk-blue hover:bg-uk-blue-bright"
            )}
          >
            {word}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
