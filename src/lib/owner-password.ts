import { checkCredentials, envUser, ownerSessionVersion, type SessionUser } from "@/lib/admin-auth";
import { getDb, hasDatabaseUrl } from "@/lib/db/client";
import { hashPassword, verifyPassword } from "@/lib/password";

// The owner account's password comes from ADMIN_PASSWORD, but "Forgot
// password" can replace it with one saved (hashed) in the database. The saved
// password only counts while ADMIN_EMAIL and ADMIN_PASSWORD are the same as
// when it was set: changing either env var goes back to the env password, so
// the server environment can always recover the account.
// The same document counts the owner's sign-outs: each one changes the owner's
// session version, so signing out ends the owner's sessions everywhere.

const COLLECTION = "adminOwner";
const DOC_ID = "owner";

type OwnerDoc = {
  _id: string;
  /** the reset password (unset when the owner only ever signed out) */
  email?: string;
  passwordHash?: string;
  /** ownerSessionVersion(ADMIN_PASSWORD) when this password was set */
  envFingerprint?: number;
  updatedAt?: Date;
  /** bumped on every owner sign-out */
  signOuts?: number;
};

const col = () => getDb().collection<OwnerDoc>(COLLECTION);

/** Thrown when the database is configured but can't be reached. */
export class OwnerLookupError extends Error {}

type OwnerState = { env: Omit<SessionUser, "sv">; doc: OwnerDoc | null; override: string | null };

/**
 * The owner's saved state. With no database configured there is none (the env
 * password applies). When the database is configured but unreachable it is
 * unknown: "unavailable", so a replaced (perhaps leaked) env password is never
 * accepted again just because the database is down. `override` is the saved
 * password's hash, when there is one that still applies.
 */
async function ownerState(): Promise<OwnerState | null | "unavailable"> {
  const env = envUser();
  if (!env) return null;
  if (!hasDatabaseUrl()) return { env, doc: null, override: null };
  let doc: OwnerDoc | null;
  try {
    doc = await col().findOne({ _id: DOC_ID });
  } catch {
    return "unavailable";
  }
  const fingerprint = await ownerSessionVersion(process.env.ADMIN_PASSWORD ?? "");
  const override = doc?.passwordHash && doc.email === env.email && doc.envFingerprint === fingerprint ? doc.passwordHash : null;
  return { env, doc, override };
}

/**
 * The session version follows the password in use (env or reset) and the
 * sign-out count, so a reset or a sign-out ends every older owner session.
 */
async function toSession({ env, doc, override }: OwnerState): Promise<SessionUser> {
  const base = override ? `reset|${override}` : (process.env.ADMIN_PASSWORD ?? "");
  const signOuts = doc?.signOuts ?? 0;
  return { ...env, sv: await ownerSessionVersion(signOuts ? `${base}|signouts:${signOuts}` : base) };
}

/** The owner as a session user, or null when not configured (or while the database can't be reached). */
export async function getOwner(): Promise<SessionUser | null> {
  const state = await ownerState();
  return state && state !== "unavailable" ? toSession(state) : null;
}

/**
 * Checks the owner's email and password; returns the session user or null.
 * Throws OwnerLookupError when the database is configured but unreachable.
 */
export async function checkOwnerCredentials(email: string, password: string): Promise<SessionUser | null> {
  const env = envUser();
  if (!env) return null;
  if (email.trim().toLowerCase() !== env.email) return null;
  const state = await ownerState();
  if (state === "unavailable") throw new OwnerLookupError("Could not reach the database.");
  if (!state) return null;
  const ok = state.override
    ? await verifyPassword(password, state.override)
    : await checkCredentials(email, password);
  return ok ? toSession(state) : null;
}

/** Saves a new owner password (from "Forgot password"). */
export async function setOwnerPassword(password: string) {
  const env = envUser();
  if (!env) throw new Error("The owner account is not configured.");
  const envFingerprint = await ownerSessionVersion(process.env.ADMIN_PASSWORD ?? "");
  await col().updateOne(
    { _id: DOC_ID },
    { $set: { email: env.email, passwordHash: await hashPassword(password), envFingerprint, updatedAt: new Date() } },
    { upsert: true }
  );
}

/** Signs the owner out everywhere (from "Sign out"). Needs the database. */
export async function revokeOwnerSessions() {
  await col().updateOne({ _id: DOC_ID }, { $inc: { signOuts: 1 } }, { upsert: true });
}
