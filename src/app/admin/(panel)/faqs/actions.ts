"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin-session";
import { hasDatabaseUrl } from "@/lib/db/client";
import {
  FAQS_TAG, createFaq, deleteFaq, importBuiltInFaqs, reorderFaqs, setFaqPublished, updateFaq,
} from "@/lib/faqs-store";
import {
  readFaqValues, validateFaq, type FaqValues, type FieldErrors,
} from "@/lib/faqs-validation";

export type FaqFormState = {
  status?: "saved" | "error";
  message?: string;
  errors?: FieldErrors;
  /** Echoed back so the form keeps what the user typed after a failed save. */
  values?: FaqValues;
  /** Bumps on every result so the form can re-key and show fresh values. */
  nonce?: number;
};

export type ActionResult = { ok: boolean; message?: string };

const NO_DB = "Database is not connected (MONGODB_URI missing).";
const dbMessage = (e: unknown) => (e instanceof Error ? e.message : "database error");

function refreshPublicSite() {
  revalidateTag(FAQS_TAG, { expire: 0 });
  revalidatePath("/", "layout");
  revalidatePath("/admin/faqs");
}

export async function createFaqAction(_prev: FaqFormState, formData: FormData): Promise<FaqFormState> {
  await requireAdmin();
  const values = readFaqValues(formData);
  const nonce = Date.now();

  const result = validateFaq(values);
  if (!result.ok) {
    return { status: "error", message: "Please fix the highlighted fields.", errors: result.errors, values, nonce };
  }
  if (!hasDatabaseUrl()) return { status: "error", message: NO_DB, values, nonce };

  try {
    await createFaq(result.value);
  } catch (e) {
    return { status: "error", message: `Could not save: ${dbMessage(e)}`, values, nonce };
  }
  refreshPublicSite();
  redirect("/admin/faqs?saved=created");
}

export async function updateFaqAction(
  slug: string,
  _prev: FaqFormState,
  formData: FormData
): Promise<FaqFormState> {
  slug = String(slug);
  await requireAdmin();
  const values = readFaqValues(formData);
  const nonce = Date.now();

  const result = validateFaq(values);
  if (!result.ok) {
    return { status: "error", message: "Please fix the highlighted fields.", errors: result.errors, values, nonce };
  }
  if (!hasDatabaseUrl()) return { status: "error", message: NO_DB, values, nonce };

  try {
    const found = await updateFaq(slug, result.value);
    if (!found) return { status: "error", message: "This FAQ no longer exists.", values, nonce };
  } catch (e) {
    return { status: "error", message: `Could not save: ${dbMessage(e)}`, values, nonce };
  }
  refreshPublicSite();
  return { status: "saved", message: "FAQ saved. The live site is updating.", values, nonce };
}

export async function importFaqsAction(): Promise<ActionResult> {
  await requireAdmin();
  if (!hasDatabaseUrl()) return { ok: false, message: NO_DB };
  try {
    const n = await importBuiltInFaqs();
    if (n === 0) return { ok: false, message: "FAQs already exist in the database." };
    refreshPublicSite();
    return { ok: true, message: `Imported ${n} FAQs.` };
  } catch (e) {
    return { ok: false, message: `Could not import: ${dbMessage(e)}` };
  }
}

export async function setFaqPublishedAction(slug: string, published: boolean): Promise<ActionResult> {
  slug = String(slug);
  published = published === true;
  await requireAdmin();
  if (!hasDatabaseUrl()) return { ok: false, message: NO_DB };
  try {
    await setFaqPublished(String(slug), Boolean(published));
  } catch (e) {
    return { ok: false, message: `Could not update: ${dbMessage(e)}` };
  }
  refreshPublicSite();
  return { ok: true };
}

export async function reorderFaqsAction(slugs: string[]): Promise<ActionResult> {
  await requireAdmin();
  if (!hasDatabaseUrl()) return { ok: false, message: NO_DB };
  if (!Array.isArray(slugs) || slugs.some((s) => typeof s !== "string")) {
    return { ok: false, message: "Invalid order." };
  }
  try {
    const ok = await reorderFaqs(slugs);
    if (!ok) return { ok: false, message: "The list changed in another tab. Reload and try again." };
  } catch (e) {
    return { ok: false, message: `Could not reorder: ${dbMessage(e)}` };
  }
  refreshPublicSite();
  return { ok: true };
}

export async function deleteFaqAction(slug: string): Promise<ActionResult> {
  slug = String(slug);
  await requireAdmin();
  if (!hasDatabaseUrl()) return { ok: false, message: NO_DB };
  try {
    await deleteFaq(String(slug));
  } catch (e) {
    return { ok: false, message: `Could not delete: ${dbMessage(e)}` };
  }
  refreshPublicSite();
  return { ok: true };
}
