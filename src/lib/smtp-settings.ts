import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { getDb, hasDatabaseUrl } from "@/lib/db/client";

// Outgoing email (SMTP) settings. Server-only. Two kinds:
//   • HR SMTP — Admin → Site settings. Sends every automatic email (application
//     notices, thank-yous, password-reset codes) and is the fallback for
//     everyone. Takes priority over the SMTP_* env vars, which stay as its fallback.
//   • A user's own SMTP — Admin → Settings (each user), or Admin → Users → edit.
//     Emails that user sends (status updates, manual emails) go out through it.
// Passwords are encrypted at rest (AES-256-GCM, key derived from AUTH_SECRET)
// and never sent back to the browser.

export type SmtpSecurity = "ssl" | "starttls" | "none";

export type SmtpConfig = {
  host: string;
  port: number;
  security: SmtpSecurity;
  user: string;
  pass: string;
  /** sender display name, e.g. "Ukvalley Technologies" (optional) */
  fromName: string;
  /** sender address; empty = the username */
  fromEmail: string;
};

export type SmtpSource = "admin" | "env" | "user";

/** Whose settings: the HR (site-wide) ones, or one admin user's own. */
export type SmtpScope = { kind: "hr" } | { kind: "user"; userId: string };

/** "hr" or "user:<id>" — the form's way of naming a scope. */
export const scopeKey = (s: SmtpScope) => (s.kind === "hr" ? "hr" : `user:${s.userId}`);
export function parseScope(key: string): SmtpScope | null {
  if (key === "hr") return { kind: "hr" };
  const id = /^user:(.{1,100})$/.exec(key)?.[1];
  return id ? { kind: "user", userId: id } : null;
}

type SmtpDoc = Omit<SmtpConfig, "pass"> & {
  _id: string;
  passEnc: string;
  updatedAt: Date;
  updatedBy: string;
};

// HR settings live in "settings" (id "smtp", as before); users' in "userSmtp" (id = user id).
const where = (s: SmtpScope) =>
  s.kind === "hr"
    ? { col: getDb().collection<SmtpDoc>("settings"), id: "smtp" }
    : { col: getDb().collection<SmtpDoc>("userSmtp"), id: s.userId };

// --- password encryption ------------------------------------------------------

const key = () => createHash("sha256").update(`smtp-password|${process.env.AUTH_SECRET ?? ""}`).digest();

function encrypt(plain: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const data = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  return [iv, cipher.getAuthTag(), data].map((b) => b.toString("base64")).join(".");
}

/** null when it can't be decrypted (e.g. AUTH_SECRET changed since it was saved). */
function decrypt(stored: string): string | null {
  try {
    const [iv, tag, data] = stored.split(".").map((s) => Buffer.from(s, "base64"));
    const decipher = createDecipheriv("aes-256-gcm", key(), iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
  } catch {
    return null;
  }
}

// --- env fallback ---------------------------------------------------------------

/** The SMTP_* env vars as a config, or null when they're incomplete. */
export function envSmtpConfig(): SmtpConfig | null {
  const host = process.env.SMTP_HOST?.trim();
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) return null;
  const port = Number(process.env.SMTP_PORT) || 465;
  const from = process.env.MAIL_FROM ?? "";
  return {
    host,
    port,
    security: port === 465 ? "ssl" : "starttls",
    user,
    pass,
    fromName: from.match(/^\s*"?([^"<]+?)"?\s*</)?.[1]?.trim() ?? "",
    fromEmail: from.match(/<([^>]+)>/)?.[1] ?? (from.includes("@") ? from.trim() : ""),
  };
}

// --- reading ----------------------------------------------------------------------

// Read on every email, so keep it briefly in memory; saving clears it.
const CACHE_MS = 30_000;
type Resolved = { config: SmtpConfig; source: SmtpSource } | null;
const g = globalThis as unknown as { _smtpCache?: Map<string, { at: number; value: Resolved }> };
const cache = () => (g._smtpCache ??= new Map());

async function readSaved(s: SmtpScope): Promise<SmtpDoc | null> {
  if (!hasDatabaseUrl()) return null;
  try {
    const { col, id } = where(s);
    return await col.findOne({ _id: id });
  } catch {
    return null;
  }
}

