import { createHmac, randomBytes, randomInt, timingSafeEqual } from "node:crypto";
import { authSecret, envUser } from "@/lib/admin-auth";
import { getDb } from "@/lib/db/client";
import { hasMailer, sendMail } from "@/lib/mailer";
import { setOwnerPassword } from "@/lib/owner-password";
import { changePassword, findUserIdByEmail } from "@/lib/users-store";

// "Forgot password" for the admin panel, in three steps:
//   1. requestResetCode  — emails a 6-digit code (valid 10 minutes)
//   2. verifyResetCode   — checks the code (5 tries), returns a one-time token
//   3. completeReset     — the token plus a new password changes the password
// Only hashes of the code and token are stored. One document per email; it
// lives an hour from the first code, which also caps how many codes are sent.

const COLLECTION = "passwordResets";
export const CODE_TTL_MS = 10 * 60 * 1000;
const TOKEN_TTL_MS = 10 * 60 * 1000;
const RESEND_AFTER_MS = 60 * 1000;
const MAX_CODES_PER_HOUR = 5;
const MAX_TRIES = 5;
const WINDOW_MS = 60 * 60 * 1000;

type ResetDoc = {
  _id: string; // email
  codeHash?: string;
  codeExpiresAt?: Date;
  tries: number;
  sentAt?: Date;
  sent: number;
  tokenHash?: string;
  tokenExpiresAt?: Date;
  /** MongoDB deletes the document at this time (TTL index) */
  purgeAt: Date;
};

const col = () => getDb().collection<ResetDoc>(COLLECTION);

let indexReady: Promise<unknown> | undefined;
const ensureIndex = () => (indexReady ??= col().createIndex({ purgeAt: 1 }, { expireAfterSeconds: 0 }).catch((e) => {
  indexReady = undefined;
  throw e;
}));

/**
 * Keyed hash, so a leaked database row can't be used to find the code. Throws
 * without a proper AUTH_SECRET (never an empty key).
 */
const digest = (kind: string, email: string, value: string) =>
  createHmac("sha256", authSecret()).update(`${kind}|${email}|${value}`).digest("hex");

const hasSecret = () => (process.env.AUTH_SECRET ?? "").length >= 16;

const sameHash = (a: string | undefined, b: string) =>
  !!a && a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b));

const live = (d?: Date) => !!d && d.getTime() > Date.now();

/**
 * Whether codes can be delivered: SMTP is configured, or this is local
 * development, where the code is printed in the terminal instead. Always off
 * without a proper AUTH_SECRET, which keys the stored hashes.
 */
export const canSendResetCodes = async () =>
  hasSecret() && ((await hasMailer()) || process.env.NODE_ENV !== "production");

/** Whether this email belongs to the owner or an active database user. */
async function accountExists(email: string): Promise<"owner" | "user" | null> {
  if (envUser()?.email === email) return "owner";
  return (await findUserIdByEmail(email, { activeOnly: true })) ? "user" : null;
}

export type RequestOutcome = "sent" | "wait" | "limited";

/**
 * Emails a code when the email has an account. Returns "sent" for unknown
 * emails too, so the form never reveals which emails have accounts.
 * Throws when the email could not be sent.
 */
