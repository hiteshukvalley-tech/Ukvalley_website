import "server-only";
import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { authSecret } from "@/lib/admin-auth";
import { integrationKey } from "@/lib/integration-keys";

// Secrets for AI interviews. Server-only.
//   • Interview links carry a random token; only its SHA-256 hash is stored, so
//     a database leak doesn't give working links.
//   • Google OAuth tokens and interview recordings are encrypted with
//     AES-256-GCM. Each purpose has its own key derived from AUTH_SECRET (and
//     RECORDING_ENCRYPTION_KEY for recordings, when set, so it can be rotated
//     separately). Changing the secret makes earlier data unreadable.

type Purpose = "google-oauth" | "recording" | "device" | "link";

function keyFor(purpose: Purpose): Buffer {
  const extra = purpose === "recording" ? integrationKey("RECORDING_ENCRYPTION_KEY") : "";
  return createHash("sha256").update(`ai-interview|${purpose}|${extra}|${authSecret()}`).digest();
}

/** A new random token for a link (URL-safe, 256 bits). */
export const newToken = () => randomBytes(32).toString("base64url");

/** The stored form of a token. */
export const hashToken = (token: string) => createHash("sha256").update(`ai-interview-link|${token}`).digest("hex");

/** A token's shape, checked before any database lookup. */
export const isTokenShape = (t: unknown): t is string => typeof t === "string" && /^[A-Za-z0-9_-]{43}$/.test(t);

/** Encrypts text; returns "iv.tag.data" in base64. */
export function encryptText(plain: string, purpose: Purpose): string {
  const iv = randomBytes(12);
  const c = createCipheriv("aes-256-gcm", keyFor(purpose), iv);
  const data = Buffer.concat([c.update(plain, "utf8"), c.final()]);
  return [iv, c.getAuthTag(), data].map((b) => b.toString("base64")).join(".");
}

/** null when it can't be decrypted (wrong key, tampered). */
export function decryptText(stored: string, purpose: Purpose): string | null {
  try {
    const [iv, tag, data] = stored.split(".").map((s) => Buffer.from(s, "base64"));
    const d = createDecipheriv("aes-256-gcm", keyFor(purpose), iv);
    d.setAuthTag(tag);
    return Buffer.concat([d.update(data), d.final()]).toString("utf8");
  } catch {
    return null;
  }
}

/** Encrypts bytes: iv (12) + tag (16) + ciphertext. */
export function encryptBytes(plain: Uint8Array, purpose: Purpose = "recording"): Buffer {
  const iv = randomBytes(12);
  const c = createCipheriv("aes-256-gcm", keyFor(purpose), iv);
  const data = Buffer.concat([c.update(plain), c.final()]);
  return Buffer.concat([iv, c.getAuthTag(), data]);
}

/** Throws when the bytes were tampered with or the key changed. */
export function decryptBytes(stored: Uint8Array, purpose: Purpose = "recording"): Buffer {
  const b = Buffer.from(stored);
  const d = createDecipheriv("aes-256-gcm", keyFor(purpose), b.subarray(0, 12));
  d.setAuthTag(b.subarray(12, 28));
  return Buffer.concat([d.update(b.subarray(28)), d.final()]);
}

/**
 * The device key: set as a cookie when the candidate starts, so only that
 * browser can continue (HR can release it). Stored as an HMAC.
 */
export const newDeviceKey = () => randomBytes(24).toString("base64url");
export const hashDeviceKey = (k: string) => createHmac("sha256", keyFor("device")).update(k).digest("hex");
export function sameHash(a: string, b: string): boolean {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

/** Random id for OAuth state values. */
export const randomState = () => randomBytes(24).toString("base64url");
