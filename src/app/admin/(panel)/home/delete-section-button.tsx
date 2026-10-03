"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "@/components/admin/toast";
import { deleteCustomSectionAction } from "./actions";

/** Deletes a custom section after a confirmation, then returns to the list. */
export function DeleteSectionButton({ id, name }: { id: string; name: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (!window.confirm(`Delete the section "${name}"? It disappears from the home page and cannot be restored.`)) return;
        start(async () => {
          const r = await deleteCustomSectionAction(id);
          if (r.status === "saved") {
            toast.success(r.message ?? "Section deleted.");
            router.push("/admin/home");
          } else toast.error(r.message ?? "Could not delete the section.");
        });
      }}
      className="inline-flex h-9 items-center gap-2 rounded-lg border border-destructive/30 px-3 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-60"
    >
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
      Delete section
    </button>
  );
}
