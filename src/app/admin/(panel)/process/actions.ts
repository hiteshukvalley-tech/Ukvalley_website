"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin-session";
import { hasDatabaseUrl } from "@/lib/db/client";
import {
  PROCESS_TAG, createProcessStep, deleteProcessStep, importBuiltInProcessSteps, reorderProcessSteps, setProcessStepPublished, updateProcessStep,
} from "@/lib/process-store";
import {
  readProcessStepValues, validateProcessStep, type ProcessStepValues, type FieldErrors,
} from "@/lib/process-validation";

export type ProcessStepFormState = {
  status?: "saved" | "error";
  message?: string;
  errors?: FieldErrors;
  /** Echoed back so the form keeps what the user typed after a failed save. */
  values?: ProcessStepValues;
  /** Bumps on every result so the form can re-key and show fresh values. */
  nonce?: number;
};

export type ActionResult = { ok: boolean; message?: string };

const NO_DB = "Database is not connected (MONGODB_URI missing).";
const dbMessage = (e: unknown) => (e instanceof Error ? e.message : "database error");

function refreshPublicSite() {
  revalidateTag(PROCESS_TAG, { expire: 0 });
  revalidatePath("/", "layout");
  revalidatePath("/admin/process");
}

export async function createProcessStepAction(_prev: ProcessStepFormState, formData: FormData): Promise<ProcessStepFormState> {
  await requireAdmin("process");
  const values = readProcessStepValues(formData);
  const nonce = Date.now();

  const result = validateProcessStep(values);
  if (!result.ok) {
    return { status: "error", message: "Please fix the highlighted fields.", errors: result.errors, values, nonce };
  }
  if (!hasDatabaseUrl()) return { status: "error", message: NO_DB, values, nonce };

  try {
    await createProcessStep(result.value);
  } catch (e) {
    return { status: "error", message: `Could not save: ${dbMessage(e)}`, values, nonce };
  }
  refreshPublicSite();
  redirect("/admin/process?saved=created");
}

export async function updateProcessStepAction(
  slug: string,
  _prev: ProcessStepFormState,
  formData: FormData
): Promise<ProcessStepFormState> {
  slug = String(slug);
  await requireAdmin("process");
  const values = readProcessStepValues(formData);
  const nonce = Date.now();

  const result = validateProcessStep(values);
  if (!result.ok) {
    return { status: "error", message: "Please fix the highlighted fields.", errors: result.errors, values, nonce };
  }
  if (!hasDatabaseUrl()) return { status: "error", message: NO_DB, values, nonce };

  try {
    const found = await updateProcessStep(slug, result.value);
    if (!found) return { status: "error", message: "This step no longer exists.", values, nonce };
  } catch (e) {
    return { status: "error", message: `Could not save: ${dbMessage(e)}`, values, nonce };
  }
  refreshPublicSite();
  return { status: "saved", message: "Step saved. The live site is updating.", values, nonce };
}

export async function importProcessStepsAction(): Promise<ActionResult> {
  await requireAdmin("process");
  if (!hasDatabaseUrl()) return { ok: false, message: NO_DB };
  try {
    const n = await importBuiltInProcessSteps();
    if (n === 0) return { ok: false, message: "Process steps already exist in the database." };
    refreshPublicSite();
    return { ok: true, message: `Imported ${n} process steps.` };
  } catch (e) {
    return { ok: false, message: `Could not import: ${dbMessage(e)}` };
  }
}

export async function setProcessStepPublishedAction(slug: string, published: boolean): Promise<ActionResult> {
  slug = String(slug);
  published = published === true;
  await requireAdmin("process");
  if (!hasDatabaseUrl()) return { ok: false, message: NO_DB };
  try {
    await setProcessStepPublished(String(slug), Boolean(published));
  } catch (e) {
    return { ok: false, message: `Could not update: ${dbMessage(e)}` };
  }
  refreshPublicSite();
  return { ok: true };
}

export async function reorderProcessStepsAction(slugs: string[]): Promise<ActionResult> {
  await requireAdmin("process");
  if (!hasDatabaseUrl()) return { ok: false, message: NO_DB };
  if (!Array.isArray(slugs) || slugs.some((s) => typeof s !== "string")) {
    return { ok: false, message: "Invalid order." };
  }
  try {
    const ok = await reorderProcessSteps(slugs);
    if (!ok) return { ok: false, message: "The list changed in another tab. Reload and try again." };
  } catch (e) {
    return { ok: false, message: `Could not reorder: ${dbMessage(e)}` };
  }
  refreshPublicSite();
  return { ok: true };
}

export async function deleteProcessStepAction(slug: string): Promise<ActionResult> {
  slug = String(slug);
  await requireAdmin("process");
  if (!hasDatabaseUrl()) return { ok: false, message: NO_DB };
  try {
    await deleteProcessStep(String(slug));
  } catch (e) {
    return { ok: false, message: `Could not delete: ${dbMessage(e)}` };
  }
  refreshPublicSite();
  return { ok: true };
}
