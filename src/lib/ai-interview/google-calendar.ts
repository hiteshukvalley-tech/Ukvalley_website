import "server-only";
import { getDb, hasDatabaseUrl } from "@/lib/db/client";
import { integrationKey } from "@/lib/integration-keys";
import { decryptText, encryptText } from "./crypto";

// Google Calendar, through Google's REST API with OAuth 2.0. Server-only.
// An admin connects one Google account (Admin → AI interviews → Settings →
// Connect Google Calendar). Its refresh token is stored encrypted
// (AES-256-GCM) in "aiIntegrations"; access tokens are fetched as needed and
// kept in memory only. Events are created in that account's calendar with the
// candidate as a guest, and Google emails the invitation, updates and
// cancellation (sendUpdates=all).
// Needs GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET (a "Web application" OAuth
// client in Google Cloud with the Calendar API enabled), and its redirect URI
// set to <API_URL>/admin/ai-interviews/settings/google/callback.

const COLLECTION = "aiIntegrations";
const DOC_ID = "google-calendar";
const SCOPES = ["https://www.googleapis.com/auth/calendar.events", "openid", "email"];

export const googleConfigured = () => Boolean(integrationKey("GOOGLE_CLIENT_ID") && integrationKey("GOOGLE_CLIENT_SECRET"));

type IntegrationDoc = {
  _id: string;
  email: string;
  calendarId: string;
  refreshTokenEnc: string;
  connectedAt: Date;
  connectedBy: string;
};

const col = () => getDb().collection<IntegrationDoc>(COLLECTION);

export const redirectUri = (origin: string) => `${origin}/admin/ai-interviews/settings/google/callback`;

