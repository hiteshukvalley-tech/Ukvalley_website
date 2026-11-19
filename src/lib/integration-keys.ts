import "server-only";
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { authSecret } from "@/lib/admin-auth";
import { getDb, hasDatabaseUrl } from "@/lib/db/client";
import { KEY_DEFS, keyDef, mask, type KeyStatus } from "./integration-keys-shared";

// API keys entered in Site settings → API keys. Server-only.
//
//   • Stored in "appIntegrationKeys", each value encrypted with AES-256-GCM
//     under a key derived from AUTH_SECRET; only the last 4 characters of a
//     secret are kept in clear, for the admin page.
//   • Read through integrationKey(name): the admin's value, else .env, else the
//     built-in default. Synchronous (it reads a memory cache), so the existing
//     code paths stay as they were.
//   • The cache loads when the server starts, refreshes every 30 s (a second
//     server, or an edit made there, shows up within that time), and is
//     updated at once on this server when an admin saves.

const COLLECTION = "appIntegrationKeys";
const DOC_ID = "keys";
const HISTORY_MAX = 200;

type StoredValue = { enc: string; last4: string; updatedAt: Date; updatedBy: string };
type HistoryEntry = { name: string; action: "set" | "removed"; by: string; at: Date };
type KeysDoc = { _id: string; values: Record<string, StoredValue>; history?: HistoryEntry[]; updatedAt: Date };

const col = () => getDb().collection<KeysDoc>(COLLECTION);

// --- encryption ------------------------------------------------------------------------------------

const cryptoKey = () => createHash("sha256").update(`app-integration-keys|${authSecret()}`).digest();

function encrypt(plain: string): string {
  const iv = randomBytes(12);
  const c = createCipheriv("aes-256-gcm", cryptoKey(), iv);
  const data = Buffer.concat([c.update(plain, "utf8"), c.final()]);
  return [iv, c.getAuthTag(), data].map((b) => b.toString("base64")).join(".");
}

function decrypt(stored: string): string | null {
  try {
    const [iv, tag, data] = stored.split(".").map((p) => Buffer.from(p, "base64"));
    const d = createDecipheriv("aes-256-gcm", cryptoKey(), iv);
    d.setAuthTag(tag);
    return Buffer.concat([d.update(data), d.final()]).toString("utf8");
  } catch {
    return null;
  }
}

// --- cache --------------------------------------------------------------------------------------

type Cache = {
  at: number;
  values: Map<string, string>;
  meta: Map<string, { updatedAt: Date; updatedBy: string; last4: string; unreadable: boolean; plain: string }>;
};
const g = globalThis as unknown as { _integrationKeys?: Cache; _integrationKeysLoading?: Promise<void> | null; _integrationKeysTimer?: NodeJS.Timeout };

const FRESH_MS = 30_000;

/** Loads the saved keys into memory. Never throws: on a database error the last good values (or .env) stay in use. */
export function refreshIntegrationKeys(): Promise<void> {
  if (!hasDatabaseUrl()) return Promise.resolve();
  g._integrationKeysLoading ??= (async () => {
    try {
      const doc = await col().findOne({ _id: DOC_ID });
      const values = new Map<string, string>();
      const meta: Cache["meta"] = new Map();
      for (const [name, v] of Object.entries(doc?.values ?? {})) {
        if (!keyDef(name)) continue;
        const plain = decrypt(v.enc);
        if (plain !== null) values.set(name, plain);
        meta.set(name, { updatedAt: v.updatedAt, updatedBy: v.updatedBy, last4: v.last4, unreadable: plain === null, plain: plain ?? "" });
      }
      g._integrationKeys = { at: Date.now(), values, meta };
    } catch (e) {
      console.error("[integration-keys] could not load the saved API keys:", e instanceof Error ? e.message : e);
    } finally {
      g._integrationKeysLoading = null;
    }
  })();
  return g._integrationKeysLoading;
}

/** Makes sure the cache is no older than 30 s (cheap when it is). */
export async function ensureIntegrationKeys(): Promise<void> {
  const c = g._integrationKeys;
  if (!c || Date.now() - c.at > FRESH_MS) await refreshIntegrationKeys();
}

