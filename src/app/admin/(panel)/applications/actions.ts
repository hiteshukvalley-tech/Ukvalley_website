"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin-session";
import { hasDatabaseUrl } from "@/lib/db/client";
import { deleteApplication, updateApplication } from "@/lib/applications-store";
import { isApplicationStatus, type ApplicationStatus } from "@/lib/applications-validation";

export type ApplicationFormState = {
  status?: "saved" | "error";
  message?: string;
  errors?: Record<string, string>;
  values?: { status: string; note: string };
  nonce?: number;
};

export type ActionResult = { ok: boolean; message?: string };

const NO_DB = "Database is not connected (MONGODB_URI missing).";
const dbMessage = (e: unknown) => (e instanceof Error ? e.message : "database error");
const NOTE_MAX = 2000;

function refresh(id?: string) {
  revalidatePath("/admin/applications");
  if (id) revalidatePath(`/admin/applications/${id}`);
  revalidatePath("/admin");
}

export async function updateApplicationAction(
  id: string,
  _prev: ApplicationFormState,
  formData: FormData
): Promise<ApplicationFormState> {
  id = String(id);
  await requireAdmin("applications");
  const status = String(formData.get("status") ?? "");
  const note = String(formData.get("note") ?? "").trim();
  const values = { status, note };
  const nonce = Date.now();

  const errors: Record<string, string> = {};
  if (!isApplicationStatus(status)) errors.status = "Choose one of the listed statuses.";
  if (note.length > NOTE_MAX) errors.note = `Note must be ${NOTE_MAX} characters or fewer.`;
  if (Object.keys(errors).length) {
    return { status: "error", message: "Please fix the highlighted fields.", errors, values, nonce };
  }
  if (!hasDatabaseUrl()) return { status: "error", message: NO_DB, values, nonce };

  try {
    const found = await updateApplication(id, { status: status as ApplicationStatus, note });
    if (!found) return { status: "error", message: "This application no longer exists.", values, nonce };
  } catch (e) {
    return { status: "error", message: `Could not save: ${dbMessage(e)}`, values, nonce };
  }
  refresh(id);
  return { status: "saved", message: "Application updated.", values, nonce };
}

export async function deleteApplicationAction(id: string): Promise<ActionResult> {
  id = String(id);
  await requireAdmin("applications");
  if (!hasDatabaseUrl()) return { ok: false, message: NO_DB };
  try {
    await deleteApplication(id);
  } catch (e) {
    return { ok: false, message: `Could not delete: ${dbMessage(e)}` };
  }
  refresh();
  redirect("/admin/applications?saved=deleted");
}
