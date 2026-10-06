"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin-session";
import { hasDatabaseUrl } from "@/lib/db/client";
import { getServices } from "@/lib/services-store";
import { getIndustries } from "@/lib/industries-store";
import {
  SOLUTIONS_TAG, createSolution, deleteSolution, importBuiltInSolutions, reorderSolutions, setSolutionPublished, updateSolution,
} from "@/lib/solutions-store";
import {
  readSolutionValues, validateSolution, type SolutionValues, type FieldErrors,
} from "@/lib/solutions-validation";

export type SolutionFormState = {
  status?: "saved" | "error";
  message?: string;
  errors?: FieldErrors;
  /** Echoed back so the form keeps what the user typed after a failed save. */
  values?: SolutionValues;
  /** Bumps on every result so the form can re-key and show fresh values. */
  nonce?: number;
};

export type ActionResult = { ok: boolean; message?: string };

/** The slugs a solution may link to, so a form can't save a broken relation. */
async function relationSlugs() {
  return {
    serviceSlugs: (await getServices()).map((s) => s.href.split("/").pop() ?? ""),
    industrySlugs: (await getIndustries()).map((i) => i.slug),
  };
}

const NO_DB = "Database is not connected (MONGODB_URI missing).";
const dbMessage = (e: unknown) => (e instanceof Error ? e.message : "database error");

function refreshPublicSite() {
  revalidateTag(SOLUTIONS_TAG, { expire: 0 });
  revalidatePath("/", "layout");
  revalidatePath("/admin/solutions");
}

export async function createSolutionAction(_prev: SolutionFormState, formData: FormData): Promise<SolutionFormState> {
  await requireAdmin("solutions");
  const values = readSolutionValues(formData);
  const nonce = Date.now();

  const result = validateSolution(values, { requireSlug: true, ...(await relationSlugs()) });
  if (!result.ok) {
    return { status: "error", message: "Please fix the highlighted fields.", errors: result.errors, values, nonce };
  }
  if (!hasDatabaseUrl()) return { status: "error", message: NO_DB, values, nonce };

  try {
    const created = await createSolution(result.value);
    if (!created) {
      return {
        status: "error",
        message: "Please fix the highlighted fields.",
        errors: { slug: "A solution with this slug already exists." },
        values,
        nonce,
      };
    }
  } catch (e) {
    return { status: "error", message: `Could not save: ${dbMessage(e)}`, values, nonce };
  }
  refreshPublicSite();
  redirect("/admin/solutions?saved=created");
}

export async function updateSolutionAction(
  slug: string,
  _prev: SolutionFormState,
  formData: FormData
): Promise<SolutionFormState> {
  slug = String(slug);
  await requireAdmin("solutions");
  // The slug is the record id and cannot be changed, so never trust the form's copy.
  const values = { ...readSolutionValues(formData), slug };
  const nonce = Date.now();

  const result = validateSolution(values, { requireSlug: false, ...(await relationSlugs()) });
  if (!result.ok) {
    return { status: "error", message: "Please fix the highlighted fields.", errors: result.errors, values, nonce };
  }
  if (!hasDatabaseUrl()) return { status: "error", message: NO_DB, values, nonce };

  try {
    const found = await updateSolution(result.value);
    if (!found) return { status: "error", message: "This solution no longer exists.", values, nonce };
  } catch (e) {
    return { status: "error", message: `Could not save: ${dbMessage(e)}`, values, nonce };
  }
  refreshPublicSite();
  return { status: "saved", message: "Solution saved. The live site is updating.", values, nonce };
}

export async function importSolutionsAction(): Promise<ActionResult> {
  await requireAdmin("solutions");
  if (!hasDatabaseUrl()) return { ok: false, message: NO_DB };
  try {
    const n = await importBuiltInSolutions();
    if (n === 0) return { ok: false, message: "Solutions already exist in the database." };
    refreshPublicSite();
    return { ok: true, message: `Imported ${n} solutions.` };
  } catch (e) {
    return { ok: false, message: `Could not import: ${dbMessage(e)}` };
  }
}

export async function setSolutionPublishedAction(slug: string, published: boolean): Promise<ActionResult> {
  slug = String(slug);
  published = published === true;
  await requireAdmin("solutions");
  if (!hasDatabaseUrl()) return { ok: false, message: NO_DB };
  try {
    await setSolutionPublished(String(slug), Boolean(published));
  } catch (e) {
    return { ok: false, message: `Could not update: ${dbMessage(e)}` };
  }
  refreshPublicSite();
  return { ok: true };
}

export async function reorderSolutionsAction(slugs: string[]): Promise<ActionResult> {
  await requireAdmin("solutions");
  if (!hasDatabaseUrl()) return { ok: false, message: NO_DB };
  if (!Array.isArray(slugs) || slugs.some((s) => typeof s !== "string")) {
    return { ok: false, message: "Invalid order." };
  }
  try {
    const ok = await reorderSolutions(slugs);
    if (!ok) return { ok: false, message: "The list changed in another tab. Reload and try again." };
  } catch (e) {
    return { ok: false, message: `Could not reorder: ${dbMessage(e)}` };
  }
  refreshPublicSite();
  return { ok: true };
}

export async function deleteSolutionAction(slug: string): Promise<ActionResult> {
  slug = String(slug);
  await requireAdmin("solutions");
  if (!hasDatabaseUrl()) return { ok: false, message: NO_DB };
  try {
    await deleteSolution(String(slug));
  } catch (e) {
    return { ok: false, message: `Could not delete: ${dbMessage(e)}` };
  }
  refreshPublicSite();
  return { ok: true };
}
