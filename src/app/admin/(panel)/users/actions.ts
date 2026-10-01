"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { envUser } from "@/lib/admin-auth";
import { requireRole } from "@/lib/admin-session";
import { hasDatabaseUrl } from "@/lib/db/client";
import { countOtherActiveAdmins, createUser, deleteUser, findUser, updateUser } from "@/lib/users-store";
import { readUserValues, validateUser, type FieldErrors, type UserValues } from "@/lib/users-validation";

export type UserFormState = {
  status?: "saved" | "error";
  message?: string;
  errors?: FieldErrors;
  /** Echoed back so the form keeps what was typed. The password is never echoed. */
  values?: UserValues;
  nonce?: number;
};

export type ActionResult = { ok: boolean; message?: string };

const NO_DB = "Database is not connected (MONGODB_URI missing).";
const dbMessage = (e: unknown) => (e instanceof Error ? e.message : "database error");

function refresh() {
  revalidatePath("/admin/users");
}

/**
 * True when removing this user's admin access (deleting, disabling or
 * demoting them) would leave nobody able to manage users: no other active
 * admin and no owner account configured in the environment.
 */
async function wouldLockOutAdmins(id: string): Promise<boolean> {
  if (envUser()) return false;
  return (await countOtherActiveAdmins(id)) === 0;
}

export async function createUserAction(_prev: UserFormState, formData: FormData): Promise<UserFormState> {
  await requireRole("admin");
  const values = { ...readUserValues(formData), password: "" };
  const nonce = Date.now();
  const raw = readUserValues(formData);

  const result = validateUser(raw, { isNew: true });
  if (!result.ok) {
    return { status: "error", message: "Please fix the highlighted fields.", errors: result.errors, values, nonce };
  }
  if (!hasDatabaseUrl()) return { status: "error", message: NO_DB, values, nonce };

  // The env owner's email is taken too — a database user can't shadow it.
  if (envUser()?.email === result.value.email) {
    return {
      status: "error",
      message: "Please fix the highlighted fields.",
      errors: { email: "This email is the owner account set in the environment." },
      values, nonce,
    };
  }

  try {
    const outcome = await createUser({ ...result.value, password: raw.password });
    if (outcome === "exists") {
      return {
        status: "error",
        message: "Please fix the highlighted fields.",
        errors: { email: "A user with this email already exists." },
        values, nonce,
      };
    }
  } catch (e) {
    return { status: "error", message: `Could not save: ${dbMessage(e)}`, values, nonce };
  }
  refresh();
  redirect("/admin/users?saved=created");
}

export async function updateUserAction(
  id: string,
  _prev: UserFormState,
  formData: FormData
): Promise<UserFormState> {
  id = String(id);
  const session = await requireRole("admin");
  const raw = readUserValues(formData);
  const values = { ...raw, password: "" };
  const nonce = Date.now();

  if (!hasDatabaseUrl()) return { status: "error", message: NO_DB, values, nonce };

  let existing;
  try {
    existing = await findUser(id);
  } catch (e) {
    return { status: "error", message: `Could not save: ${dbMessage(e)}`, values, nonce };
  }
  if (!existing) return { status: "error", message: "This user no longer exists.", values, nonce };

  const result = validateUser(raw, { isNew: false, email: existing.email });
  if (!result.ok) {
    return { status: "error", message: "Please fix the highlighted fields.", errors: result.errors, values, nonce };
  }
  const { value } = result;
  const isSelf = session.id === id;

  if (isSelf && (value.role !== "admin" || !value.active)) {
    return { status: "error", message: "You can't demote or disable your own account.", values, nonce };
  }
  if (isSelf && value.password) {
    return {
      status: "error",
      message: "Please fix the highlighted fields.",
      errors: { password: "Change your own password on the Account page." },
      values, nonce,
    };
  }

  const losesAdmin = existing.role === "admin" && existing.active && (value.role !== "admin" || !value.active);
  try {
    if (losesAdmin && (await wouldLockOutAdmins(id))) {
      return { status: "error", message: "This is the last active admin. Make someone else an admin first.", values, nonce };
    }
    const found = await updateUser(id, {
      name: value.name, role: value.role, active: value.active, password: value.password,
    });
    if (!found) return { status: "error", message: "This user no longer exists.", values, nonce };
  } catch (e) {
    return { status: "error", message: `Could not save: ${dbMessage(e)}`, values, nonce };
  }
  refresh();
  return {
    status: "saved",
    message: value.password ? "User saved. The password was changed and they were signed out." : "User saved.",
    values,
    nonce,
  };
}

export async function deleteUserAction(id: string): Promise<ActionResult> {
  id = String(id);
  const session = await requireRole("admin");
  if (!hasDatabaseUrl()) return { ok: false, message: NO_DB };
  if (session.id === id) return { ok: false, message: "You can't delete your own account." };

  try {
    const existing = await findUser(id);
    if (!existing) {
      refresh();
      redirect("/admin/users?saved=deleted");
    }
    if (existing.role === "admin" && existing.active && (await wouldLockOutAdmins(id))) {
      return { ok: false, message: "This is the last active admin. Make someone else an admin first." };
    }
    await deleteUser(id);
  } catch (e) {
    // redirect() throws a control-flow error that must pass through.
    if (e && typeof e === "object" && "digest" in e) throw e;
    return { ok: false, message: `Could not delete: ${dbMessage(e)}` };
  }
  refresh();
  redirect("/admin/users?saved=deleted");
}
