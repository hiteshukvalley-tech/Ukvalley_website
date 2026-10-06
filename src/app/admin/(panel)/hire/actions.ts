"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin-session";
import { hasDatabaseUrl } from "@/lib/db/client";
import {
  HIRE_TAG, createHire, deleteHire, importBuiltInHire, reorderHire, setHirePublished, updateHire,
} from "@/lib/hire-store";
import {
  readHireValues, validateHire, type HireValues, type FieldErrors,
} from "@/lib/hire-validation";

export type HireFormState = {
  status?: "saved" | "error";
  message?: string;
  errors?: FieldErrors;
  /** Echoed back so the form keeps what the user typed after a failed save. */
  values?: HireValues;
  /** Bumps on every result so the form can re-key and show fresh values. */
  nonce?: number;
};

export type ActionResult = { ok: boolean; message?: string };

const NO_DB = "Database is not connected (MONGODB_URI missing).";
const dbMessage = (e: unknown) => (e instanceof Error ? e.message : "database error");

function refreshPublicSite() {
  revalidateTag(HIRE_TAG, { expire: 0 });
  revalidatePath("/", "layout");
  revalidatePath("/admin/hire");
}

export async function createHireAction(_prev: HireFormState, formData: FormData): Promise<HireFormState> {
  await requireAdmin("hire");
  const values = readHireValues(formData);
  const nonce = Date.now();

  const result = validateHire(values, { requireSlug: true });
  if (!result.ok) {
    return { status: "error", message: "Please fix the highlighted fields.", errors: result.errors, values, nonce };
  }
  if (!hasDatabaseUrl()) return { status: "error", message: NO_DB, values, nonce };

  try {
    const created = await createHire(result.value);
    if (!created) {
      return {
        status: "error",
        message: "Please fix the highlighted fields.",
        errors: { slug: "A hire role with this slug already exists." },
        values,
        nonce,
      };
    }
  } catch (e) {
    return { status: "error", message: `Could not save: ${dbMessage(e)}`, values, nonce };
  }
  refreshPublicSite();
  redirect("/admin/hire?saved=created");
}

export async function updateHireAction(
  slug: string,
  _prev: HireFormState,
  formData: FormData
): Promise<HireFormState> {
  slug = String(slug);
  await requireAdmin("hire");
  // The slug is the record id and cannot be changed, so never trust the form's copy.
  const values = { ...readHireValues(formData), slug };
  const nonce = Date.now();

  const result = validateHire(values, { requireSlug: false });
  if (!result.ok) {
    return { status: "error", message: "Please fix the highlighted fields.", errors: result.errors, values, nonce };
  }
  if (!hasDatabaseUrl()) return { status: "error", message: NO_DB, values, nonce };

  try {
    const found = await updateHire(result.value);
    if (!found) return { status: "error", message: "This role no longer exists.", values, nonce };
  } catch (e) {
    return { status: "error", message: `Could not save: ${dbMessage(e)}`, values, nonce };
  }
  refreshPublicSite();
  return { status: "saved", message: "Role saved. The live site is updating.", values, nonce };
}

export async function importHireAction(): Promise<ActionResult> {
  await requireAdmin("hire");
  if (!hasDatabaseUrl()) return { ok: false, message: NO_DB };
  try {
    const n = await importBuiltInHire();
    if (n === 0) return { ok: false, message: "Hire roles already exist in the database." };
    refreshPublicSite();
    return { ok: true, message: `Imported ${n} hire roles.` };
  } catch (e) {
    return { ok: false, message: `Could not import: ${dbMessage(e)}` };
  }
}

export async function setHirePublishedAction(slug: string, published: boolean): Promise<ActionResult> {
  slug = String(slug);
  published = published === true;
  await requireAdmin("hire");
  if (!hasDatabaseUrl()) return { ok: false, message: NO_DB };
  try {
    await setHirePublished(String(slug), Boolean(published));
  } catch (e) {
    return { ok: false, message: `Could not update: ${dbMessage(e)}` };
  }
  refreshPublicSite();
  return { ok: true };
}

export async function reorderHireAction(slugs: string[]): Promise<ActionResult> {
  await requireAdmin("hire");
  if (!hasDatabaseUrl()) return { ok: false, message: NO_DB };
  if (!Array.isArray(slugs) || slugs.some((s) => typeof s !== "string")) {
    return { ok: false, message: "Invalid order." };
  }
  try {
    const ok = await reorderHire(slugs);
    if (!ok) return { ok: false, message: "The list changed in another tab. Reload and try again." };
  } catch (e) {
    return { ok: false, message: `Could not reorder: ${dbMessage(e)}` };
  }
  refreshPublicSite();
  return { ok: true };
}

export async function deleteHireAction(slug: string): Promise<ActionResult> {
  slug = String(slug);
  await requireAdmin("hire");
  if (!hasDatabaseUrl()) return { ok: false, message: NO_DB };
  try {
    await deleteHire(String(slug));
  } catch (e) {
    return { ok: false, message: `Could not delete: ${dbMessage(e)}` };
  }
  refreshPublicSite();
  return { ok: true };
}
