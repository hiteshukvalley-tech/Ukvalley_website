"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin-session";
import { hasDatabaseUrl } from "@/lib/db/client";
import { deleteLead, isLeadStatus, updateLead, type LeadStatus } from "@/lib/leads-store";

export type LeadFormState = {
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
  revalidatePath("/admin/leads");
  if (id) revalidatePath(`/admin/leads/${id}`);
  revalidatePath("/admin");
}

export async function updateLeadAction(
  id: string,
  _prev: LeadFormState,
  formData: FormData
): Promise<LeadFormState> {
  id = String(id);
  await requireAdmin("leads");
  const status = String(formData.get("status") ?? "");
  const note = String(formData.get("note") ?? "").trim();
  const values = { status, note };
  const nonce = Date.now();

  const errors: Record<string, string> = {};
  if (!isLeadStatus(status)) errors.status = "Choose one of the listed statuses.";
  if (note.length > NOTE_MAX) errors.note = `Note must be ${NOTE_MAX} characters or fewer.`;
  if (Object.keys(errors).length) {
    return { status: "error", message: "Please fix the highlighted fields.", errors, values, nonce };
  }
  if (!hasDatabaseUrl()) return { status: "error", message: NO_DB, values, nonce };

  try {
    const found = await updateLead(id, { status: status as LeadStatus, note });
    if (!found) return { status: "error", message: "This lead no longer exists.", values, nonce };
  } catch (e) {
    return { status: "error", message: `Could not save: ${dbMessage(e)}`, values, nonce };
  }
  refresh(id);
  return { status: "saved", message: "Lead updated.", values, nonce };
}

export async function deleteLeadAction(id: string): Promise<ActionResult> {
  id = String(id);
  await requireAdmin("leads");
  if (!hasDatabaseUrl()) return { ok: false, message: NO_DB };
  try {
    await deleteLead(String(id));
  } catch (e) {
    return { ok: false, message: `Could not delete: ${dbMessage(e)}` };
  }
  refresh();
  redirect("/admin/leads?saved=deleted");
}
