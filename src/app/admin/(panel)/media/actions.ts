"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin-session";
import { hasDatabaseUrl } from "@/lib/db/client";
import { deleteMedia } from "@/lib/media-store";

export type ActionResult = { ok: boolean; message?: string };

export async function deleteMediaAction(id: string): Promise<ActionResult> {
  id = String(id);
  await requireAdmin("media");
  if (!hasDatabaseUrl()) return { ok: false, message: "Database is not connected (MONGODB_URI missing)." };
  let removed: boolean;
  try {
    removed = await deleteMedia(id);
  } catch (e) {
    return { ok: false, message: `Could not delete: ${e instanceof Error ? e.message : "database error"}` };
  }
  // Already gone (e.g. deleted in another tab) is the outcome the user wanted.
  revalidatePath("/admin/media");
  revalidatePath("/admin");
  return removed ? { ok: true } : { ok: true, message: "This file was already deleted." };
}
