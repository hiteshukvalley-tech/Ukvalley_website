"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin-session";
import { hasDatabaseUrl } from "@/lib/db/client";
import {
  INDUSTRIES_TAG, createIndustry, deleteIndustry, importBuiltInIndustries, reorderIndustries, setIndustryPublished, updateIndustry,
} from "@/lib/industries-store";
import {
  readIndustryValues, validateIndustry, type IndustryValues, type FieldErrors,
} from "@/lib/industries-validation";

export type IndustryFormState = {
  status?: "saved" | "error";
  message?: string;
  errors?: FieldErrors;
  /** Echoed back so the form keeps what the user typed after a failed save. */
  values?: IndustryValues;
  /** Bumps on every result so the form can re-key and show fresh values. */
  nonce?: number;
};

export type ActionResult = { ok: boolean; message?: string };

const NO_DB = "Database is not connected (MONGODB_URI missing).";
const dbMessage = (e: unknown) => (e instanceof Error ? e.message : "database error");

function refreshPublicSite() {
  revalidateTag(INDUSTRIES_TAG, { expire: 0 });
  revalidatePath("/", "layout");
  revalidatePath("/admin/industries");
}

export async function createIndustryAction(_prev: IndustryFormState, formData: FormData): Promise<IndustryFormState> {
  await requireAdmin("industries");
  const values = readIndustryValues(formData);
  const nonce = Date.now();

  const result = validateIndustry(values, { requireSlug: true });
  if (!result.ok) {
    return { status: "error", message: "Please fix the highlighted fields.", errors: result.errors, values, nonce };
  }
  if (!hasDatabaseUrl()) return { status: "error", message: NO_DB, values, nonce };

  try {
    const created = await createIndustry(result.value);
    if (!created) {
      return {
        status: "error",
        message: "Please fix the highlighted fields.",
        errors: { slug: "A industry with this slug already exists." },
        values,
        nonce,
      };
    }
  } catch (e) {
    return { status: "error", message: `Could not save: ${dbMessage(e)}`, values, nonce };
  }
  refreshPublicSite();
  redirect("/admin/industries?saved=created");
}

export async function updateIndustryAction(
  slug: string,
  _prev: IndustryFormState,
  formData: FormData
): Promise<IndustryFormState> {
  slug = String(slug);
  await requireAdmin("industries");
  // The slug is the record id and cannot be changed, so never trust the form's copy.
  const values = { ...readIndustryValues(formData), slug };
  const nonce = Date.now();

  const result = validateIndustry(values, { requireSlug: false });
  if (!result.ok) {
    return { status: "error", message: "Please fix the highlighted fields.", errors: result.errors, values, nonce };
  }
  if (!hasDatabaseUrl()) return { status: "error", message: NO_DB, values, nonce };

  try {
    const found = await updateIndustry(result.value);
    if (!found) return { status: "error", message: "This industry no longer exists.", values, nonce };
  } catch (e) {
    return { status: "error", message: `Could not save: ${dbMessage(e)}`, values, nonce };
  }
  refreshPublicSite();
  return { status: "saved", message: "Industry saved. The live site is updating.", values, nonce };
}

export async function importIndustriesAction(): Promise<ActionResult> {
  await requireAdmin("industries");
  if (!hasDatabaseUrl()) return { ok: false, message: NO_DB };
  try {
    const n = await importBuiltInIndustries();
    if (n === 0) return { ok: false, message: "Industries already exist in the database." };
    refreshPublicSite();
    return { ok: true, message: `Imported ${n} industries.` };
  } catch (e) {
    return { ok: false, message: `Could not import: ${dbMessage(e)}` };
  }
}

export async function setIndustryPublishedAction(slug: string, published: boolean): Promise<ActionResult> {
  slug = String(slug);
  published = published === true;
  await requireAdmin("industries");
  if (!hasDatabaseUrl()) return { ok: false, message: NO_DB };
  try {
    await setIndustryPublished(String(slug), Boolean(published));
  } catch (e) {
    return { ok: false, message: `Could not update: ${dbMessage(e)}` };
  }
  refreshPublicSite();
  return { ok: true };
}

export async function reorderIndustriesAction(slugs: string[]): Promise<ActionResult> {
  await requireAdmin("industries");
  if (!hasDatabaseUrl()) return { ok: false, message: NO_DB };
  if (!Array.isArray(slugs) || slugs.some((s) => typeof s !== "string")) {
    return { ok: false, message: "Invalid order." };
  }
  try {
    const ok = await reorderIndustries(slugs);
    if (!ok) return { ok: false, message: "The list changed in another tab. Reload and try again." };
  } catch (e) {
    return { ok: false, message: `Could not reorder: ${dbMessage(e)}` };
  }
  refreshPublicSite();
  return { ok: true };
}

export async function deleteIndustryAction(slug: string): Promise<ActionResult> {
  slug = String(slug);
  await requireAdmin("industries");
  if (!hasDatabaseUrl()) return { ok: false, message: NO_DB };
  try {
    await deleteIndustry(String(slug));
  } catch (e) {
    return { ok: false, message: `Could not delete: ${dbMessage(e)}` };
  }
  refreshPublicSite();
  return { ok: true };
}
