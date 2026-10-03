"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "@/components/admin/toast";
import { deleteMainPageAction } from "./actions";
import { confirmDialog } from "@/components/admin/confirm-dialog";

/** Deletes an added main section's page and its menu item, after a confirmation. */
export function DeleteMainPageButton({ slug, name }: { slug: string; name: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={async () => {
        if (!await confirmDialog(`Delete "${name}"? The page and its menu item disappear and cannot be restored.`)) return;
        start(async () => {
          const r = await deleteMainPageAction(slug);
          if (r.status === "saved") {
            toast.success(r.message ?? "Deleted.");
            router.push("/admin/menu");
          } else toast.error(r.message ?? "Could not delete.");
        });
      }}
      className="inline-flex h-9 items-center gap-2 rounded-lg border border-destructive/30 px-3 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-60"
    >
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
      Delete section
    </button>
  );
}
