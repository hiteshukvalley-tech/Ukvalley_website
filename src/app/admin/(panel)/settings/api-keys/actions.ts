"use server";

import { revalidatePath } from "next/cache";
import Anthropic from "@anthropic-ai/sdk";
import { HeadBucketCommand } from "@aws-sdk/client-s3";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin-session";
import { canManageKeys } from "@/lib/admin-access";
import { getDb, hasDatabaseUrl } from "@/lib/db/client";
import { KEY_DEFS, keyDef } from "@/lib/integration-keys-shared";
import { ensureIntegrationKeys, integrationKey, keyStatuses, saveIntegrationKeys } from "@/lib/integration-keys";
import { calendarStatus, disconnect, googleConfigured } from "@/lib/ai-interview/google-calendar";
import { s3Client } from "@/lib/ai-interview/recordings";
import { SpeechError, checkDeepgram } from "@/lib/ai-interview/speech";

// Site settings → API keys. Admins and HR staff (team members with the AI
// interviews area, see canManageKeys): these keys reach every connected
// service. The interview link address only accepts this site's own hosts
// (ai-interview/notify.ts), so HR can't send candidates elsewhere.

export type KeysState = {
  status?: "success" | "error";
  message?: string;
  errors?: Record<string, string>;
  nonce?: number;
};

const done = (status: "success" | "error", message: string, errors?: Record<string, string>): KeysState => ({ status, message, errors, nonce: Date.now() });

/** Admins and HR staff only (Settings → API keys); anyone else is sent home. */
async function requireKeysAccess() {
  const me = await requireAdmin();
  if (!canManageKeys(me.role, me.access)) redirect("/admin?denied=1");
  return me;
}

/** Whether any interview recording is stored (the recording key can't change then). */
async function recordingsExist(): Promise<boolean> {
  return (await getDb().collection("aiInterviewRecordings").estimatedDocumentCount()) > 0;
}

export async function saveKeysAction(_: KeysState, f: FormData): Promise<KeysState> {
  const me = await requireKeysAccess();
  if (!hasDatabaseUrl()) return done("error", "The database is not configured (MONGODB_URI).");

  const before = await keyStatuses({ recordingsExist: await recordingsExist() });
  const status = new Map(before.map((s) => [s.name, s]));
  const set: Record<string, string> = {};
  const remove: string[] = [];
  const errors: Record<string, string> = {};

  for (const d of KEY_DEFS) {
    const st = status.get(d.name)!;
    const saved = st.source === "settings" || st.unreadable;
    const raw = f.get(`v.${d.name}`);
    const value = typeof raw === "string" ? raw.trim() : "";
    const wantsRemove = f.get(`rm.${d.name}`) === "on";

    if (d.secret) {
      // An empty box keeps the saved secret; "Remove" deletes it.
      if (wantsRemove && saved) remove.push(d.name);
      else if (value) {
        const err = d.check(value);
        if (err) errors[d.name] = err;
        else set[d.name] = value;
      }
      continue;
    }
    // Plain values and dropdowns: the box shows the saved value; emptying it removes it.
    if (raw === null) continue;
    if (wantsRemove || !value) {
      if (saved) remove.push(d.name);
      continue;
    }
    if (saved && value === st.savedValue) continue;
    // Unchanged from what is already in use (.env or the default): nothing to save.
    if (!saved && value === st.display) continue;
    const err = d.check(value);
    if (err) errors[d.name] = err;
    else set[d.name] = value;
  }

  // The recording key protects recordings already stored: it may only change while there are none.
  const recKey = "RECORDING_ENCRYPTION_KEY";
  if ((recKey in set || remove.includes(recKey)) && status.get(recKey)!.locked) {
    errors[recKey] = "Recordings are already stored with the current key; changing it would make them unreadable. Delete them first (or keep this key).";
  }
  // S3 needs a bucket.
  const bucketAfter = remove.includes("S3_RECORDINGS_BUCKET") ? process.env.S3_RECORDINGS_BUCKET?.trim() : set.S3_RECORDINGS_BUCKET ?? integrationKey("S3_RECORDINGS_BUCKET");
  if (set.RECORDING_STORAGE === "s3" && !bucketAfter) errors.S3_RECORDINGS_BUCKET = "Enter the S3 bucket to store recordings in S3.";

  if (Object.keys(errors).length) return done("error", "Please fix the highlighted keys. Nothing was saved.", errors);
  if (!Object.keys(set).length && !remove.length) return done("success", "No changes.");

  const googleIdBefore = integrationKey("GOOGLE_CLIENT_ID");
  try {
    await saveIntegrationKeys({ set, remove }, me.email);
  } catch (e) {
    return done("error", e instanceof Error ? `Could not save: ${e.message}` : "Could not save.");
  }

  // A different Google client can't use the calendar connection made with the old one.
  let note = "";
  if (integrationKey("GOOGLE_CLIENT_ID") !== googleIdBefore && (await calendarStatus()).connected) {
    await disconnect();
    note = " Google Calendar was disconnected because the client ID changed: connect it again in AI interviews → Settings.";
  }
  revalidatePath("/admin/settings");
  revalidatePath("/admin/settings/api-keys");
  revalidatePath("/admin/account");
  revalidatePath("/admin/ai-interviews/settings");
  const names = [...Object.keys(set), ...remove].map((n) => keyDef(n)?.label ?? n);
  return done("success", `Saved: ${names.join(", ")}. In use now.${note}`);
}

