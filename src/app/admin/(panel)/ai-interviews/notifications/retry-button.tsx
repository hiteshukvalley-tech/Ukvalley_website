"use client";

import { useTransition } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import { toast } from "@/components/admin/toast";
import { retryJobAction, retryNotificationAction } from "../actions";

export function RetryButton({ id, job = false, label = "Send again" }: { id: string; job?: boolean; label?: string }) {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => start(async () => toast.result(await (job ? retryJobAction(id) : retryNotificationAction(id)), "Queued."))}
      className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-uk-line px-2.5 text-xs font-medium text-uk-body hover:bg-uk-surface-2 disabled:opacity-50"
    >
      {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />} {label}
    </button>
  );
}