const toConfig = (doc: SmtpDoc, pass: string): SmtpConfig => {
  const { host, port, security, user, fromName, fromEmail } = doc;
  return { host, port, security, user, pass, fromName, fromEmail };
};

async function resolve(s: SmtpScope): Promise<Resolved> {
  const k = scopeKey(s);
  const hit = cache().get(k);
  if (hit && Date.now() - hit.at < CACHE_MS) return hit.value;
  const doc = await readSaved(s);
  const pass = doc ? decrypt(doc.passEnc) : null;
  let value: Resolved = null;
  if (doc && pass !== null) value = { config: toConfig(doc, pass), source: s.kind === "hr" ? "admin" : "user" };
  else if (s.kind === "hr") {
    const env = envSmtpConfig();
    value = env ? { config: env, source: "env" } : null;
  }
  cache().set(k, { at: Date.now(), value });
  return value;
}

/** The HR settings (Site settings), else the env vars, else null. */
export const getSmtpConfig = () => resolve({ kind: "hr" });

/**
 * The settings an email from this admin user goes out with: their own SMTP
 * when they set one, else the HR settings.
 */
export async function getSmtpConfigFor(userId?: string): Promise<Resolved> {
  if (userId) {
    const own = await resolve({ kind: "user", userId });
    if (own) return own;
  }
  return getSmtpConfig();
}

export const clearSmtpCache = (s?: SmtpScope) => {
  if (s) cache().delete(scopeKey(s));
  else cache().clear();
};

/** What the admin page shows: the saved settings without the password (and, for HR, the env fallback). */
export async function getSmtpForAdmin(s: SmtpScope): Promise<{
  saved: (Omit<SmtpConfig, "pass"> & { hasPassword: boolean; passwordUnreadable: boolean; updatedAt: Date; updatedBy: string }) | null;
  env: Omit<SmtpConfig, "pass"> | null;
  dbError?: string;
}> {
  const envCfg = s.kind === "hr" ? envSmtpConfig() : null;
  const env = envCfg ? (({ pass, ...rest }) => (void pass, rest))(envCfg) : null;
  if (!hasDatabaseUrl()) return { saved: null, env, dbError: "MONGODB_URI is not set." };
  try {
    const { col, id } = where(s);
    const doc = await col.findOne({ _id: id });
    if (!doc) return { saved: null, env };
    const { host, port, security, user, fromName, fromEmail, passEnc, updatedAt, updatedBy } = doc;
    return {
      saved: { host, port, security, user, fromName, fromEmail, hasPassword: !!passEnc, passwordUnreadable: decrypt(passEnc) === null, updatedAt, updatedBy },
      env,
    };
  } catch (e) {
    return { saved: null, env, dbError: e instanceof Error ? e.message : "Could not read the email settings." };
  }
}

/**
 * The saved password (for "keep the current password" on save or test), or
 * null. Only given out for the same server and username it was saved with, so
 * pointing the form at another server can't send the saved password there.
 */
export async function savedSmtpPassword(s: SmtpScope, host: string, user: string): Promise<string | null> {
  const doc = await readSaved(s);
  if (!doc || doc.host.toLowerCase() !== host.toLowerCase() || doc.user.trim() !== user.trim()) return null;
  return decrypt(doc.passEnc);
}

// --- writing ----------------------------------------------------------------------

export async function saveSmtpSettings(s: SmtpScope, config: SmtpConfig, by: string) {
  const { pass, ...rest } = config;
  const { col, id } = where(s);
  await col.updateOne(
    { _id: id },
    { $set: { ...rest, passEnc: encrypt(pass), updatedAt: new Date(), updatedBy: by } },
    { upsert: true }
  );
  clearSmtpCache(s);
}

/** Removes saved settings: HR falls back to the SMTP_* env vars, a user to the HR settings. */
export async function deleteSmtpSettings(s: SmtpScope) {
  const { col, id } = where(s);
  await col.deleteOne({ _id: id });
  clearSmtpCache(s);
}
