"use client";

import { useTransition } from "react";
import { RefreshCw } from "lucide-react";
import { toast } from "@/components/admin/toast";
import { rebuildModelsAction } from "../actions";

export function RebuildModels() {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-uk-line px-3 py-1.5 text-xs font-medium text-uk-heading transition-colors hover:bg-uk-surface-2 disabled:opacity-50"
      onClick={() => start(async () => void toast.result(await rebuildModelsAction(), "Rebuilt."))}
    >
      <RefreshCw className={`h-3.5 w-3.5 ${pending ? "animate-spin" : ""}`} /> {pending ? "Rebuilding…" : "Rebuild data models"}
    </button>
  );
}
