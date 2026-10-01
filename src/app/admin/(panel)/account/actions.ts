"use server";

import { ENV_USER_ID } from "@/lib/admin-auth";
import { requireAdmin, setSessionCookie } from "@/lib/admin-session";
import { hasDatabaseUrl } from "@/lib/db/client";
import { changePassword, checkUserPassword } from "@/lib/users-store";
import { passwordError } from "@/lib/users-validation";

export type PasswordFormState = {
  status?: "saved" | "error";
  message?: string;
  errors?: Record<string, string>;
  /** Bumps on every result so the form remounts with empty fields. */
  nonce?: number;
};

export async function changePasswordAction(
  _prev: PasswordFormState,
  formData: FormData
): Promise<PasswordFormState> {
  const session = await requireAdmin();
  const nonce = Date.now();

  if (session.id === ENV_USER_ID) {
    return { status: "error", message: "The owner password is set by ADMIN_PASSWORD in the environment.", nonce };
  }
  if (!hasDatabaseUrl()) return { status: "error", message: "Database is not connected (MONGODB_URI missing).", nonce };

  // Passwords are taken exactly as typed — no trimming.
  const current = String(formData.get("current") ?? "");
  const next = String(formData.get("next") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  const errors: Record<string, string> = {};
  if (!current) errors.current = "Enter your current password.";
  const policy = passwordError(next, session.email);
  if (policy) errors.next = policy;
  else if (next === current) errors.next = "Choose a password different from the current one.";
  if (next !== confirm) errors.confirm = "The two passwords don't match.";
  if (Object.keys(errors).length) {
    return { status: "error", message: "Please fix the highlighted fields.", errors, nonce };
  }

  try {
    if (!(await checkUserPassword(session.id, current))) {
      return {
        status: "error",
        message: "Please fix the highlighted fields.",
        errors: { current: "That isn't your current password." },
        nonce,
      };
    }
    const sv = await changePassword(session.id, next);
    if (sv === null) return { status: "error", message: "Your account no longer exists.", nonce };
    // The change signs out every session; issue this browser a fresh one.
    await setSessionCookie({ ...session, sv });
  } catch (e) {
    return { status: "error", message: `Could not save: ${e instanceof Error ? e.message : "database error"}`, nonce };
  }
  return { status: "saved", message: "Password changed. Your other sessions were signed out.", nonce };
}
