"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin-session";
import { hasDatabaseUrl } from "@/lib/db/client";
import {
  ENGAGEMENT_TAG, createEngagementModel, deleteEngagementModel, importBuiltInEngagementModels, reorderEngagementModels, setEngagementModelPublished, updateEngagementModel,
} from "@/lib/engagement-store";
import {
  readEngagementModelValues, validateEngagementModel, type EngagementModelValues, type FieldErrors,
} from "@/lib/engagement-validation";

export type EngagementModelFormState = {
  status?: "saved" | "error";
  message?: string;
  errors?: FieldErrors;
  /** Echoed back so the form keeps what the user typed after a failed save. */
  values?: EngagementModelValues;
  /** Bumps on every result so the form can re-key and show fresh values. */
  nonce?: number;
};

export type ActionResult = { ok: boolean; message?: string };

const NO_DB = "Database is not connected (MONGODB_URI missing).";
const dbMessage = (e: unknown) => (e instanceof Error ? e.message : "database error");

function refreshPublicSite() {
  revalidateTag(ENGAGEMENT_TAG, { expire: 0 });
  revalidatePath("/", "layout");
  revalidatePath("/admin/engagement");
}

export async function createEngagementModelAction(_prev: EngagementModelFormState, formData: FormData): Promise<EngagementModelFormState> {
  await requireAdmin("engagement");
  const values = readEngagementModelValues(formData);
  const nonce = Date.now();

  const result = validateEngagementModel(values);
  if (!result.ok) {
    return { status: "error", message: "Please fix the highlighted fields.", errors: result.errors, values, nonce };
  }
  if (!hasDatabaseUrl()) return { status: "error", message: NO_DB, values, nonce };

  try {
    await createEngagementModel(result.value);
  } catch (e) {
    return { status: "error", message: `Could not save: ${dbMessage(e)}`, values, nonce };
  }
  refreshPublicSite();
  redirect("/admin/engagement?saved=created");
}

export async function updateEngagementModelAction(
  slug: string,
  _prev: EngagementModelFormState,
  formData: FormData
): Promise<EngagementModelFormState> {
  slug = String(slug);
  await requireAdmin("engagement");
  const values = readEngagementModelValues(formData);
  const nonce = Date.now();

  const result = validateEngagementModel(values);
  if (!result.ok) {
    return { status: "error", message: "Please fix the highlighted fields.", errors: result.errors, values, nonce };
  }
  if (!hasDatabaseUrl()) return { status: "error", message: NO_DB, values, nonce };

  try {
    const found = await updateEngagementModel(slug, result.value);
    if (!found) return { status: "error", message: "This model no longer exists.", values, nonce };
  } catch (e) {
    return { status: "error", message: `Could not save: ${dbMessage(e)}`, values, nonce };
  }
  refreshPublicSite();
  return { status: "saved", message: "Model saved. The live site is updating.", values, nonce };
}

export async function importEngagementModelsAction(): Promise<ActionResult> {
  await requireAdmin("engagement");
  if (!hasDatabaseUrl()) return { ok: false, message: NO_DB };
  try {
    const n = await importBuiltInEngagementModels();
    if (n === 0) return { ok: false, message: "Engagement models already exist in the database." };
    refreshPublicSite();
    return { ok: true, message: `Imported ${n} engagement models.` };
  } catch (e) {
    return { ok: false, message: `Could not import: ${dbMessage(e)}` };
  }
}

export async function setEngagementModelPublishedAction(slug: string, published: boolean): Promise<ActionResult> {
  slug = String(slug);
  published = published === true;
  await requireAdmin("engagement");
  if (!hasDatabaseUrl()) return { ok: false, message: NO_DB };
  try {
    await setEngagementModelPublished(String(slug), Boolean(published));
  } catch (e) {
    return { ok: false, message: `Could not update: ${dbMessage(e)}` };
  }
  refreshPublicSite();
  return { ok: true };
}

export async function reorderEngagementModelsAction(slugs: string[]): Promise<ActionResult> {
  await requireAdmin("engagement");
  if (!hasDatabaseUrl()) return { ok: false, message: NO_DB };
  if (!Array.isArray(slugs) || slugs.some((s) => typeof s !== "string")) {
    return { ok: false, message: "Invalid order." };
  }
  try {
    const ok = await reorderEngagementModels(slugs);
    if (!ok) return { ok: false, message: "The list changed in another tab. Reload and try again." };
  } catch (e) {
    return { ok: false, message: `Could not reorder: ${dbMessage(e)}` };
  }
  refreshPublicSite();
  return { ok: true };
}

export async function deleteEngagementModelAction(slug: string): Promise<ActionResult> {
  slug = String(slug);
  await requireAdmin("engagement");
  if (!hasDatabaseUrl()) return { ok: false, message: NO_DB };
  try {
    await deleteEngagementModel(String(slug));
  } catch (e) {
    return { ok: false, message: `Could not delete: ${dbMessage(e)}` };
  }
  refreshPublicSite();
  return { ok: true };
}
