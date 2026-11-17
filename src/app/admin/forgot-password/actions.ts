"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { clientIp } from "@/lib/client-ip";
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

// Simple in-memory throttle per IP, like the sign-in one (app/admin/actions.ts):
// 10 code requests and 10 wrong codes per 15 minutes. Every email address has
// its own limits too (password-reset.ts); this stops one visitor spraying many.
// Resets on server restart and is per-instance.
const MAX_PER_IP = 10;
const WINDOW_MS = 15 * 60 * 1000;
const MAX_TRACKED = 5000;
const hits = new Map<string, { count: number; first: number }>();

function hitCount(key: string): number {
  const rec = hits.get(key);
  if (!rec) return 0;
  if (Date.now() - rec.first > WINDOW_MS) {
    hits.delete(key);
    return 0;
  }
  return rec.count;
}

function recordHit(key: string) {
  const now = Date.now();
  if (hits.size >= MAX_TRACKED) {
    for (const [k, r] of hits) if (now - r.first > WINDOW_MS) hits.delete(k);
    // Still full (a flood of unique keys): drop the oldest entries.
    for (const k of hits.keys()) {
      if (hits.size < MAX_TRACKED) break;
      hits.delete(k);
    }
  }
  const rec = hits.get(key);
  if (!rec || now - rec.first > WINDOW_MS) hits.set(key, { count: 1, first: now });
  else rec.count += 1;
}

const TOO_MANY = "Too many attempts from this network. Try again in 15 minutes.";

/**
 * Sends the code after the response, so every email gets the same answer at
 * the same speed: whether it has an account, was sent a code a moment ago, hit
 * the hourly limit or the send failed is only written to the server log.
 */
function sendCode(email: string, nonce: number): ForgotState {
  after(async () => {
    try {
      const outcome = await requestResetCode(email);
      if (outcome !== "sent") console.warn(`[forgot password] No code sent to ${email}: ${outcome}`);
    } catch (e) {
      // e.g. Gmail "Invalid login: Application-specific password required".
      console.error("[forgot password] Could not send the code email:", e instanceof Error ? e.message : e);
    }
  });
  return {
    step: "code",
    email,
    notice: `If ${email} has an admin account, a 6-digit code is on its way. It expires in 10 minutes. No email after a few minutes? Resend the code, or wait an hour if you asked for several.`,
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
  if (!(await canSendResetCodes())) {
    return {
      step: "email",
      email,
      error: "Password reset by email isn't set up yet. Ask an admin to add the HR email settings in Admin → Site settings.",
      nonce,
    };
  }

  const ip = clientIp(await headers());

  if (step === "email" || formData.get("intent") === "resend") {
    if (!EMAIL.test(email)) {
      return { step: "email", email, errors: { email: "Enter a valid email ID." }, nonce };
    }
    const key = `send:${ip}`;
    if (hitCount(key) >= MAX_PER_IP) return { step: "email", email, error: TOO_MANY, nonce };
    recordHit(key);
    return sendCode(email, nonce);
  }

  if (step === "code") {
    const code = String(formData.get("code") ?? "").replace(/\s/g, "");
    if (!/^\d{6}$/.test(code)) {
      return { step: "code", email, errors: { code: "Enter the 6-digit code from the email." }, nonce };
    }
    const key = `verify:${ip}`;
    if (hitCount(key) >= MAX_PER_IP) return { step: "code", email, error: TOO_MANY, nonce };
    try {
      const result = await verifyResetCode(email, code);
      if (!result.ok) {
        recordHit(key);
        // One message for a wrong, expired or used-up code (see verifyResetCode).
        return {
          step: "code",
          email,
          errors: { code: "That code isn't right or has expired. Check the email and try again, or send a new code." },
          nonce,
        };
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
