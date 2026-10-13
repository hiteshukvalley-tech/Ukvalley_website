"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin-session";
import { hasDatabaseUrl } from "@/lib/db/client";
import { sendTestEmail } from "@/lib/mailer";
import {
  deleteSmtpSettings, envSmtpConfig, getSmtpConfigFor, parseScope, saveSmtpSettings, savedSmtpPassword,
  type SmtpConfig, type SmtpScope, type SmtpSecurity,
} from "@/lib/smtp-settings";

// Save / test / remove for every SMTP form: the HR one in Site settings
// (admins only) and each user's own (that user, or an admin from Users).

/** What the form shows (never the password). */
export type SmtpValues = {
  host: string;
  port: string;
  security: SmtpSecurity;
  user: string;
  fromName: string;
  fromEmail: string;
  testTo: string;
};

export type SmtpState = {
  status?: "saved" | "error" | "tested" | "removed";
  message?: string;
  errors?: Record<string, string>;
  values?: SmtpValues;
  nonce?: number;
};

const SECURITIES: SmtpSecurity[] = ["ssl", "starttls", "none"];
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const HOST = /^(?=.{1,253}$)[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*$/i;
const NO_DB = "Database is not connected (MONGODB_URI missing), so email settings can't be saved.";

const errorText = (e: unknown) => (e instanceof Error ? e.message : String(e));

/** The signed-in user, if they may change these settings; otherwise sends them home. */
async function authorize(key: string): Promise<{ me: { id: string; email: string }; scope: SmtpScope }> {
  const me = await requireAdmin();
  const scope = parseScope(String(key));
  const allowed = scope && (me.role === "admin" || (scope.kind === "user" && scope.userId === me.id));
  if (!allowed) redirect("/admin?denied=1");
  return { me, scope };
}

function refresh(scope: SmtpScope) {
  if (scope.kind === "hr") revalidatePath("/admin/settings");
  else {
    revalidatePath("/admin/account");
    revalidatePath(`/admin/users/${scope.userId}`);
  }
}

function read(formData: FormData): { values: SmtpValues; pass: string } {
  const get = (k: string) => String(formData.get(k) ?? "").trim();
  const security = get("security") as SmtpSecurity;
  return {
    values: {
      host: get("host").toLowerCase(),
      port: get("port"),
      security: SECURITIES.includes(security) ? security : "ssl",
      user: get("user"),
      fromName: get("fromName").replace(/\s+/g, " "),
      fromEmail: get("fromEmail").toLowerCase(),
      testTo: get("testTo").toLowerCase(),
    },
    // Not trimmed: a password may contain spaces (Gmail App Password spaces are removed when sending).
    pass: String(formData.get("pass") ?? ""),
  };
}

/** Checks the fields; an empty password means "keep the saved one". */
async function toConfig(scope: SmtpScope, values: SmtpValues, pass: string): Promise<{ config?: SmtpConfig; errors: Record<string, string> }> {
  const errors: Record<string, string> = {};
  if (!values.host) errors.host = "Enter the SMTP server, e.g. smtp.gmail.com.";
  else if (!HOST.test(values.host)) errors.host = "Enter a server name like smtp.gmail.com (no http:// or spaces).";
  const port = Number(values.port);
  if (!Number.isInteger(port) || port < 1 || port > 65535) errors.port = "Enter a port number, e.g. 465 or 587.";
  if (!values.user) errors.user = "Enter the username (usually the full email address).";
  else if (values.user.length > 254) errors.user = "Username must be 254 characters or fewer.";
  if (values.fromName.length > 100) errors.fromName = "Sender name must be 100 characters or fewer.";
  if (values.fromEmail && !EMAIL.test(values.fromEmail)) errors.fromEmail = "Enter a valid email address, or leave it empty.";
  if (pass.length > 200) errors.pass = "Password must be 200 characters or fewer.";

  let password = pass;
  if (!password.trim()) {
    // The HR form is pre-filled from the server's SMTP_* settings when nothing is
    // saved, so their password counts as "saved" for the same server/user.
    const env = scope.kind === "hr" ? envSmtpConfig() : null;
    const envPass = env && env.host.toLowerCase() === values.host && env.user === values.user ? env.pass : null;
    password = (await savedSmtpPassword(scope, values.host, values.user)) ?? envPass ?? "";
    if (!password) errors.pass = "Enter the password (for Gmail, an App Password). A changed server or username needs it entered again.";
  }
  if (Object.keys(errors).length) return { errors };
  return {
    errors,
    config: { host: values.host, port, security: values.security, user: values.user, pass: password, fromName: values.fromName, fromEmail: values.fromEmail },
  };
}

export async function saveSmtpAction(key: string, _prev: SmtpState, formData: FormData): Promise<SmtpState> {
  const { me, scope } = await authorize(key);
  const { values, pass } = read(formData);
  const nonce = Date.now();
  if (!hasDatabaseUrl()) return { status: "error", message: NO_DB, values, nonce };

  const { config, errors } = await toConfig(scope, values, pass);
  if (!config) return { status: "error", message: "Please fix the highlighted fields.", errors, values, nonce };
  try {
    await saveSmtpSettings(scope, config, me.email);
  } catch (e) {
    return { status: "error", message: `Could not save: ${errorText(e)}`, values, nonce };
  }
  refresh(scope);
  const message = scope.kind === "hr"
    ? "HR email settings saved. Automatic emails now use them — send a test email to check."
    : "Email settings saved. Emails sent by this user now use them — send a test email to check.";
  return { status: "saved", message, values, nonce };
}

/** Sends a test email with what's in the form (saved or not). */
export async function testSmtpAction(key: string, _prev: SmtpState, formData: FormData): Promise<SmtpState> {
  const { scope } = await authorize(key);
  const { values, pass } = read(formData);
  const nonce = Date.now();
  const { config, errors } = await toConfig(scope, values, pass);
  if (!values.testTo || !EMAIL.test(values.testTo)) errors.testTo = "Enter the email address to send the test to.";
  if (!config || errors.testTo) return { status: "error", message: "Please fix the highlighted fields.", errors, values, nonce };
  try {
    await sendTestEmail(config, values.testTo);
  } catch (e) {
    return { status: "error", message: `Test failed: ${friendly(errorText(e))}`, values, nonce };
  }
  return { status: "tested", message: `Test email sent to ${values.testTo}. Check the inbox (and spam folder).`, values, nonce };
}

/** Removes the saved settings: HR goes back to the server's SMTP_* settings, a user to the HR settings. */
export async function removeSmtpAction(key: string): Promise<SmtpState> {
  const { scope } = await authorize(key);
  const nonce = Date.now();
  if (!hasDatabaseUrl()) return { status: "error", message: NO_DB, nonce };
  try {
    await deleteSmtpSettings(scope);
  } catch (e) {
    return { status: "error", message: `Could not remove: ${errorText(e)}`, nonce };
  }
  refresh(scope);
  const fallback = await getSmtpConfigFor(scope.kind === "user" ? scope.userId : undefined);
  const message =
    scope.kind === "user"
      ? fallback
        ? "Saved settings removed. This user's emails now go out through the HR email settings."
        : "Saved settings removed. Email is off for this user until the HR email settings are set up."
      : fallback
        ? "Saved settings removed. Emails now use the server's SMTP settings."
        : "Saved settings removed. Email is now switched off until new settings are saved.";
  return { status: "removed", message, nonce };
}

/** Turns common SMTP errors into a hint the admin can act on. */
function friendly(msg: string): string {
  if (/Invalid login|535|Username and Password not accepted|authentication failed/i.test(msg)) {
    return `${msg} — the username or password was rejected. For Gmail, turn on 2-Step Verification and use an App Password, not your normal password.`;
  }
  if (/ETIMEDOUT|ECONNREFUSED|ENOTFOUND|EHOSTUNREACH|Greeting never received|timeout/i.test(msg)) {
    return `${msg} — the server could not be reached. Check the server name and port (465 with SSL/TLS, or 587 with STARTTLS).`;
  }
  if (/wrong version number|SSL routines|certificate/i.test(msg)) {
    return `${msg} — the security setting doesn't match the port. Use SSL/TLS with 465, or STARTTLS with 587.`;
  }
  return msg;
}
