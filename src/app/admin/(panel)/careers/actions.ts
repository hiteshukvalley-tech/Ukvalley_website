"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin-session";
import { hasDatabaseUrl } from "@/lib/db/client";
import {
  CAREERS_TAG, createCareer, deleteCareer, getCareerForAdmin, purgeRecycledCareer, restoreCareer, importBuiltInCareers, listCareersForAdmin, reorderCareers,
  setCareerPublished, updateCareer,
} from "@/lib/careers-store";
import { renameApplicationsPosition } from "@/lib/applications-store";
import {
  readCareerValues, validateCareer, type CareerValues, type FieldErrors,
} from "@/lib/careers-validation";
import { slugifyRole } from "@/lib/careers-shared";

export type CareerFormState = {
  status?: "saved" | "error";
  message?: string;
  errors?: FieldErrors;
  /** Echoed back so the form keeps what the user typed after a failed save. */
  values?: CareerValues;
  /** Bumps on every result so the form can re-key and show fresh values. */
  nonce?: number;
};

export type ActionResult = { ok: boolean; message?: string };

const NO_DB = "Database is not connected (MONGODB_URI missing).";
const dbMessage = (e: unknown) => (e instanceof Error ? e.message : "database error");

function refreshPublicSite() {
  revalidateTag(CAREERS_TAG, { expire: 0 });
  revalidatePath("/", "layout");
  revalidatePath("/admin/careers");
  revalidatePath("/admin/careers/recycle");
}

export async function createCareerAction(_prev: CareerFormState, formData: FormData): Promise<CareerFormState> {
  await requireAdmin("careers");
  const values = readCareerValues(formData);
  // Slug left blank: make it from the role name (a taken one gets -2, -3 … in createCareer).
  // No role name either: the slug becomes "untitled-role" (the role's default name).
  const derivedSlug = !values.slug;
  if (derivedSlug) values.slug = slugifyRole(values.role || "Untitled role");
  const nonce = Date.now();

  const result = validateCareer(values, { requireSlug: true });
  if (!result.ok) {
    return { status: "error", message: "Please fix the highlighted fields.", errors: result.errors, values, nonce };
  }
  if (!hasDatabaseUrl()) return { status: "error", message: NO_DB, values, nonce };

  try {
    const created = await createCareer(result.value, { autoSuffix: derivedSlug });
    if (!created) {
      return {
        status: "error",
        message: "Please fix the highlighted fields.",
        errors: { slug: "A role with this slug already exists." },
        values,
        nonce,
      };
    }
  } catch (e) {
    return { status: "error", message: `Could not save: ${dbMessage(e)}`, values, nonce };
  }
  refreshPublicSite();
  redirect("/admin/careers?saved=created");
}

export async function updateCareerAction(
  slug: string,
  _prev: CareerFormState,
  formData: FormData
): Promise<CareerFormState> {
  slug = String(slug);
  await requireAdmin("careers");
  // The slug is the record id and cannot be changed, so never trust the form's copy.
  const values = { ...readCareerValues(formData), slug };
  const nonce = Date.now();

  const result = validateCareer(values, { requireSlug: false });
  if (!result.ok) {
    return { status: "error", message: "Please fix the highlighted fields.", errors: result.errors, values, nonce };
  }
  if (!hasDatabaseUrl()) return { status: "error", message: NO_DB, values, nonce };

  let moved = 0;
  try {
    const before = await getCareerForAdmin(slug);
    const found = await updateCareer(result.value);
    if (!found) return { status: "error", message: "This role no longer exists.", values, nonce };
    // Renamed: this same role keeps its applications under the new name (they
    // store the name), unless another role still has the old one.
    const norm = (s: string) => s.replace(/\s+/g, " ").trim().toLowerCase();
    if (before && before.role !== result.value.role) {
      const { items } = await listCareersForAdmin();
      const oldNameInUse = items.some((c) => c.slug !== slug && norm(c.role) === norm(before.role));
      if (!oldNameInUse) moved = await renameApplicationsPosition(before.role, result.value.role);
    }
  } catch (e) {
    return { status: "error", message: `Could not save: ${dbMessage(e)}`, values, nonce };
  }
  refreshPublicSite();
  const message = moved
    ? `Role saved. Its ${moved} ${moved === 1 ? "application moves" : "applications move"} to the new name. The live site is updating.`
    : "Role saved. The live site is updating.";
  return { status: "saved", message, values, nonce };
}

export async function importCareersAction(): Promise<ActionResult> {
  await requireAdmin("careers");
  if (!hasDatabaseUrl()) return { ok: false, message: NO_DB };
  try {
    const n = await importBuiltInCareers();
    if (n === 0) return { ok: false, message: "Open roles already exist in the database." };
    refreshPublicSite();
    return { ok: true, message: `Imported ${n} open roles.` };
  } catch (e) {
    return { ok: false, message: `Could not import: ${dbMessage(e)}` };
  }
}

export async function setCareerPublishedAction(slug: string, published: boolean): Promise<ActionResult> {
  slug = String(slug);
  published = published === true;
  await requireAdmin("careers");
  if (!hasDatabaseUrl()) return { ok: false, message: NO_DB };
  try {
    await setCareerPublished(String(slug), Boolean(published));
  } catch (e) {
    return { ok: false, message: `Could not update: ${dbMessage(e)}` };
  }
  refreshPublicSite();
  return { ok: true };
}

export async function reorderCareersAction(slugs: string[]): Promise<ActionResult> {
  await requireAdmin("careers");
  if (!hasDatabaseUrl()) return { ok: false, message: NO_DB };
  if (!Array.isArray(slugs) || slugs.some((s) => typeof s !== "string")) {
    return { ok: false, message: "Invalid order." };
  }
  try {
    const ok = await reorderCareers(slugs);
    if (!ok) return { ok: false, message: "The list changed in another tab. Reload and try again." };
  } catch (e) {
    return { ok: false, message: `Could not reorder: ${dbMessage(e)}` };
  }
  refreshPublicSite();
  return { ok: true };
}

/** Delete: the role moves to Recycle openings (it can be restored there). */
export async function deleteCareerAction(slug: string): Promise<ActionResult> {
  slug = String(slug);
  const user = await requireAdmin("careers");
  if (!hasDatabaseUrl()) return { ok: false, message: NO_DB };
  try {
    await deleteCareer(slug, user.email);
  } catch (e) {
    return { ok: false, message: `Could not delete: ${dbMessage(e)}` };
  }
  refreshPublicSite();
  return { ok: true };
}

/** Recycle openings → Restore: the role is back in Careers, as it was. */
export async function restoreCareerAction(id: string): Promise<ActionResult> {
  id = String(id);
  await requireAdmin("careers");
  if (!hasDatabaseUrl()) return { ok: false, message: NO_DB };
  try {
    const slug = await restoreCareer(id);
    if (!slug) return { ok: false, message: "This role is no longer in Recycle openings." };
  } catch (e) {
    return { ok: false, message: `Could not restore: ${dbMessage(e)}` };
  }
  refreshPublicSite();
  return { ok: true };
}

/** Recycle openings → Delete forever. */
export async function purgeCareerAction(id: string): Promise<ActionResult> {
  id = String(id);
  await requireAdmin("careers");
  if (!hasDatabaseUrl()) return { ok: false, message: NO_DB };
  try {
    await purgeRecycledCareer(id);
  } catch (e) {
    return { ok: false, message: `Could not delete: ${dbMessage(e)}` };
  }
  refreshPublicSite();
  return { ok: true };
}
