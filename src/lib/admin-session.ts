import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  ENV_USER_ID,
  SESSION_COOKIE,
  SESSION_TTL_MS,
  createSessionToken,
  envUser,
  verifySessionToken,
  type AdminRole,
  type SessionUser,
} from "./admin-auth";
import { hasDatabaseUrl } from "./db/client";
import { getUserDoc } from "./users-store";

/**
 * The signed-in admin, or null. The cookie proves who signed in; database
 * users are re-checked here on every call, so a disabled account, a password
 * reset, or a changed role takes effect immediately — not when the cookie
 * expires. (proxy.ts only checks the signature; it has no database access.)
 */
// cache(): the panel layout and the page both ask for the session on every
// request; this makes that one database lookup instead of two.
export const getSession = cache(async function getSession(): Promise<SessionUser | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const session = await verifySessionToken(token);
  if (!session) return null;

  if (session.id === ENV_USER_ID) {
    // The owner is valid only while it is still the account in the env vars
    // and the password has not changed since the cookie was issued.
    const owner = envUser();
    return owner && owner.email === session.email && owner.sv === session.sv ? owner : null;
  }

  if (!hasDatabaseUrl()) return null;
  try {
    const user = await getUserDoc(session.id);
    if (!user || !user.active || user.sessionVersion !== session.sv) return null;
    // Role comes from the database, not the cookie.
    return { id: user._id, email: user.email, role: user.role, sv: user.sessionVersion };
  } catch {
    return null;
  }
});

/** Any signed-in admin or editor. Redirects to the login page otherwise. */
export async function requireAdmin(): Promise<SessionUser> {
  const session = await getSession();
  if (!session) redirect("/admin/login");
  return session;
}

/** Requires the given role; editors who try admin-only pages are sent home. */
export async function requireRole(role: AdminRole): Promise<SessionUser> {
  const session = await requireAdmin();
  if (role === "admin" && session.role !== "admin") redirect("/admin?denied=1");
  return session;
}

/** Writes the session cookie for a user (used by login and password change). */
export async function setSessionCookie(user: SessionUser) {
  (await cookies()).set(SESSION_COOKIE, await createSessionToken(user), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_MS / 1000,
  });
}
