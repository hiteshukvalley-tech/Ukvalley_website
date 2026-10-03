"use server";

import { redirect } from "next/navigation";
import { hasDatabaseUrl } from "@/lib/db/client";
import { canSendResetCodes, completeReset, requestResetCode, verifyResetCode } from "@/lib/password-reset";
import { EMAIL_MAX, PASSWORD_MAX, passwordError } from "@/lib/users-validation";

export type ForgotStep = "email" | "code" | "password";

export type ForgotState = {
  step: ForgotStep;
  email?: string;
  /** one-time token from a verified code; sent back with the new password */
  token?: string;
  /** green message (e.g. "code sent") */
  notice?: string;
  error?: string;
  errors?: Record<string, string>;
  /** bumps on every result so the form remounts with fresh fields */
  nonce?: number;
};

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SEND_FAILED = "Could not send the email right now. Please try again in a few minutes.";

async function sendCode(email: string, nonce: number): Promise<ForgotState> {
  try {
    const outcome = await requestResetCode(email);
    if (outcome === "limited") {
      return { step: "email", email, error: "Too many codes were requested for this email. Try again in an hour.", nonce };
    }
    if (outcome === "wait") {
      return { step: "code", email, error: "A code was sent less than a minute ago. Check your inbox, or wait a minute and resend.", nonce };
    }
  } catch (e) {
    // Shown in the server log only (e.g. Gmail "Invalid login: Application-specific password required").
    console.error("[forgot password] Could not send the code email:", e instanceof Error ? e.message : e);
    return { step: "email", email, error: SEND_FAILED, nonce };
  }
  return {
    step: "code",
    email,
    notice: `If ${email} has an admin account, a 6-digit code is on its way. It expires in 10 minutes.`,
    nonce,
  };
}

export async function forgotPasswordAction(_prev: ForgotState, formData: FormData): Promise<ForgotState> {
  const nonce = Date.now();
  const step = String(formData.get("step") ?? "email") as ForgotStep;
  const email = String(formData.get("email") ?? "").trim().toLowerCase().slice(0, EMAIL_MAX);

  if (formData.get("intent") === "restart") return { step: "email", email, nonce };

  if (!hasDatabaseUrl()) {
    return { step: "email", email, error: "Password reset needs the database, which isn't connected (MONGODB_URI missing).", nonce };
  }
  if (!canSendResetCodes()) {
    return {
      step: "email",
      email,
      error: "Password reset by email isn't set up on this server yet (SMTP_PASS is missing). Ask the site owner to add it.",
      nonce,
    };
  }

  if (step === "email" || formData.get("intent") === "resend") {
    if (!EMAIL.test(email)) {
      return { step: "email", email, errors: { email: "Enter a valid email ID." }, nonce };
    }
    return sendCode(email, nonce);
  }

  if (step === "code") {
    const code = String(formData.get("code") ?? "").replace(/\s/g, "");
    if (!/^\d{6}$/.test(code)) {
      return { step: "code", email, errors: { code: "Enter the 6-digit code from the email." }, nonce };
    }
    try {
      const result = await verifyResetCode(email, code);
      if (!result.ok) {
        return result.reason === "wrong"
          ? { step: "code", email, errors: { code: "That code isn't right. Check the email and try again." }, nonce }
          : { step: "code", email, error: "This code has expired or was tried too many times. Send a new code.", nonce };
      }
      return { step: "password", email, token: result.token, nonce };
    } catch {
      return { step: "code", email, error: "Could not check the code. Please try again.", nonce };
    }
  }

  // step === "password"
  const token = String(formData.get("token") ?? "");
  const next = String(formData.get("next") ?? "");
  const confirm = String(formData.get("confirm") ?? "");
  const errors: Record<string, string> = {};
  const policy = next.length > PASSWORD_MAX ? `Use ${PASSWORD_MAX} characters or fewer.` : passwordError(next, email);
  if (policy) errors.next = policy;
  if (next !== confirm) errors.confirm = "The two passwords don't match.";
  if (Object.keys(errors).length) return { step: "password", email, token, errors, nonce };

  let done = false;
  try {
    done = await completeReset(email, token, next);
  } catch {
    // The token is used up by the attempt, so a retry starts from a new code.
    return { step: "email", email, error: "Could not save the new password. Please start again.", nonce };
  }
  if (!done) {
    return { step: "email", email, error: "This reset session has expired. Please start again.", nonce };
  }
  redirect("/admin/login?reset=1");
}
