"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin-session";
import { hasDatabaseUrl } from "@/lib/db/client";
import {
  SERVICES_TAG, createService, deleteService, importBuiltInServices,
  moveService, reorderServices, setServicePublished, updateService,
} from "@/lib/services-store";
import {
  readServiceValues, validateService,
  type FieldErrors, type ServiceValues,
} from "@/lib/services-validation";

export type ServiceFormState = {
  status?: "saved" | "error";
  message?: string;
  errors?: FieldErrors;
  /** Echoed back so the form keeps what the user typed after a failed save. */
  values?: ServiceValues;
  /** Bumps on every result so the form can re-key and show fresh values. */
  nonce?: number;
};

export type ActionResult = { ok: boolean; message?: string };

const NO_DB = "Database is not connected (MONGODB_URI missing).";
const dbMessage = (e: unknown) => (e instanceof Error ? e.message : "database error");

function refreshPublicSite() {
  revalidateTag(SERVICES_TAG, { expire: 0 });
  revalidatePath("/", "layout");
  revalidatePath("/admin/services");
}

export async function createServiceAction(
  _prev: ServiceFormState,
  formData: FormData
): Promise<ServiceFormState> {
  await requireAdmin("services");
  const values = readServiceValues(formData);
  const nonce = Date.now();

  const result = validateService(values, { requireSlug: true });
  if (!result.ok) {
    return { status: "error", message: "Please fix the highlighted fields.", errors: result.errors, values, nonce };
  }
  if (!hasDatabaseUrl()) return { status: "error", message: NO_DB, values, nonce };

  try {
    const created = await createService(result.value);
    if (!created) {
      return {
        status: "error",
        message: "Please fix the highlighted fields.",
        errors: { slug: "A service with this slug already exists." },
        values,
        nonce,
      };
    }
  } catch (e) {
    return { status: "error", message: `Could not save: ${dbMessage(e)}`, values, nonce };
  }
  refreshPublicSite();
  redirect("/admin/services?saved=created");
}

export async function updateServiceAction(
  slug: string,
  _prev: ServiceFormState,
  formData: FormData
): Promise<ServiceFormState> {
  slug = String(slug);
  await requireAdmin("services");
  // The slug is the record id and cannot be changed, so never trust the form's copy.
  const values = { ...readServiceValues(formData), slug };
  const nonce = Date.now();

  const result = validateService(values, { requireSlug: false });
  if (!result.ok) {
    return { status: "error", message: "Please fix the highlighted fields.", errors: result.errors, values, nonce };
  }
  if (!hasDatabaseUrl()) return { status: "error", message: NO_DB, values, nonce };

  try {
    const found = await updateService(result.value);
    if (!found) return { status: "error", message: "This service no longer exists.", values, nonce };
  } catch (e) {
    return { status: "error", message: `Could not save: ${dbMessage(e)}`, values, nonce };
  }
  refreshPublicSite();
  return { status: "saved", message: "Service saved. The live site is updating.", values, nonce };
}

export async function importServicesAction(): Promise<ActionResult> {
  await requireAdmin("services");
  if (!hasDatabaseUrl()) return { ok: false, message: NO_DB };
  try {
    const n = await importBuiltInServices();
    if (n === 0) return { ok: false, message: "Services already exist in the database." };
    refreshPublicSite();
    return { ok: true, message: `Imported ${n} services.` };
  } catch (e) {
    return { ok: false, message: `Could not import: ${dbMessage(e)}` };
  }
}

export async function setPublishedAction(slug: string, published: boolean): Promise<ActionResult> {
  slug = String(slug);
  published = published === true;
  await requireAdmin("services");
  if (!hasDatabaseUrl()) return { ok: false, message: NO_DB };
  try {
    await setServicePublished(slug, published);
  } catch (e) {
    return { ok: false, message: `Could not update: ${dbMessage(e)}` };
  }
  refreshPublicSite();
  return { ok: true };
}

export async function moveServiceAction(slug: string, direction: "up" | "down"): Promise<ActionResult> {
  slug = String(slug);
  await requireAdmin("services");
  if (!hasDatabaseUrl()) return { ok: false, message: NO_DB };
  try {
    await moveService(slug, direction);
  } catch (e) {
    return { ok: false, message: `Could not reorder: ${dbMessage(e)}` };
  }
  refreshPublicSite();
  return { ok: true };
}

export async function reorderServicesAction(slugs: string[]): Promise<ActionResult> {
  await requireAdmin("services");
  if (!hasDatabaseUrl()) return { ok: false, message: NO_DB };
  if (!Array.isArray(slugs) || slugs.some((s) => typeof s !== "string")) {
    return { ok: false, message: "Invalid order." };
  }
  try {
    const ok = await reorderServices(slugs);
    if (!ok) return { ok: false, message: "The list changed in another tab. Reload and try again." };
  } catch (e) {
    return { ok: false, message: `Could not reorder: ${dbMessage(e)}` };
  }
  refreshPublicSite();
  return { ok: true };
}

export async function deleteServiceAction(slug: string): Promise<ActionResult> {
  slug = String(slug);
  await requireAdmin("services");
  if (!hasDatabaseUrl()) return { ok: false, message: NO_DB };
  try {
    await deleteService(slug);
  } catch (e) {
    return { ok: false, message: `Could not delete: ${dbMessage(e)}` };
  }
  refreshPublicSite();
  return { ok: true };
}
