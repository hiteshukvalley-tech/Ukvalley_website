import { checkCredentials, envUser, ownerSessionVersion, type SessionUser } from "@/lib/admin-auth";
import { getDb, hasDatabaseUrl } from "@/lib/db/client";
import { hashPassword, verifyPassword } from "@/lib/password";

// The owner account's password comes from ADMIN_PASSWORD, but "Forgot
// password" can replace it with one saved (hashed) in the database. The saved
// password only counts while ADMIN_EMAIL and ADMIN_PASSWORD are the same as
// when it was set: changing either env var goes back to the env password, so
// the server environment can always recover the account.

const COLLECTION = "adminOwner";
const DOC_ID = "owner";

type OwnerDoc = {
  _id: string;
  email: string;
  passwordHash: string;
  /** ownerSessionVersion(ADMIN_PASSWORD) when this password was set */
  envFingerprint: number;
  updatedAt: Date;
};

const col = () => getDb().collection<OwnerDoc>(COLLECTION);

/** Thrown when the database is configured but can't be reached. */
export class OwnerLookupError extends Error {}

/**
 * The saved owner password, when there is one that still applies. With no
 * database configured there can't be one (the env password applies). When the
 * database is configured but unreachable it is unknown: "unavailable", so a
 * replaced (perhaps leaked) env password is never accepted again just because
 * the database is down.
 */
async function activeOverride(): Promise<OwnerDoc | null | "unavailable"> {
  const env = envUser();
  if (!env || !hasDatabaseUrl()) return null;
  try {
    const doc = await col().findOne({ _id: DOC_ID });
    return doc && doc.email === env.email && doc.envFingerprint === env.sv ? doc : null;
  } catch {
    return "unavailable";
  }
}

/**
 * The owner as a session user, or null when not configured (or while the
 * database can't be reached). With a reset password, the session version
 * follows that password, so resetting it again signs out every older owner session.
 */
export async function getOwner(): Promise<SessionUser | null> {
  const env = envUser();
  if (!env) return null;
  const override = await activeOverride();
  if (override === "unavailable") return null;
  return override ? { ...env, sv: ownerSessionVersion(`reset|${override.passwordHash}`) } : env;
}

/**
 * Checks the owner's email and password; returns the session user or null.
 * Throws OwnerLookupError when the database is configured but unreachable.
 */
export async function checkOwnerCredentials(email: string, password: string): Promise<SessionUser | null> {
  const env = envUser();
  if (!env) return null;
  if (email.trim().toLowerCase() !== env.email) return null;
  const override = await activeOverride();
  if (override === "unavailable") throw new OwnerLookupError("Could not reach the database.");
  if (!override) return (await checkCredentials(email, password)) ? env : null;
  if (email.trim().toLowerCase() !== env.email) return null;
  return (await verifyPassword(password, override.passwordHash)) ? getOwner() : null;
}

/** Saves a new owner password (from "Forgot password"). */
export async function setOwnerPassword(password: string) {
  const env = envUser();
  if (!env) throw new Error("The owner account is not configured.");
  await col().updateOne(
    { _id: DOC_ID },
    { $set: { email: env.email, passwordHash: await hashPassword(password), envFingerprint: env.sv, updatedAt: new Date() } },
    { upsert: true }
  );
}
