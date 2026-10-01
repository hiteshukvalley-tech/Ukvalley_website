import { randomUUID } from "node:crypto";
import { getDb, hasDatabaseUrl } from "@/lib/db/client";
import type { AdminRole, SessionUser } from "@/lib/admin-auth";
import { DUMMY_HASH, hashPassword, verifyPassword } from "@/lib/password";

const COLLECTION = "adminUsers";

export type UserDoc = {
  _id: string;
  email: string;
  name: string;
  role: AdminRole;
  passwordHash: string;
  active: boolean;
  /** bumped on password change/reset so older sessions stop working */
  sessionVersion: number;
  createdAt: Date;
  updatedAt?: Date;
  lastLoginAt?: Date;
};

/** A user as the admin pages see it — never includes the password hash. */
export type AdminUser = Omit<UserDoc, "_id" | "passwordHash"> & { id: string };

const col = () => getDb().collection<UserDoc>(COLLECTION);

// Emails are unique. Created once per server process, on first use.
let indexReady: Promise<unknown> | undefined;
const ensureIndex = () => (indexReady ??= col().createIndex({ email: 1 }, { unique: true }).catch((e) => {
  indexReady = undefined;
  throw e;
}));

const toUser = ({ _id, passwordHash, ...rest }: UserDoc): AdminUser => {
  void passwordHash;
  return { ...rest, id: _id };
};

export async function listUsers(): Promise<{ items: AdminUser[]; dbError?: string }> {
  if (!hasDatabaseUrl()) return { items: [], dbError: "MONGODB_URI is not set." };
  try {
    const docs = await col().find({}).sort({ createdAt: 1 }).toArray();
    return { items: docs.map(toUser) };
  } catch (e) {
    return { items: [], dbError: e instanceof Error ? e.message : "Could not read users." };
  }
}

export async function getUserDoc(id: string): Promise<UserDoc | null> {
  if (!hasDatabaseUrl()) return null;
  return col().findOne({ _id: id });
}

/** The user, or null when it doesn't exist. Database errors are thrown. */
export async function findUser(id: string): Promise<AdminUser | null> {
  const doc = await getUserDoc(id);
  return doc ? toUser(doc) : null;
}

/** Like findUser, but a database error also reads as "not found" (for pages). */
export async function getUser(id: string): Promise<AdminUser | null> {
  try {
    return await findUser(id);
  } catch {
    return null;
  }
}

/** Active admins other than `excludeId` — used to never lock everyone out. */
export async function countOtherActiveAdmins(excludeId: string): Promise<number> {
  return col().countDocuments({ role: "admin", active: true, _id: { $ne: excludeId } });
}

export async function createUser(input: {
  name: string; email: string; role: AdminRole; active: boolean; password: string;
}): Promise<"created" | "exists"> {
  await ensureIndex();
  const { password, ...rest } = input;
  try {
    await col().insertOne({
      _id: randomUUID(),
      ...rest,
      passwordHash: await hashPassword(password),
      sessionVersion: 1,
      createdAt: new Date(),
    });
    return "created";
  } catch (e) {
    if ((e as { code?: number }).code === 11000) return "exists";
    throw e;
  }
}

/**
 * Updates name, role and active state, and optionally resets the password
 * (which also signs the user out everywhere). Returns false when the user no
 * longer exists.
 */
export async function updateUser(
  id: string,
  patch: { name: string; role: AdminRole; active: boolean; password?: string }
): Promise<boolean> {
  const { password, ...fields } = patch;
  const update: Record<string, unknown> = { $set: { ...fields, updatedAt: new Date() } };
  if (password) {
    (update.$set as Record<string, unknown>).passwordHash = await hashPassword(password);
    update.$inc = { sessionVersion: 1 };
  } else if (!fields.active) {
    // Disabled users are cut off immediately by the active check; also drop
    // their sessions so re-enabling later doesn't revive an old cookie.
    update.$inc = { sessionVersion: 1 };
  }
  const res = await col().updateOne({ _id: id }, update);
  return res.matchedCount > 0;
}

/** Sets a new password; returns the new session version, or null if no such user. */
export async function changePassword(id: string, password: string): Promise<number | null> {
  const doc = await col().findOneAndUpdate(
    { _id: id },
    { $set: { passwordHash: await hashPassword(password), updatedAt: new Date() }, $inc: { sessionVersion: 1 } },
    { returnDocument: "after" }
  );
  return doc ? doc.sessionVersion : null;
}

/** Checks a user's current password (for the change-password form). */
export async function checkUserPassword(id: string, password: string): Promise<boolean> {
  const doc = await col().findOne({ _id: id });
  return doc ? verifyPassword(password, doc.passwordHash) : false;
}

export async function deleteUser(id: string) {
  await col().deleteOne({ _id: id });
}

/** Database login. Returns the session user, or null for any failure. */
export async function authenticateUser(email: string, password: string): Promise<SessionUser | null> {
  const doc = await col().findOne({ email: email.trim().toLowerCase() });
  // Always run one hash comparison so an unknown email isn't faster to reject.
  const ok = await verifyPassword(password, doc?.passwordHash ?? DUMMY_HASH);
  if (!doc || !ok || !doc.active) return null;
  await col().updateOne({ _id: doc._id }, { $set: { lastLoginAt: new Date() } });
  return { id: doc._id, email: doc.email, role: doc.role, sv: doc.sessionVersion };
}
