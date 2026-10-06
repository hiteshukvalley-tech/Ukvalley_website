"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin-session";
import { hasDatabaseUrl } from "@/lib/db/client";
import {
  CASES_TAG, createCase, deleteCase, importBuiltInCases, reorderCases, setCasePublished, updateCase,
} from "@/lib/cases-store";
import {
  readCaseValues, validateCase, type CaseValues, type FieldErrors,
} from "@/lib/cases-validation";

export type CaseFormState = {
  status?: "saved" | "error";
  message?: string;
  errors?: FieldErrors;
  /** Echoed back so the form keeps what the user typed after a failed save. */
  values?: CaseValues;
  /** Bumps on every result so the form can re-key and show fresh values. */
  nonce?: number;
};

export type ActionResult = { ok: boolean; message?: string };

const NO_DB = "Database is not connected (MONGODB_URI missing).";
const dbMessage = (e: unknown) => (e instanceof Error ? e.message : "database error");

function refreshPublicSite() {
  revalidateTag(CASES_TAG, { expire: 0 });
  revalidatePath("/", "layout");
  revalidatePath("/admin/case-studies");
}

export async function createCaseAction(_prev: CaseFormState, formData: FormData): Promise<CaseFormState> {
  await requireAdmin("case-studies");
  const values = readCaseValues(formData);
  const nonce = Date.now();

  const result = validateCase(values, { requireSlug: true });
  if (!result.ok) {
    return { status: "error", message: "Please fix the highlighted fields.", errors: result.errors, values, nonce };
  }
  if (!hasDatabaseUrl()) return { status: "error", message: NO_DB, values, nonce };

  try {
    const created = await createCase(result.value);
    if (!created) {
      return {
        status: "error",
        message: "Please fix the highlighted fields.",
        errors: { slug: "A case study with this slug already exists." },
        values,
        nonce,
      };
    }
  } catch (e) {
    return { status: "error", message: `Could not save: ${dbMessage(e)}`, values, nonce };
  }
  refreshPublicSite();
  redirect("/admin/case-studies?saved=created");
}

export async function updateCaseAction(
  slug: string,
  _prev: CaseFormState,
  formData: FormData
): Promise<CaseFormState> {
  slug = String(slug);
  await requireAdmin("case-studies");
  // The slug is the record id and cannot be changed, so never trust the form's copy.
  const values = { ...readCaseValues(formData), slug };
  const nonce = Date.now();

  const result = validateCase(values, { requireSlug: false });
  if (!result.ok) {
    return { status: "error", message: "Please fix the highlighted fields.", errors: result.errors, values, nonce };
  }
  if (!hasDatabaseUrl()) return { status: "error", message: NO_DB, values, nonce };

  try {
    const found = await updateCase(result.value);
    if (!found) return { status: "error", message: "This case study no longer exists.", values, nonce };
  } catch (e) {
    return { status: "error", message: `Could not save: ${dbMessage(e)}`, values, nonce };
  }
  refreshPublicSite();
  return { status: "saved", message: "Case study saved. The live site is updating.", values, nonce };
}

export async function importCasesAction(): Promise<ActionResult> {
  await requireAdmin("case-studies");
  if (!hasDatabaseUrl()) return { ok: false, message: NO_DB };
  try {
    const n = await importBuiltInCases();
    if (n === 0) return { ok: false, message: "Case studies already exist in the database." };
    refreshPublicSite();
    return { ok: true, message: `Imported ${n} case studies.` };
  } catch (e) {
    return { ok: false, message: `Could not import: ${dbMessage(e)}` };
  }
}

export async function setCasePublishedAction(slug: string, published: boolean): Promise<ActionResult> {
  slug = String(slug);
  published = published === true;
  await requireAdmin("case-studies");
  if (!hasDatabaseUrl()) return { ok: false, message: NO_DB };
  try {
    await setCasePublished(String(slug), Boolean(published));
  } catch (e) {
    return { ok: false, message: `Could not update: ${dbMessage(e)}` };
  }
  refreshPublicSite();
  return { ok: true };
}

export async function reorderCasesAction(slugs: string[]): Promise<ActionResult> {
  await requireAdmin("case-studies");
  if (!hasDatabaseUrl()) return { ok: false, message: NO_DB };
  if (!Array.isArray(slugs) || slugs.some((s) => typeof s !== "string")) {
    return { ok: false, message: "Invalid order." };
  }
  try {
    const ok = await reorderCases(slugs);
    if (!ok) return { ok: false, message: "The list changed in another tab. Reload and try again." };
  } catch (e) {
    return { ok: false, message: `Could not reorder: ${dbMessage(e)}` };
  }
  refreshPublicSite();
  return { ok: true };
}

export async function deleteCaseAction(slug: string): Promise<ActionResult> {
  slug = String(slug);
  await requireAdmin("case-studies");
  if (!hasDatabaseUrl()) return { ok: false, message: NO_DB };
  try {
    await deleteCase(String(slug));
  } catch (e) {
    return { ok: false, message: `Could not delete: ${dbMessage(e)}` };
  }
  refreshPublicSite();
  return { ok: true };
}
