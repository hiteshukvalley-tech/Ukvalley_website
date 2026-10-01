// Admin sessions: a stateless, HMAC-signed cookie that carries who is signed in
// and their role. Two kinds of account can sign in:
//   - the "owner" from the ADMIN_EMAIL / ADMIN_PASSWORD env vars (always an
//     admin, works even with no database), and
//   - users stored in the database (see users-store.ts), admin or editor.
// Uses Web Crypto only, so it runs in both server actions and proxy.ts.
// The cookie only proves who signed in; server-side code re-checks the user in
// the database (admin-session.ts) so disabling someone takes effect at once.

export const SESSION_COOKIE = "uk_admin_session";
export const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export type AdminRole = "admin" | "editor";
export const ADMIN_ROLES: readonly AdminRole[] = ["admin", "editor"];

export type SessionUser = {
  /** "env" for the owner account, otherwise the database user id */
  id: string;
  email: string;
  role: AdminRole;
  /** the user's session version; bumping it signs out their other sessions */
  sv: number;
};

export const ENV_USER_ID = "env";

const enc = new TextEncoder();
const dec = new TextDecoder();

function bytesToB64url(bytes: Uint8Array): string {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function b64urlToBytes(s: string): Uint8Array {
  const padded = s.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - (s.length % 4)) % 4);
  const bin = atob(padded);
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

async function sign(payload: string): Promise<string> {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error("AUTH_SECRET is missing or too short (min 16 chars).");
  }
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  return bytesToB64url(new Uint8Array(await crypto.subtle.sign("HMAC", key, enc.encode(payload))));
}

/** Constant-time string compare (hashes first so lengths never leak). */
async function safeEqual(a: string, b: string): Promise<boolean> {
  const [ha, hb] = await Promise.all([
    crypto.subtle.digest("SHA-256", enc.encode(a)),
    crypto.subtle.digest("SHA-256", enc.encode(b)),
  ]);
  const x = new Uint8Array(ha);
  const y = new Uint8Array(hb);
  let diff = 0;
  for (let i = 0; i < x.length; i++) diff |= x[i] ^ y[i];
  return diff === 0;
}

/**
 * The owner's session version: a keyed hash of ADMIN_PASSWORD, so rotating the
 * password signs out every existing owner session. Keyed with AUTH_SECRET, so
 * the value in the (readable) cookie reveals nothing about the password.
 */
function ownerSessionVersion(password: string): number {
  const input = `${process.env.AUTH_SECRET ?? ""}|${password}`;
  let h = 0x811c9dc5; // FNV-1a, 32-bit
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** The env-configured owner as a session user, or null when not configured. */
export function envUser(): SessionUser | null {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) return null;
  return { id: ENV_USER_ID, email, role: "admin", sv: ownerSessionVersion(password) };
}

/** Checks the owner credentials from the environment. */
export async function checkCredentials(email: string, password: string) {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminEmail || !adminPassword) return false;
  const [okEmail, okPass] = await Promise.all([
    safeEqual(email.trim().toLowerCase(), adminEmail.trim().toLowerCase()),
    safeEqual(password, adminPassword),
  ]);
  return okEmail && okPass;
}

export async function createSessionToken(user: SessionUser): Promise<string> {
  const body = bytesToB64url(
    enc.encode(JSON.stringify({ u: user.id, e: user.email, r: user.role, v: user.sv, x: Date.now() + SESSION_TTL_MS }))
  );
  return `${body}.${await sign(body)}`;
}

/** Verifies the signature and expiry. Returns who the cookie says is signed in. */
export async function verifySessionToken(token?: string): Promise<SessionUser | null> {
  if (!token) return null;
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  try {
    if (!(await safeEqual(sig, await sign(body)))) return null;
    const p = JSON.parse(dec.decode(b64urlToBytes(body))) as {
      u?: unknown; e?: unknown; r?: unknown; v?: unknown; x?: unknown;
    };
    if (typeof p.x !== "number" || p.x < Date.now()) return null;
    if (typeof p.u !== "string" || typeof p.e !== "string") return null;
    if (p.r !== "admin" && p.r !== "editor") return null;
    return { id: p.u, email: p.e, role: p.r, sv: typeof p.v === "number" ? p.v : 0 };
  } catch {
    return null;
  }
}
