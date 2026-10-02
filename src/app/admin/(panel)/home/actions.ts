"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { requireAdmin } from "@/lib/admin-session";
import { hasDatabaseUrl } from "@/lib/db/client";
import { HOME_TAG, resetHomeSection, writeHomeSection } from "@/lib/home-store";
import { homeSectionDef, validateSection, type SectionValues } from "@/lib/home-schema";

export type HomeSectionState = {
  status?: "saved" | "error" | "reset";
  message?: string;
  errors?: Record<string, string>;
  /** what is now stored (after a save or reset), for the editor to show */
  values?: SectionValues;
  visible?: boolean;
  /** bumps on every result so the editor can re-sync */
  nonce?: number;
};

function refreshPublicSite() {
  revalidateTag(HOME_TAG, { expire: 0 });
  revalidatePath("/");
  revalidatePath("/admin/home", "layout");
}

/** Saves one section. The editor sends its values as JSON in `payload`. */
export async function saveHomeSectionAction(
  key: string,
  _prev: HomeSectionState,
  formData: FormData
): Promise<HomeSectionState> {
  await requireAdmin();
  const nonce = Date.now();
  const def = homeSectionDef(key);
  if (!def) return { status: "error", message: "Unknown section.", nonce };

  let parsed: { values?: unknown; visible?: unknown };
  try {
    parsed = JSON.parse(String(formData.get("payload") ?? "{}"));
  } catch {
    return { status: "error", message: "Could not read the form. Reload the page and try again.", nonce };
  }
  const result = validateSection(def, parsed.values);
  if (!result.ok) {
    return { status: "error", message: "Please fix the highlighted fields.", errors: result.errors, nonce };
  }
  const visible = def.canHide ? parsed.visible !== false : true;
  if (!hasDatabaseUrl()) {
    return { status: "error", message: "Database is not connected (MONGODB_URI missing).", nonce };
  }
  try {
    await writeHomeSection(def.key, result.value, visible);
  } catch (e) {
    return { status: "error", message: `Could not save: ${e instanceof Error ? e.message : "database error"}`, nonce };
  }
  refreshPublicSite();
  return {
    status: "saved",
    message: visible ? "Saved. The home page is updating." : "Saved. This section is hidden on the home page.",
    values: result.value,
    visible,
    nonce,
  };
}

/** Deletes the saved copy, so the section shows its original text again. */
export async function resetHomeSectionAction(key: string): Promise<HomeSectionState> {
  await requireAdmin();
  const nonce = Date.now();
  const def = homeSectionDef(key);
  if (!def) return { status: "error", message: "Unknown section.", nonce };
  if (!hasDatabaseUrl()) {
    return { status: "error", message: "Database is not connected (MONGODB_URI missing).", nonce };
  }
  try {
    await resetHomeSection(def.key);
  } catch (e) {
    return { status: "error", message: `Could not reset: ${e instanceof Error ? e.message : "database error"}`, nonce };
  }
  refreshPublicSite();
  return { status: "reset", message: "Restored the original text.", nonce };
}
