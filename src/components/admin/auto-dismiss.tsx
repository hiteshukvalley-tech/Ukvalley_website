"use client";

import { useEffect, useState, type ReactNode } from "react";
import { MESSAGE_MS } from "@/lib/message-timing";

/**
 * Shows an inline message (a form's success or error banner) and removes it
 * after the same interval as the pop-up notifications. `watch` is any value
 * that changes with each new result (e.g. the form state), which brings the
 * message back and restarts the timer.
 */
export function AutoDismiss({ watch, children }: { watch?: unknown; children: ReactNode }) {
  const [hidden, setHidden] = useState<{ for: unknown } | null>(null);
  useEffect(() => {
    const t = window.setTimeout(() => setHidden({ for: watch }), MESSAGE_MS);
    return () => window.clearTimeout(t);
  }, [watch]);
  return hidden && Object.is(hidden.for, watch) ? null : <>{children}</>;
}
