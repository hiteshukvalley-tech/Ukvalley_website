"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin-session";
import { hasDatabaseUrl } from "@/lib/db/client";
import {
  TEAM_TAG, createTeamMember, deleteTeamMember, importBuiltInTeam, reorderTeam, setTeamPublished, updateTeamMember,
} from "@/lib/team-store";
import {
  readTeamValues, validateTeam, type TeamValues, type FieldErrors,
} from "@/lib/team-validation";

export type TeamFormState = {
  status?: "saved" | "error";
  message?: string;
  errors?: FieldErrors;
  /** Echoed back so the form keeps what the user typed after a failed save. */
  values?: TeamValues;
  /** Bumps on every result so the form can re-key and show fresh values. */
  nonce?: number;
};

export type ActionResult = { ok: boolean; message?: string };

const NO_DB = "Database is not connected (MONGODB_URI missing).";
const dbMessage = (e: unknown) => (e instanceof Error ? e.message : "database error");

function refreshPublicSite() {
  revalidateTag(TEAM_TAG, { expire: 0 });
  revalidatePath("/", "layout");
  revalidatePath("/admin/team");
}

export async function createTeamAction(_prev: TeamFormState, formData: FormData): Promise<TeamFormState> {
  await requireAdmin();
  const values = readTeamValues(formData);
  const nonce = Date.now();

  const result = validateTeam(values);
  if (!result.ok) {
    return { status: "error", message: "Please fix the highlighted fields.", errors: result.errors, values, nonce };
  }
  if (!hasDatabaseUrl()) return { status: "error", message: NO_DB, values, nonce };

  try {
    await createTeamMember(result.value);
  } catch (e) {
    return { status: "error", message: `Could not save: ${dbMessage(e)}`, values, nonce };
  }
  refreshPublicSite();
  redirect("/admin/team?saved=created");
}

export async function updateTeamAction(
  slug: string,
  _prev: TeamFormState,
  formData: FormData
): Promise<TeamFormState> {
  slug = String(slug);
  await requireAdmin();
  const values = readTeamValues(formData);
  const nonce = Date.now();

  const result = validateTeam(values);
  if (!result.ok) {
    return { status: "error", message: "Please fix the highlighted fields.", errors: result.errors, values, nonce };
  }
  if (!hasDatabaseUrl()) return { status: "error", message: NO_DB, values, nonce };

  try {
    const found = await updateTeamMember(slug, result.value);
    if (!found) return { status: "error", message: "This member no longer exists.", values, nonce };
  } catch (e) {
    return { status: "error", message: `Could not save: ${dbMessage(e)}`, values, nonce };
  }
  refreshPublicSite();
  return { status: "saved", message: "Member saved. The live site is updating.", values, nonce };
}

export async function importTeamAction(): Promise<ActionResult> {
  await requireAdmin();
  if (!hasDatabaseUrl()) return { ok: false, message: NO_DB };
  try {
    const n = await importBuiltInTeam();
    if (n === 0) return { ok: false, message: "Team members already exist in the database." };
    refreshPublicSite();
    return { ok: true, message: `Imported ${n} team members.` };
  } catch (e) {
    return { ok: false, message: `Could not import: ${dbMessage(e)}` };
  }
}

export async function setTeamPublishedAction(slug: string, published: boolean): Promise<ActionResult> {
  slug = String(slug);
  published = published === true;
  await requireAdmin();
  if (!hasDatabaseUrl()) return { ok: false, message: NO_DB };
  try {
    await setTeamPublished(String(slug), Boolean(published));
  } catch (e) {
    return { ok: false, message: `Could not update: ${dbMessage(e)}` };
  }
  refreshPublicSite();
  return { ok: true };
}

export async function reorderTeamAction(slugs: string[]): Promise<ActionResult> {
  await requireAdmin();
  if (!hasDatabaseUrl()) return { ok: false, message: NO_DB };
  if (!Array.isArray(slugs) || slugs.some((s) => typeof s !== "string")) {
    return { ok: false, message: "Invalid order." };
  }
  try {
    const ok = await reorderTeam(slugs);
    if (!ok) return { ok: false, message: "The list changed in another tab. Reload and try again." };
  } catch (e) {
    return { ok: false, message: `Could not reorder: ${dbMessage(e)}` };
  }
  refreshPublicSite();
  return { ok: true };
}

export async function deleteTeamAction(slug: string): Promise<ActionResult> {
  slug = String(slug);
  await requireAdmin();
  if (!hasDatabaseUrl()) return { ok: false, message: NO_DB };
  try {
    await deleteTeamMember(String(slug));
  } catch (e) {
    return { ok: false, message: `Could not delete: ${dbMessage(e)}` };
  }
  refreshPublicSite();
  return { ok: true };
}
