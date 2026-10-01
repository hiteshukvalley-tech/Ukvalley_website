"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin-session";
import { hasDatabaseUrl } from "@/lib/db/client";
import {
  TESTIMONIALS_TAG, createTestimonial, deleteTestimonial, importBuiltInTestimonials, reorderTestimonials, setTestimonialPublished, updateTestimonial,
} from "@/lib/testimonials-store";
import {
  readTestimonialValues, validateTestimonial, type TestimonialValues, type FieldErrors,
} from "@/lib/testimonials-validation";

export type TestimonialFormState = {
  status?: "saved" | "error";
  message?: string;
  errors?: FieldErrors;
  /** Echoed back so the form keeps what the user typed after a failed save. */
  values?: TestimonialValues;
  /** Bumps on every result so the form can re-key and show fresh values. */
  nonce?: number;
};

export type ActionResult = { ok: boolean; message?: string };

const NO_DB = "Database is not connected (MONGODB_URI missing).";
const dbMessage = (e: unknown) => (e instanceof Error ? e.message : "database error");

function refreshPublicSite() {
  revalidateTag(TESTIMONIALS_TAG, { expire: 0 });
  revalidatePath("/", "layout");
  revalidatePath("/admin/testimonials");
}

export async function createTestimonialAction(_prev: TestimonialFormState, formData: FormData): Promise<TestimonialFormState> {
  await requireAdmin();
  const values = readTestimonialValues(formData);
  const nonce = Date.now();

  const result = validateTestimonial(values);
  if (!result.ok) {
    return { status: "error", message: "Please fix the highlighted fields.", errors: result.errors, values, nonce };
  }
  if (!hasDatabaseUrl()) return { status: "error", message: NO_DB, values, nonce };

  try {
    await createTestimonial(result.value);
  } catch (e) {
    return { status: "error", message: `Could not save: ${dbMessage(e)}`, values, nonce };
  }
  refreshPublicSite();
  redirect("/admin/testimonials?saved=created");
}

export async function updateTestimonialAction(
  slug: string,
  _prev: TestimonialFormState,
  formData: FormData
): Promise<TestimonialFormState> {
  slug = String(slug);
  await requireAdmin();
  const values = readTestimonialValues(formData);
  const nonce = Date.now();

  const result = validateTestimonial(values);
  if (!result.ok) {
    return { status: "error", message: "Please fix the highlighted fields.", errors: result.errors, values, nonce };
  }
  if (!hasDatabaseUrl()) return { status: "error", message: NO_DB, values, nonce };

  try {
    const found = await updateTestimonial(slug, result.value);
    if (!found) return { status: "error", message: "This testimonial no longer exists.", values, nonce };
  } catch (e) {
    return { status: "error", message: `Could not save: ${dbMessage(e)}`, values, nonce };
  }
  refreshPublicSite();
  return { status: "saved", message: "Testimonial saved. The live site is updating.", values, nonce };
}

export async function importTestimonialsAction(): Promise<ActionResult> {
  await requireAdmin();
  if (!hasDatabaseUrl()) return { ok: false, message: NO_DB };
  try {
    const n = await importBuiltInTestimonials();
    if (n === 0) return { ok: false, message: "Testimonials already exist in the database." };
    refreshPublicSite();
    return { ok: true, message: `Imported ${n} testimonials.` };
  } catch (e) {
    return { ok: false, message: `Could not import: ${dbMessage(e)}` };
  }
}

export async function setTestimonialPublishedAction(slug: string, published: boolean): Promise<ActionResult> {
  slug = String(slug);
  published = published === true;
  await requireAdmin();
  if (!hasDatabaseUrl()) return { ok: false, message: NO_DB };
  try {
    await setTestimonialPublished(String(slug), Boolean(published));
  } catch (e) {
    return { ok: false, message: `Could not update: ${dbMessage(e)}` };
  }
  refreshPublicSite();
  return { ok: true };
}

export async function reorderTestimonialsAction(slugs: string[]): Promise<ActionResult> {
  await requireAdmin();
  if (!hasDatabaseUrl()) return { ok: false, message: NO_DB };
  if (!Array.isArray(slugs) || slugs.some((s) => typeof s !== "string")) {
    return { ok: false, message: "Invalid order." };
  }
  try {
    const ok = await reorderTestimonials(slugs);
    if (!ok) return { ok: false, message: "The list changed in another tab. Reload and try again." };
  } catch (e) {
    return { ok: false, message: `Could not reorder: ${dbMessage(e)}` };
  }
  refreshPublicSite();
  return { ok: true };
}

export async function deleteTestimonialAction(slug: string): Promise<ActionResult> {
  slug = String(slug);
  await requireAdmin();
  if (!hasDatabaseUrl()) return { ok: false, message: NO_DB };
  try {
    await deleteTestimonial(String(slug));
  } catch (e) {
    return { ok: false, message: `Could not delete: ${dbMessage(e)}` };
  }
  refreshPublicSite();
  return { ok: true };
}
