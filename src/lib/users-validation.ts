import { ADMIN_ROLES, type AdminRole } from "./admin-auth";
import { cleanAccess } from "./admin-access";
import type { FieldErrors } from "./list-utils";

export type { FieldErrors };

export const roleLabel: Record<AdminRole, string> = {
  admin: "Admin",
  // Stored as "editor"; a team member only sees the sections ticked for them.
  editor: "Team member",
};

export const roleHelp: Record<AdminRole, string> = {
  admin: "Full access, including users and site settings.",
  editor: "Only the sections you tick below. Never users, site settings or migration.",
};

export const TITLE_MAX = 60;

export const PASSWORD_MIN = 10;
export const PASSWORD_MAX = 128;
export const EMAIL_MAX = 200;

// "‑" is a non-breaking hyphen, so "(A-Z)" never wraps across lines.
const PASSWORD_RULES: { test: RegExp; label: string }[] = [
  { test: /[A-Z]/, label: "one uppercase letter (A‑Z)" },
  { test: /[a-z]/, label: "one lowercase letter (a‑z)" },
  { test: /[0-9]/, label: "one number (0‑9)" },
  { test: /[^A-Za-z0-9\s]/, label: "one special symbol (e.g. @ # $ ! %)" },
];

/** Shown under password fields. */
export const PASSWORD_HINT = `At least ${PASSWORD_MIN} characters, including an uppercase letter, a lowercase letter, a number and a special symbol.`;

/**
 * Length and character rules (uppercase, lowercase, number, special symbol).
 * Client-safe: the login page checks this before submitting. Returns a
 * message naming what is missing, or undefined when the password is fine.
 */
export function passwordRuleError(password: string): string | undefined {
  if (!password) return "Please enter your password.";
  if (password.length < PASSWORD_MIN) return `Password must be at least ${PASSWORD_MIN} characters long.`;
  if (password.length > PASSWORD_MAX) return `Password must be ${PASSWORD_MAX} characters or fewer.`;
  const missing = PASSWORD_RULES.filter((r) => !r.test.test(password)).map((r) => r.label);
  if (!missing.length) return undefined;
  const list = missing.length === 1 ? missing[0] : `${missing.slice(0, -1).join(", ")} and ${missing[missing.length - 1]}`;
  return `Password must contain at least ${list}.`;
}

/** Returns a message when a new password is not acceptable, otherwise undefined. */
export function passwordError(password: string, email = ""): string | undefined {
  const rule = passwordRuleError(password);
  if (rule) return rule;
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
  /** job title, e.g. "HR" or "Junior HR" (optional) */
  title: string;
  /** admin-access.ts keys ticked in the Access checklist (team members) */
  access: string[];
  /** only used to set or reset a password; never sent back to the form */
  password: string;
  /** "on" when the Active checkbox is ticked, otherwise "" */
  active: string;
};

export const emptyUserValues = (): UserValues => ({
  name: "", email: "", role: "editor", title: "", access: [], password: "", active: "on",
});

export function readUserValues(formData: FormData): UserValues {
  const get = (k: string) => String(formData.get(k) ?? "");
  return {
    name: get("name").trim(),
    email: get("email").trim().toLowerCase(),
    role: get("role").trim(),
    title: get("title").trim(),
    access: formData.getAll("access").map(String),
    // Passwords are taken exactly as typed — no trimming.
    password: get("password"),
    active: formData.get("active") ? "on" : "",
  };
}

export type UserInput = {
  name: string; email: string; role: AdminRole; active: boolean; password?: string;
  title?: string;
  /** Team members only: the sections they may open */
  access?: string[];
};

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
  if (v.title.length > TITLE_MAX) e.title = `Job title must be ${TITLE_MAX} characters or fewer.`;

  // Team members need at least one section, or their panel would be empty.
  const access = cleanAccess(v.access);
  if (v.role === "editor" && access.length === 0) e.access = "Tick at least one section this person can use.";

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
      ...(v.title ? { title: v.title } : {}),
      ...(v.role === "editor" ? { access } : {}),
      ...(v.password ? { password: v.password } : {}),
    },
  };
}
