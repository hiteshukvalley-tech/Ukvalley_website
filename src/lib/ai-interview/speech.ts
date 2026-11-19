import "server-only";
import { integrationKey } from "@/lib/integration-keys";

// Speech-to-text for the candidate's spoken answers with Deepgram (live
// streaming, as on GrowthValley). The candidate's browser streams the
// microphone straight to Deepgram over a WebSocket and gets the words back
// while still speaking, then the final text of each phrase. The API key never
// leaves this server: the browser gets a short-lived token (POST
// /v1/auth/grant, 60 s; it only has to be valid when the connection opens).
// Key: Admin → API keys → Speech-to-text (Deepgram), else DEEPGRAM_API_KEY in
// .env. Without a key the interview page uses the browser's own speech
// recognition (Chrome / Edge).

// Only for automated tests (a local fake Deepgram).
const DEEPGRAM_API = () => process.env.DEEPGRAM_API_URL || "https://api.deepgram.com";
const DEEPGRAM_LISTEN = () => process.env.DEEPGRAM_LISTEN_URL || "wss://api.deepgram.com/v1/listen";
export const TOKEN_TTL_SECONDS = 60;

export type SpeechProvider = "deepgram" | "browser";

/** "deepgram" when a Deepgram key is set up, else "browser". */
export const speechProvider = (): SpeechProvider => (integrationKey("DEEPGRAM_API_KEY") ? "deepgram" : "browser");

/** Deepgram's language for the interview's language (a BCP-47 tag such as en-IN), unless one is fixed in API keys. */
export function deepgramLanguage(interviewLanguage: string): string {
  const fixed = integrationKey("DEEPGRAM_LANGUAGE");
  if (fixed && fixed !== "auto") return fixed;
  const tag = interviewLanguage.trim();
  if (/^hi\b/i.test(tag)) return "hi";
  if (/^en-IN$/i.test(tag)) return "en-IN";
  if (/^en\b/i.test(tag)) return tag;
  return tag.split("-")[0] || "en";
}

/**
 * The WebSocket address the browser connects to (the browser adds encoding
 * and sample_rate). interim_results: words while speaking; endpointing: a
 * phrase is final after 300 ms of silence (100 ms for mixed languages).
 */
export function listenUrl(interviewLanguage: string): string {
  const language = deepgramLanguage(interviewLanguage);
  const params = new URLSearchParams({
    model: integrationKey("DEEPGRAM_MODEL") || "nova-3",
    language,
    interim_results: "true",
    smart_format: "true",
    punctuate: "true",
    endpointing: language === "multi" ? "100" : "300",
  });
  return `${DEEPGRAM_LISTEN()}?${params}`;
}

/** An error with an HTTP status for the interview API. */
export class SpeechError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

function refused(status: number, json: Record<string, unknown>): string {
  const why = String(json.err_msg ?? json.message ?? json.reason ?? `status ${status}`);
  if (status === 401) return `Deepgram refused the API key (${why}). Check it in API keys → Speech-to-text.`;
  if (status === 403) return `The Deepgram key may not create temporary tokens (${why}). Use a key with the Member role or higher.`;
  if (status === 402) return `The Deepgram account has no credit left (${why}).`;
  return `Deepgram answered: ${why}`;
}

/** A short-lived Deepgram access token for one listening session. Throws SpeechError. */
export async function grantToken(apiKey = integrationKey("DEEPGRAM_API_KEY")): Promise<{ accessToken: string; expiresIn: number }> {
  if (!apiKey) throw new SpeechError(404, "Speech-to-text (Deepgram) is not set up.");
  let res: Response;
  try {
    res = await fetch(`${DEEPGRAM_API()}/v1/auth/grant`, {
      method: "POST",
      headers: { Authorization: `Token ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ ttl_seconds: TOKEN_TTL_SECONDS }),
      signal: AbortSignal.timeout(10_000),
      cache: "no-store",
    });
  } catch {
    throw new SpeechError(502, "Could not reach Deepgram (api.deepgram.com). Check the server's internet connection.");
  }
  const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok || typeof json.access_token !== "string") throw new SpeechError(502, refused(res.status, json));
  return { accessToken: json.access_token, expiresIn: Number(json.expires_in) || TOKEN_TTL_SECONDS };
}

/** What the candidate's browser needs to open one listening session. */
export async function speechSession(interviewLanguage: string): Promise<{ provider: "deepgram"; accessToken: string; url: string }> {
  const { accessToken } = await grantToken();
  return { provider: "deepgram", accessToken, url: listenUrl(interviewLanguage) };
}

/** API keys → Test: the key works and may create the temporary tokens the interview needs. */
export async function checkDeepgram(): Promise<string> {
  await grantToken();
  return `Deepgram works: the key is valid and can start live speech-to-text (model ${integrationKey("DEEPGRAM_MODEL") || "nova-3"}).`;
}