/** The address that starts the Google sign-in. */
export function authUrl(origin: string, state: string): string {
  const p = new URLSearchParams({
    client_id: integrationKey("GOOGLE_CLIENT_ID"),
    redirect_uri: redirectUri(origin),
    response_type: "code",
    scope: SCOPES.join(" "),
    access_type: "offline",
    // Always ask again, so Google returns a refresh token even if the account connected before.
    prompt: "consent",
    include_granted_scopes: "true",
    state,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${p}`;
}

async function tokenRequest(params: Record<string, string>) {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ client_id: integrationKey("GOOGLE_CLIENT_ID"), client_secret: integrationKey("GOOGLE_CLIENT_SECRET"), ...params }),
    signal: AbortSignal.timeout(15_000),
  });
  const data = (await res.json().catch(() => ({}))) as { access_token?: string; refresh_token?: string; expires_in?: number; id_token?: string; error?: string; error_description?: string };
  if (!res.ok || !data.access_token) throw new Error(`Google sign-in failed: ${data.error_description || data.error || res.status}`);
  return data;
}

/** Finishes the sign-in: swaps the code for tokens and saves the refresh token (encrypted). */
export async function completeConnection(origin: string, code: string, by: string): Promise<string> {
  const data = await tokenRequest({ code, grant_type: "authorization_code", redirect_uri: redirectUri(origin) });
  if (!data.refresh_token) throw new Error("Google did not return a refresh token. Remove the app's access in your Google account and connect again.");
  // The account's email comes from the ID token (it came straight from Google over TLS, so its payload is trusted here).
  let email = "";
  try {
    const payload = JSON.parse(Buffer.from((data.id_token ?? "").split(".")[1] ?? "", "base64url").toString("utf8")) as { email?: string };
    email = payload.email ?? "";
  } catch {}
  await col().updateOne(
    { _id: DOC_ID },
    { $set: { email, calendarId: "primary", refreshTokenEnc: encryptText(data.refresh_token, "google-oauth"), connectedAt: new Date(), connectedBy: by } },
    { upsert: true }
  );
  cached = null;
  return email;
}

export async function disconnect() {
  const doc = await col().findOne({ _id: DOC_ID });
  await col().deleteOne({ _id: DOC_ID });
  cached = null;
  const token = doc ? decryptText(doc.refreshTokenEnc, "google-oauth") : null;
  // Also revoke it at Google; ignore failures (it is deleted here either way).
  if (token) await fetch(`https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(token)}`, { method: "POST", signal: AbortSignal.timeout(10_000) }).catch(() => {});
}

export type CalendarStatus = { configured: boolean; connected: boolean; email?: string; connectedAt?: Date; connectedBy?: string; unreadable?: boolean };

export async function calendarStatus(): Promise<CalendarStatus> {
  if (!googleConfigured() || !hasDatabaseUrl()) return { configured: googleConfigured(), connected: false };
  try {
    const doc = await col().findOne({ _id: DOC_ID });
    if (!doc) return { configured: true, connected: false };
    return { configured: true, connected: true, email: doc.email, connectedAt: doc.connectedAt, connectedBy: doc.connectedBy, unreadable: decryptText(doc.refreshTokenEnc, "google-oauth") === null };
  } catch {
    return { configured: true, connected: false };
  }
}

let cached: { token: string; expires: number; calendarId: string } | null = null;

/** A valid access token, or null when Calendar isn't connected. */
async function accessToken(): Promise<{ token: string; calendarId: string } | null> {
  if (!googleConfigured() || !hasDatabaseUrl()) return null;
  if (cached && cached.expires > Date.now() + 60_000) return cached;
  const doc = await col().findOne({ _id: DOC_ID });
  if (!doc) return null;
  const refresh = decryptText(doc.refreshTokenEnc, "google-oauth");
  if (!refresh) throw new Error("The saved Google token can't be read (AUTH_SECRET changed). Connect Google Calendar again.");
  const data = await tokenRequest({ refresh_token: refresh, grant_type: "refresh_token" });
  cached = { token: data.access_token!, expires: Date.now() + (data.expires_in ?? 3000) * 1000, calendarId: doc.calendarId };
  return cached;
}

export type CalendarEventInput = {
  /** stable id, so a retried create can't make a second event (Google: base32hex, 5–1024 chars) */
  eventId: string;
  summary: string;
  description: string;
  start: Date;
  end: Date;
  timeZone: string;
  attendee: { email: string; name: string };
  location: string;
};

/** Google event ids allow a–v and 0–9 only. */
export const calendarEventId = (interviewId: string) => `aiint${interviewId.replace(/[^a-f0-9]/gi, "").toLowerCase()}`;

async function call(method: string, path: string, body?: unknown): Promise<Response> {
  const auth = await accessToken();
  if (!auth) throw new CalendarNotConnected();
  const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(auth.calendarId)}/events${path}`;
  return fetch(url, {
    method,
    headers: { Authorization: `Bearer ${auth.token}`, "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(15_000),
  });
}

export class CalendarNotConnected extends Error {
  constructor() {
    super("Google Calendar is not connected.");
  }
}

const eventBody = (e: CalendarEventInput) => ({
  id: e.eventId,
  summary: e.summary,
  description: e.description,
  location: e.location,
  start: { dateTime: e.start.toISOString(), timeZone: e.timeZone },
  end: { dateTime: e.end.toISOString(), timeZone: e.timeZone },
  attendees: [{ email: e.attendee.email, displayName: e.attendee.name }],
  // Google's own reminders for the guests: a day, an hour and 15 minutes before.
  reminders: { useDefault: false, overrides: [{ method: "email", minutes: 1440 }, { method: "popup", minutes: 60 }, { method: "popup", minutes: 15 }] },
  guestsCanInviteOthers: false,
  guestsCanSeeOtherGuests: false,
  status: "confirmed",
});

/** Creates the event, or updates it when it exists (a retry, or a reschedule). Returns its link. */
export async function upsertEvent(e: CalendarEventInput): Promise<{ eventId: string; htmlLink: string }> {
  let res = await call("PUT", `/${encodeURIComponent(e.eventId)}?sendUpdates=all`, eventBody(e));
  if (res.status === 404) res = await call("POST", `?sendUpdates=all`, eventBody(e));
  const data = (await res.json().catch(() => ({}))) as { id?: string; htmlLink?: string; error?: { message?: string } };
  if (!res.ok || !data.id) throw new Error(`Google Calendar: ${data.error?.message ?? res.status}`);
  return { eventId: data.id, htmlLink: data.htmlLink ?? "" };
}

/** Cancels the event (Google emails the guest). An event already gone counts as cancelled. */
export async function cancelEvent(eventId: string): Promise<void> {
  const res = await call("DELETE", `/${encodeURIComponent(eventId)}?sendUpdates=all`);
  if (!res.ok && res.status !== 404 && res.status !== 410) {
    const data = (await res.json().catch(() => ({}))) as { error?: { message?: string } };
    throw new Error(`Google Calendar: ${data.error?.message ?? res.status}`);
  }
}
