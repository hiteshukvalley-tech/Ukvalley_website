"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE, checkCredentials, envUser, type SessionUser } from "@/lib/admin-auth";
import { setSessionCookie } from "@/lib/admin-session";
import { hasDatabaseUrl } from "@/lib/db/client";
import { authenticateUser } from "@/lib/users-store";

export type LoginState = { error?: string; email?: string };

// Simple in-memory throttle: 5 failed attempts per IP, and 10 per account, per
// 15 minutes. The IP comes from a client-settable header, so the per-account
// limit is what stops a guesser who rotates it. Resets on server restart and is
// per-instance, which is enough to blunt password guessing.
const MAX_FAILS_IP = 5;
const MAX_FAILS_ACCOUNT = 10;
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
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0].trim() || "local";
  const ipKey = `ip:${ip}`;
  const accountKey = `acct:${email.trim().toLowerCase()}`;

  if (failCount(ipKey) >= MAX_FAILS_IP || failCount(accountKey) >= MAX_FAILS_ACCOUNT) {
    return { error: "Too many failed attempts. Try again in 15 minutes.", email };
  }

  if (!process.env.AUTH_SECRET) {
    return { error: "Admin login is not configured. Set the env vars from .env.example." };
  }

  // The owner account from the env vars always works; otherwise a database user.
  let user: SessionUser | null = null;
  if (await checkCredentials(email, password)) {
    user = envUser();
  } else if (hasDatabaseUrl()) {
    try {
      user = await authenticateUser(email, password);
    } catch {
      return { error: "Could not reach the database. Try again, or sign in as the owner.", email };
    }
  }
  if (!user) {
    recordFail(ipKey);
    recordFail(accountKey);
    return { error: "Incorrect email ID or password.", email };
  }

  await setSessionCookie(user);
  redirect("/admin");
}

export async function logoutAction() {
  (await cookies()).delete(SESSION_COOKIE);
  redirect("/admin/login");
}
