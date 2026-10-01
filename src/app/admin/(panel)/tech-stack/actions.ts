"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin-session";
import { hasDatabaseUrl } from "@/lib/db/client";
import {
  TECH_STACK_TAG, createTechCategory, deleteTechCategory, importBuiltInTechCategories, reorderTechCategories, setTechCategoryPublished, updateTechCategory,
} from "@/lib/tech-stack-store";
import {
  readTechCategoryValues, validateTechCategory, type TechCategoryValues, type FieldErrors,
} from "@/lib/tech-stack-validation";

export type TechCategoryFormState = {
  status?: "saved" | "error";
  message?: string;
  errors?: FieldErrors;
  /** Echoed back so the form keeps what the user typed after a failed save. */
  values?: TechCategoryValues;
  /** Bumps on every result so the form can re-key and show fresh values. */
  nonce?: number;
};

export type ActionResult = { ok: boolean; message?: string };

const NO_DB = "Database is not connected (MONGODB_URI missing).";
const dbMessage = (e: unknown) => (e instanceof Error ? e.message : "database error");

function refreshPublicSite() {
  revalidateTag(TECH_STACK_TAG, { expire: 0 });
  revalidatePath("/", "layout");
  revalidatePath("/admin/tech-stack");
}

export async function createTechCategoryAction(_prev: TechCategoryFormState, formData: FormData): Promise<TechCategoryFormState> {
  await requireAdmin();
  const values = readTechCategoryValues(formData);
  const nonce = Date.now();

  const result = validateTechCategory(values);
  if (!result.ok) {
    return { status: "error", message: "Please fix the highlighted fields.", errors: result.errors, values, nonce };
  }
  if (!hasDatabaseUrl()) return { status: "error", message: NO_DB, values, nonce };

  try {
    await createTechCategory(result.value);
  } catch (e) {
    return { status: "error", message: `Could not save: ${dbMessage(e)}`, values, nonce };
  }
  refreshPublicSite();
  redirect("/admin/tech-stack?saved=created");
}

export async function updateTechCategoryAction(
  slug: string,
  _prev: TechCategoryFormState,
  formData: FormData
): Promise<TechCategoryFormState> {
  slug = String(slug);
  await requireAdmin();
  const values = readTechCategoryValues(formData);
  const nonce = Date.now();

  const result = validateTechCategory(values);
  if (!result.ok) {
    return { status: "error", message: "Please fix the highlighted fields.", errors: result.errors, values, nonce };
  }
  if (!hasDatabaseUrl()) return { status: "error", message: NO_DB, values, nonce };

  try {
    const found = await updateTechCategory(slug, result.value);
    if (!found) return { status: "error", message: "This category no longer exists.", values, nonce };
  } catch (e) {
    return { status: "error", message: `Could not save: ${dbMessage(e)}`, values, nonce };
  }
  refreshPublicSite();
  return { status: "saved", message: "Category saved. The live site is updating.", values, nonce };
}

export async function importTechCategoriesAction(): Promise<ActionResult> {
  await requireAdmin();
  if (!hasDatabaseUrl()) return { ok: false, message: NO_DB };
  try {
    const n = await importBuiltInTechCategories();
    if (n === 0) return { ok: false, message: "Tech categories already exist in the database." };
    refreshPublicSite();
    return { ok: true, message: `Imported ${n} tech categories.` };
  } catch (e) {
    return { ok: false, message: `Could not import: ${dbMessage(e)}` };
  }
}

export async function setTechCategoryPublishedAction(slug: string, published: boolean): Promise<ActionResult> {
  slug = String(slug);
  published = published === true;
  await requireAdmin();
  if (!hasDatabaseUrl()) return { ok: false, message: NO_DB };
  try {
    await setTechCategoryPublished(String(slug), Boolean(published));
  } catch (e) {
    return { ok: false, message: `Could not update: ${dbMessage(e)}` };
  }
  refreshPublicSite();
  return { ok: true };
}

export async function reorderTechCategoriesAction(slugs: string[]): Promise<ActionResult> {
  await requireAdmin();
  if (!hasDatabaseUrl()) return { ok: false, message: NO_DB };
  if (!Array.isArray(slugs) || slugs.some((s) => typeof s !== "string")) {
    return { ok: false, message: "Invalid order." };
  }
  try {
    const ok = await reorderTechCategories(slugs);
    if (!ok) return { ok: false, message: "The list changed in another tab. Reload and try again." };
  } catch (e) {
    return { ok: false, message: `Could not reorder: ${dbMessage(e)}` };
  }
  refreshPublicSite();
  return { ok: true };
}

export async function deleteTechCategoryAction(slug: string): Promise<ActionResult> {
  slug = String(slug);
  await requireAdmin();
  if (!hasDatabaseUrl()) return { ok: false, message: NO_DB };
  try {
    await deleteTechCategory(String(slug));
  } catch (e) {
    return { ok: false, message: `Could not delete: ${dbMessage(e)}` };
  }
  refreshPublicSite();
  return { ok: true };
}