export async function requestResetCode(email: string): Promise<RequestOutcome> {
  await ensureIndex();
  if (!(await accountExists(email))) return "sent";

  const now = new Date();
  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  // The limits are part of the update's filter, so two requests at once can't
  // both pass them. When the document exists but fails them, the upsert tries
  // to insert a second one with the same _id, which fails with code 11000.
  try {
    await col().updateOne(
      {
        _id: email,
        sent: { $lt: MAX_CODES_PER_HOUR },
        $or: [{ sentAt: { $exists: false } }, { sentAt: { $lte: new Date(now.getTime() - RESEND_AFTER_MS) } }],
      },
      {
        $set: { codeHash: digest("code", email, code), codeExpiresAt: new Date(now.getTime() + CODE_TTL_MS), tries: 0, sentAt: now },
        $unset: { tokenHash: "", tokenExpiresAt: "" },
        $inc: { sent: 1 },
        $setOnInsert: { purgeAt: new Date(now.getTime() + WINDOW_MS) },
      },
      { upsert: true }
    );
  } catch (e) {
    if ((e as { code?: number }).code !== 11000) throw e;
    const doc = await col().findOne({ _id: email });
    return doc && doc.sent >= MAX_CODES_PER_HOUR ? "limited" : "wait";
  }

  if (!(await hasMailer())) {
    // Local development without SMTP: show the code in the server terminal.
    console.info(`\n[forgot password] Code for ${email}: ${code} (SMTP not configured, so it was not emailed)\n`);
    return "sent";
  }

  try {
    await sendMail({
      to: email,
      subject: `${code} is your Ukvalley Admin verification code`,
      text: `Your Ukvalley Admin password reset code is ${code}.\n\nIt expires in 10 minutes. If you didn't ask to reset your password, ignore this email; your password stays the same.`,
      html: `<div style="font-family:Arial,sans-serif;font-size:15px;color:#1f2937;line-height:1.5">
<p>Your Ukvalley Admin password reset code is:</p>
<p style="font-size:30px;font-weight:700;letter-spacing:6px;margin:16px 0">${code}</p>
<p>It expires in 10 minutes.</p>
<p style="color:#6b7280;font-size:13px">If you didn't ask to reset your password, ignore this email; your password stays the same.</p>
</div>`,
    });
  } catch (e) {
    // Not delivered: drop the code and let the user try again straight away.
    await col().updateOne({ _id: email }, { $unset: { codeHash: "", codeExpiresAt: "", sentAt: "" } }).catch(() => {});
    throw e;
  }
  return "sent";
}

/** A wrong, expired or used-up code all read the same, so a guesser learns nothing. */
export type VerifyOutcome = { ok: true; token: string } | { ok: false };

/** Checks a code. A right code is used up and exchanged for a one-time token. */
export async function verifyResetCode(email: string, code: string): Promise<VerifyOutcome> {
  // Count the try before comparing, in one atomic step: parallel guesses each
  // use up a try, and none gets through once MAX_TRIES are used.
  const doc = await col().findOneAndUpdate(
    { _id: email, codeHash: { $exists: true }, codeExpiresAt: { $gt: new Date() }, tries: { $lt: MAX_TRIES } },
    { $inc: { tries: 1 } },
    { returnDocument: "after" }
  );
  if (!doc?.codeHash) return { ok: false };

  if (!sameHash(doc.codeHash, digest("code", email, code))) {
    if (doc.tries >= MAX_TRIES) {
      await col().updateOne({ _id: email, codeHash: doc.codeHash }, { $unset: { codeHash: "", codeExpiresAt: "" } });
    }
    return { ok: false };
  }

  const token = randomBytes(32).toString("base64url");
  const tokenExpiresAt = new Date(Date.now() + TOKEN_TTL_MS);
  // Matching on the code hash makes a second, simultaneous use of the code fail.
  const res = await col().updateOne(
    { _id: email, codeHash: doc.codeHash },
    {
      $set: { tokenHash: digest("token", email, token), tokenExpiresAt },
      $unset: { codeHash: "", codeExpiresAt: "" },
      // Keep the document at least until the token runs out.
      $max: { purgeAt: tokenExpiresAt },
    }
  );
  return res.modifiedCount ? { ok: true, token } : { ok: false };
}

/** Sets the new password when the token is valid. Returns false otherwise. */
export async function completeReset(email: string, token: string, password: string): Promise<boolean> {
  // Taking the document makes the token single-use.
  const doc = await col().findOneAndDelete({ _id: email, tokenHash: digest("token", email, token) });
  if (!doc || !live(doc.tokenExpiresAt)) return false;

  const account = await accountExists(email);
  if (account === "owner") {
    await setOwnerPassword(password);
    return true;
  }
  const id = account && (await findUserIdByEmail(email, { activeOnly: true }));
  return id ? (await changePassword(id, password)) !== null : false;
}
