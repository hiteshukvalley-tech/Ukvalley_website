"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin-session";
import { hasDatabaseUrl } from "@/lib/db/client";
import {
  HOME_TAG, createCustomSection, deleteCustomSection, resetHomeSection, writeCustomSection, writeHomeOrder, writeHomeSection,
} from "@/lib/home-store";
import { homeSectionDef, isHomeSectionKey, validateSection, type SectionDef, type SectionValues } from "@/lib/home-schema";
import { CUSTOM_SECTION_DEF, checkCustomPairs, isCustomKey } from "@/lib/site-content-schema";

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

const noDb = (nonce: number): HomeSectionState => ({
  status: "error", message: "Database is not connected (MONGODB_URI missing).", nonce,
});

/** Saves one section (built-in or custom). The editor sends its values as JSON in `payload`. */
export async function saveHomeSectionAction(
  key: string,
  _prev: HomeSectionState,
  formData: FormData
): Promise<HomeSectionState> {
  await requireAdmin();
  const nonce = Date.now();
  const custom = isCustomKey(key);
  const def: SectionDef | undefined = custom ? CUSTOM_SECTION_DEF : homeSectionDef(key);
  if (!def) return { status: "error", message: "Unknown section.", nonce };

  let parsed: { values?: unknown; visible?: unknown };
  try {
    parsed = JSON.parse(String(formData.get("payload") ?? "{}"));
  } catch {
    return { status: "error", message: "Could not read the form. Reload the page and try again.", nonce };
  }
  const result = validateSection(def, parsed.values);
  const errors = result.ok ? (custom ? checkCustomPairs(result.value) : {}) : result.errors;
  if (!result.ok || Object.keys(errors).length) {
    return { status: "error", message: "Please fix the highlighted fields.", errors, nonce };
  }
  const visible = def.canHide ? parsed.visible !== false : true;
  if (!hasDatabaseUrl()) return noDb(nonce);
  try {
    if (custom) {
      if (!(await writeCustomSection(key, result.value, visible))) {
        return { status: "error", message: "This section no longer exists. Go back to the list.", nonce };
      }
    } else if (isHomeSectionKey(key)) {
      await writeHomeSection(key, result.value, visible);
    }
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
  if (!isHomeSectionKey(key)) return { status: "error", message: "Unknown section.", nonce };
  if (!hasDatabaseUrl()) return noDb(nonce);
  try {
    await resetHomeSection(key);
  } catch (e) {
    return { status: "error", message: `Could not reset: ${e instanceof Error ? e.message : "database error"}`, nonce };
  }
  refreshPublicSite();
  return { status: "reset", message: "Restored the original text.", nonce };
}

export type LayoutState = { status?: "saved" | "error" | "reset"; message?: string; nonce?: number };

/** Saves the order the home page shows its sections in. */
export async function saveHomeOrderAction(order: string[]): Promise<LayoutState> {
  await requireAdmin();
  const nonce = Date.now();
  if (!Array.isArray(order) || order.some((x) => typeof x !== "string")) {
    return { status: "error", message: "Could not read the new order.", nonce };
  }
  if (!hasDatabaseUrl()) return noDb(nonce);
  try {
    await writeHomeOrder(order);
  } catch (e) {
    return { status: "error", message: `Could not save the order: ${e instanceof Error ? e.message : "database error"}`, nonce };
  }
  refreshPublicSite();
  return { status: "saved", message: "Order saved. The home page is updating.", nonce };
}

/** Creates a custom section (placed after Insights) and opens its editor. */
export async function createCustomSectionAction(_prev: LayoutState, formData: FormData): Promise<LayoutState> {
  await requireAdmin();
  const nonce = Date.now();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { status: "error", message: "Give the new section a name.", nonce };
  if (name.length > 60) return { status: "error", message: "Use 60 characters or fewer for the name.", nonce };
  if (!hasDatabaseUrl()) return noDb(nonce);
  let id: string;
  try {
    id = await createCustomSection(name);
  } catch (e) {
    return { status: "error", message: `Could not add the section: ${e instanceof Error ? e.message : "database error"}`, nonce };
  }
  refreshPublicSite();
  redirect(`/admin/home/${id}`);
}

export async function deleteCustomSectionAction(id: string): Promise<LayoutState> {
  await requireAdmin();
  const nonce = Date.now();
  if (!isCustomKey(id)) return { status: "error", message: "Only sections you added can be deleted.", nonce };
  if (!hasDatabaseUrl()) return noDb(nonce);
  try {
    await deleteCustomSection(id);
  } catch (e) {
    return { status: "error", message: `Could not delete: ${e instanceof Error ? e.message : "database error"}`, nonce };
  }
  refreshPublicSite();
  return { status: "saved", message: "Section deleted.", nonce };
}
