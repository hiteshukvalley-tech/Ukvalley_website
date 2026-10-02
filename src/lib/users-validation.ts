import { ADMIN_ROLES, type AdminRole } from "./admin-auth";
import type { FieldErrors } from "./list-utils";

export type { FieldErrors };

export const roleLabel: Record<AdminRole, string> = {
  admin: "Admin",
  editor: "Editor",
};

export const roleHelp: Record<AdminRole, string> = {
  admin: "Full access, including users and site settings.",
  editor: "Can manage all content, leads and media. Cannot manage users or site settings.",
};

export const PASSWORD_MIN = 10;
export const PASSWORD_MAX = 128;
export const EMAIL_MAX = 200;

/** Returns a message when the password is not acceptable, otherwise undefined. */
export function passwordError(password: string, email = ""): string | undefined {
  if (password.length < PASSWORD_MIN) return `Use at least ${PASSWORD_MIN} characters.`;
  if (password.length > PASSWORD_MAX) return `Use ${PASSWORD_MAX} characters or fewer.`;
  if (email && password.toLowerCase() === email.toLowerCase()) return "The password can't be the same as the email.";
  if (/^(.)\1+$/.test(password)) return "Choose a less repetitive password.";
  return undefined;
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Editable fields as the form submits them (all strings). */
export type UserValues = {
  name: string;
  email: string;
  role: string;
  /** only used to set or reset a password; never sent back to the form */
  password: string;
  /** "on" when the Active checkbox is ticked, otherwise "" */
  active: string;
};

export const emptyUserValues = (): UserValues => ({ name: "", email: "", role: "editor", password: "", active: "on" });

export function readUserValues(formData: FormData): UserValues {
  const get = (k: string) => String(formData.get(k) ?? "");
  return {
    name: get("name").trim(),
    email: get("email").trim().toLowerCase(),
    role: get("role").trim(),
    // Passwords are taken exactly as typed — no trimming.
    password: get("password"),
    active: formData.get("active") ? "on" : "",
  };
}

export type UserInput = { name: string; email: string; role: AdminRole; active: boolean; password?: string };

/**
 * Validates the create (`isNew`) or edit form. On create the password is
 * required; on edit it is optional and, when filled, resets the password.
 * The email is only checked on create — it can't be changed afterwards.
 */
export function validateUser(
  v: UserValues,
  { isNew, email }: { isNew: boolean; email?: string }
): { ok: true; value: UserInput } | { ok: false; errors: FieldErrors } {
  const e: FieldErrors = {};
  const mail = isNew ? v.email : (email ?? v.email);

  if (v.name.length < 2) e.name = "Please enter a name.";
  else if (v.name.length > 80) e.name = "Name must be 80 characters or fewer.";

  if (isNew) {
    if (!EMAIL.test(v.email) || v.email.length > EMAIL_MAX) e.email = "Enter a valid email address.";
  }
  if (!(ADMIN_ROLES as readonly string[]).includes(v.role)) e.role = "Choose one of the listed roles.";

  if (isNew || v.password) {
    const msg = v.password ? passwordError(v.password, mail) : "A password is required.";
    if (msg) e.password = msg;
  }

  if (Object.keys(e).length) return { ok: false, errors: e };
  return {
    ok: true,
    value: {
      name: v.name,
      email: mail,
      role: v.role as AdminRole,
      active: v.active === "on",
      ...(v.password ? { password: v.password } : {}),
    },
  };
}