/**
 * Whether the saved keys have been read from the database at least once (always
 * true without a database). Until then integrationKey() can only see .env, so
 * anything that must use the admin's value (the recording key) waits for this.
 */
export const integrationKeysReady = () => !hasDatabaseUrl() || !!g._integrationKeys;

/** Loads the keys now and keeps them fresh. Called once from instrumentation.ts. */
export async function startIntegrationKeyRefresh() {
  await refreshIntegrationKeys();
  if (g._integrationKeysTimer) return;
  g._integrationKeysTimer = setInterval(() => void refreshIntegrationKeys(), FRESH_MS);
  g._integrationKeysTimer.unref?.();
}

// --- reading ------------------------------------------------------------------------------------

const envValue = (name: string) => process.env[name]?.trim() ?? "";

/** The value in use: saved in the admin, else .env, else the built-in default ("" when none). */
export function integrationKey(name: string): string {
  const saved = g._integrationKeys?.values.get(name);
  if (saved) return saved;
  return envValue(name) || keyDef(name)?.defaultValue || "";
}

/** A fingerprint of some keys, for rebuilding a client when any of them changes. */
export const keysFingerprint = (...names: string[]) =>
  createHash("sha256").update(names.map((n) => `${n}=${integrationKey(n)}`).join("\n")).digest("hex").slice(0, 16);

/** Status of every key for the admin page. Secrets are masked; nothing secret leaves the server. */
export async function keyStatuses(opts: { recordingsExist: boolean }): Promise<KeyStatus[]> {
  await refreshIntegrationKeys();
  const meta = g._integrationKeys?.meta ?? new Map();
  return KEY_DEFS.map((d) => {
    const m = meta.get(d.name);
    const env = envValue(d.name);
    const source: KeyStatus["source"] = m && !m.unreadable ? "settings" : env ? "env" : d.defaultValue ? "default" : "none";
    const value = source === "settings" ? m!.plain : source === "env" ? env : source === "default" ? d.defaultValue! : "";
    return {
      name: d.name,
      source,
      display: d.secret ? (source === "settings" ? `••••${m!.last4}` : mask(value)) : value,
      savedValue: !d.secret && source === "settings" ? m!.plain : "",
      updatedAt: m ? m.updatedAt.toISOString() : null,
      updatedBy: m?.updatedBy ?? null,
      unreadable: !!m?.unreadable,
      locked: d.name === "RECORDING_ENCRYPTION_KEY" && opts.recordingsExist,
    };
  });
}

/** Who changed which key and when (never the values). */
export async function keyHistory(limit = 30): Promise<HistoryEntry[]> {
  if (!hasDatabaseUrl()) return [];
  const doc = await col().findOne({ _id: DOC_ID }, { projection: { history: { $slice: -limit } } });
  return [...(doc?.history ?? [])].reverse();
}

// --- writing ------------------------------------------------------------------------------------

/**
 * Saves new values and removes others, in one write. `set` values must already
 * be checked. Updates this server's cache at once.
 */
export async function saveIntegrationKeys(change: { set: Record<string, string>; remove: string[] }, by: string): Promise<void> {
  const now = new Date();
  const $set: Record<string, unknown> = { updatedAt: now };
  const $unset: Record<string, ""> = {};
  const history: HistoryEntry[] = [];
  for (const [name, value] of Object.entries(change.set)) {
    if (!keyDef(name)) continue;
    $set[`values.${name}`] = { enc: encrypt(value), last4: value.slice(-4), updatedAt: now, updatedBy: by } satisfies StoredValue;
    history.push({ name, action: "set", by, at: now });
  }
  for (const name of change.remove) {
    if (!keyDef(name) || name in change.set) continue;
    $unset[`values.${name}`] = "";
    history.push({ name, action: "removed", by, at: now });
  }
  if (!history.length) return;
  await col().updateOne(
    { _id: DOC_ID },
    {
      $set,
      ...(Object.keys($unset).length ? { $unset } : {}),
      $push: { history: { $each: history, $slice: -HISTORY_MAX } },
    } as never,
    { upsert: true }
  );
  // A load that started before this write would bring back the old values: wait for it, then load again.
  if (g._integrationKeysLoading) await g._integrationKeysLoading;
  await refreshIntegrationKeys();
}