/** Checks that the saved keys of one service work, without sending anything to a candidate. */
export async function testKeysAction(service: "claude" | "speech" | "google" | "whatsapp" | "recordings"): Promise<KeysState> {
  await requireKeysAccess();
  await ensureIntegrationKeys();
  try {
    if (service === "claude") {
      if (integrationKey("AI_INTERVIEW_PROVIDER") === "mock") return done("success", "Test mode is on: Claude isn't called. Switch AI mode to Live to use the key.");
      const apiKey = integrationKey("ANTHROPIC_API_KEY");
      if (!apiKey) return done("error", "Enter the Anthropic API key first.");
      const client = new Anthropic({ apiKey, maxRetries: 0, timeout: 20_000 });
      const model = integrationKey("AI_INTERVIEW_MODEL") || "claude-opus-5-5";
      const info = await client.models.retrieve(model).catch(async (e) => {
        if (e instanceof Anthropic.NotFoundError) return null;
        throw e;
      });
      return info
        ? done("success", `The key works, and ${info.display_name ?? model} is available.`)
        : done("error", `The key works, but the model "${model}" wasn't found. Check the model ID.`);
    }

    if (service === "speech") {
      if (!integrationKey("DEEPGRAM_API_KEY")) return done("error", "Enter the Deepgram API key first. Until then, interviews use the browser's own speech recognition (Chrome and Edge).");
      try {
        return done("success", await checkDeepgram());
      } catch (e) {
        return done("error", e instanceof SpeechError ? e.message : "The Deepgram test failed.");
      }
    }

    if (service === "google") {
      if (!googleConfigured()) return done("error", "Enter the client ID and the client secret first.");
      const s = await calendarStatus();
      return s.connected
        ? done("success", `Connected as ${s.email || "a Google account"}.`)
        : done("success", "Saved. Now connect the calendar: AI interviews → Settings → Connect Google Calendar (Google checks the client then).");
    }

    if (service === "whatsapp") {
      const token = integrationKey("WHATSAPP_TOKEN");
      const phoneId = integrationKey("WHATSAPP_PHONE_NUMBER_ID");
      if (!token || !phoneId) return done("error", "Enter the access token and the phone number ID first.");
      const version = integrationKey("WHATSAPP_API_VERSION") || "v21.0";
      const res = await fetch(`https://graph.facebook.com/${encodeURIComponent(version)}/${encodeURIComponent(phoneId)}?fields=display_phone_number,verified_name`, {
        headers: { Authorization: `Bearer ${token}` },
        signal: AbortSignal.timeout(15_000),
      });
      const data = (await res.json().catch(() => ({}))) as { display_phone_number?: string; verified_name?: string; error?: { message?: string } };
      return res.ok
        ? done("success", `Connected: ${data.verified_name ?? "WhatsApp number"} ${data.display_phone_number ?? ""}`.trim())
        : done("error", `Meta refused it: ${data.error?.message ?? `HTTP ${res.status}`}`);
    }

    // recordings
    if (integrationKey("RECORDING_STORAGE") !== "s3") return done("success", "Recordings are stored in MongoDB (GridFS); nothing else to check.");
    const { client, bucket } = s3Client();
    await client.send(new HeadBucketCommand({ Bucket: bucket }));
    return done("success", `The S3 bucket "${bucket}" is reachable with these keys.`);
  } catch (e) {
    if (e instanceof Anthropic.AuthenticationError) return done("error", "Anthropic rejected the API key. Check it and save it again.");
    if (e instanceof Anthropic.PermissionDeniedError) return done("error", "The API key isn't allowed to use this. Check the key's workspace and permissions.");
    const name = (e as { name?: string }).name;
    if (name === "NotFound" || name === "NoSuchBucket") return done("error", "That S3 bucket doesn't exist (check the name and region).");
    if (name === "Forbidden" || name === "AccessDenied" || name === "InvalidAccessKeyId" || name === "SignatureDoesNotMatch") return done("error", "AWS refused these keys for this bucket (check the access keys and the bucket policy).");
    if (name === "TimeoutError" || name === "AbortError") return done("error", "The service didn't answer in time. Try again.");
    return done("error", e instanceof Error ? e.message : "The test failed.");
  }
}
