"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { ENV_USER_ID, SESSION_COOKIE, type SessionUser } from "@/lib/admin-auth";
import { getSession, setSessionCookie } from "@/lib/admin-session";
import { hasDatabaseUrl } from "@/lib/db/client";
import { checkOwnerCredentials, revokeOwnerSessions } from "@/lib/owner-password";
import { authenticateUser, bumpSessionVersion } from "@/lib/users-store";
import { EMAIL_MAX, PASSWORD_MAX } from "@/lib/users-validation";
import { clientIp } from "@/lib/client-ip";

export type LoginState = { error?: string; email?: string; errors?: { password?: string } };

// Simple in-memory throttle: 5 failed attempts per IP per 15 minutes (see
// client-ip.ts for which IP). Failures per account never lock the account —
// anyone could lock out a known email that way — they slow it down instead:
// past 10 in 15 minutes, each attempt waits a little longer (up to 5 s).
// Resets on server restart and is per-instance, which is enough to blunt
// password guessing.
const MAX_FAILS_IP = 5;
const SLOW_AFTER_ACCOUNT_FAILS = 10;
const MAX_DELAY_MS = 5000;
const WINDOW_MS = 15 * 60 * 1000;
const MAX_TRACKED = 5000;
const fails = new Map<string, { count: number; first: number }>();

function failCount(key: string): number {
  const rec = fails.get(key);
  if (!rec) return 0;
  if (Date.now() - rec.first > WINDOW_MS) {
    fails.delete(key);
    return 0;
  }
  return rec.count;
}

function recordFail(key: string) {
  const now = Date.now();
  if (fails.size >= MAX_TRACKED) {
    for (const [k, r] of fails) if (now - r.first > WINDOW_MS) fails.delete(k);
    // Still full (a flood of unique keys): drop the oldest entries.
    for (const k of fails.keys()) {
      if (fails.size < MAX_TRACKED) break;
      fails.delete(k);
    }
  }
  const rec = fails.get(key);
  if (!rec || now - rec.first > WINDOW_MS) fails.set(key, { count: 1, first: now });
  else rec.count += 1;
}

export async function loginAction(
  _prev: LoginState,
  formData: FormData
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  // Same limits as the inputs' maxLength (a request can skip the browser).
  // No account has longer values, and this keeps huge inputs away from scrypt.
  if (email.length > EMAIL_MAX || password.length > PASSWORD_MAX) {
    return { error: "Incorrect email ID or password.", email: email.slice(0, EMAIL_MAX) };
  }
  // Only an empty password is refused before checking: the strength rules apply
  // when a password is set, and an owner password from the environment or an
  // older account's password may predate them (and must still sign in).
  if (!password) return { errors: { password: "Please enter your password." }, email };
  const ip = clientIp(await headers());
  const ipKey = `ip:${ip}`;
  const accountKey = `acct:${email.trim().toLowerCase()}`;

  if (failCount(ipKey) >= MAX_FAILS_IP) {
    return { error: "Too many failed attempts. Try again in 15 minutes.", email };
  }
  const over = failCount(accountKey) - SLOW_AFTER_ACCOUNT_FAILS;
  if (over >= 0) await new Promise((r) => setTimeout(r, Math.min((over + 1) * 500, MAX_DELAY_MS)));

  if ((process.env.AUTH_SECRET ?? "").length < 16) {
    return { error: "Admin login is not configured. Set the env vars from .env.example." };
  }

  // The owner account (env vars, or its reset password); otherwise a database user.
  let user: SessionUser | null;
  try {
    user = await checkOwnerCredentials(email, password);
    if (!user && hasDatabaseUrl()) user = await authenticateUser(email, password);
  } catch {
    return { error: "Could not reach the database. Try again in a moment.", email };
  }
  if (!user) {
    recordFail(ipKey);
    recordFail(accountKey);
    return { error: "Incorrect email ID or password.", email };
  }

  // A correct sign-in clears this IP's and this account's failures, so a few
  // typos from a shared office address don't lock everyone else out.
  fails.delete(ipKey);
  fails.delete(accountKey);
  await setSessionCookie(user);
  redirect("/admin");
}

/**
 * Signs out everywhere, not just this browser: a copied cookie stops working
 * too. Database users get a new session version; the owner's sign-out count
 * goes up (owner-password.ts). Without the database only the cookie is cleared.
 */
export async function logoutAction() {
  const session = await getSession();
  if (session && hasDatabaseUrl()) {
    try {
      if (session.id === ENV_USER_ID) await revokeOwnerSessions();
      else await bumpSessionVersion(session.id);
    } catch {
      // Database unreachable: clearing the cookie is all that can be done.
    }
  }
  (await cookies()).delete(SESSION_COOKIE);
  redirect("/admin/login");
}
