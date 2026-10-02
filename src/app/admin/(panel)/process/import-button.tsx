"use client";

import { useState, useTransition } from "react";
import { Download, Loader2 } from "lucide-react";
import { importProcessStepsAction } from "./actions";
import { toast } from "@/components/admin/toast";

export function ImportButton() {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string>();

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          start(async () => {
            const r = await importProcessStepsAction();
            setError(r.ok ? undefined : r.message);
            toast.result(r, "Imported.");
          })
        }
        className="btn-sheen inline-flex h-10 items-center gap-2 rounded-lg bg-uk-blue px-5 text-sm font-semibold text-uk-white shadow-glow-blue-sm transition-colors hover:bg-uk-blue-bright disabled:opacity-60"
      >
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
        Import current process steps
      </button>
      {error && <p role="alert" className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
