// API keys and integration settings an admin can enter in Site settings →
// API keys (instead of the server's .env file). Client-safe: the form and the
// server both read these definitions. Values never come to the browser:
// secrets are shown only as their last four characters.
//
// A value saved in the admin wins over the same name in .env; removing it
// there falls back to .env (or the built-in default). These cannot move to
// the admin, because they are needed before the database can be read or are
// fixed when the site is built: MONGODB_URI, MONGODB_DB, AUTH_SECRET,
// ADMIN_EMAIL, ADMIN_PASSWORD, SITE_URL, API_URL and every NEXT_PUBLIC_* value.
// The HR mail server (SMTP) has its own form in Site settings.

export type KeyGroup = "claude" | "speech" | "links" | "google" | "whatsapp" | "recordings";

export type KeyDef = {
  name: string;
  label: string;
  group: KeyGroup;
  /** secret: never shown again after saving, only its last 4 characters */
  secret: boolean;
  hint: string;
  /** used when neither the admin nor .env sets it */
  defaultValue?: string;
  /** a fixed set of values (a dropdown) */
  options?: { value: string; label: string }[];
  placeholder?: string;
  /** returns an error message, or null when the value is fine */
  check: (v: string) => string | null;
};

export const KEY_GROUPS: { key: KeyGroup; title: string; description: string }[] = [
  { key: "claude", title: "Claude (AI interviewer)", description: "Writes the interview questions and follow-ups, and evaluates the answers. Get a key at console.anthropic.com → API keys." },
  { key: "speech", title: "Speech-to-text (Deepgram)", description: "Turns the candidate's spoken answers into text, live, in any browser. Get a key at console.deepgram.com → API keys (Member role or higher). Without a key, the browser's own speech recognition is used (Chrome and Edge only)." },
  { key: "google", title: "Google Calendar", description: "An OAuth web client from Google Cloud Console with the Calendar API turned on. After saving, connect the calendar in AI interviews → Settings. Changing the client ID disconnects the current calendar." },
  { key: "whatsapp", title: "WhatsApp Business (Meta Cloud API)", description: "From Meta for Developers → your app → WhatsApp → API setup. Message templates must be approved in WhatsApp Manager." },
  { key: "recordings", title: "Interview recordings", description: "Where recordings are kept. Every recording is encrypted before it is stored, in MongoDB or a private S3 bucket." },
  { key: "links", title: "Interview links", description: "The address candidates open their interview on." },
];

const noSpaces = (label: string, min = 8, max = 500) => (v: string) =>
  /\s/.test(v) ? `${label} can't contain spaces.` : v.length < min ? `${label} looks too short.` : v.length > max ? `${label} is too long.` : null;

export const KEY_DEFS: KeyDef[] = [
  {
    name: "ANTHROPIC_API_KEY", label: "Anthropic API key", group: "claude", secret: true, placeholder: "sk-ant-…",
    hint: "Required for real AI interviews.",
    check: (v) => noSpaces("The API key", 20, 400)(v),
  },
  {
    name: "AI_INTERVIEW_MODEL", label: "Claude model", group: "claude", secret: false, defaultValue: "claude-opus-5-5", placeholder: "claude-opus-5-5",
    hint: "The model ID. Leave empty for the default (claude-opus-5-5).",
    check: (v) => (/^[a-z0-9][a-z0-9._:-]{2,79}$/i.test(v) ? null : "Use a model ID such as claude-opus-5-5."),
  },
  {
    name: "AI_INTERVIEW_PROVIDER", label: "AI mode", group: "claude", secret: false, defaultValue: "live",
    hint: "Test mode uses fixed questions and fixed scores, without calling Claude. Never use it for real candidates.",
    options: [
      { value: "live", label: "Live: Claude API" },
      { value: "mock", label: "Test mode: fixed questions and scores" },
    ],
    check: (v) => (v === "live" || v === "mock" ? null : "Choose a mode."),
  },
  {
    name: "DEEPGRAM_API_KEY", label: "Deepgram API key", group: "speech", secret: true,
    hint: "Never sent to candidates: their browser gets a 60-second token for each answer.",
    check: noSpaces("The API key", 20, 200),
  },
  {
    name: "DEEPGRAM_MODEL", label: "Model", group: "speech", secret: false, defaultValue: "nova-3", placeholder: "nova-3",
    hint: "Leave empty for nova-3 (the most accurate live model).",
    check: (v) => (/^[a-z0-9][a-z0-9._-]{1,40}$/i.test(v) ? null : "Use a Deepgram model name such as nova-3."),
  },
  {
    name: "DEEPGRAM_LANGUAGE", label: "Language", group: "speech", secret: false, defaultValue: "auto",
    hint: "Auto follows the interview language in AI interviews → Settings (en-IN → Indian English).",
    options: [
      { value: "auto", label: "Auto: the interview language" },
      { value: "en-IN", label: "English (India)" },
      { value: "en", label: "English" },
      { value: "hi", label: "Hindi" },
      { value: "multi", label: "Mixed / Hinglish (multilingual)" },
    ],
    check: (v) => (["auto", "en-IN", "en", "hi", "multi"].includes(v) ? null : "Choose a language."),
  },
  {
    name: "GOOGLE_CLIENT_ID", label: "OAuth client ID", group: "google", secret: false, placeholder: "1234-abc.apps.googleusercontent.com",
    hint: "Ends in .apps.googleusercontent.com.",
    check: (v) => (/^[\w.-]+\.apps\.googleusercontent\.com$/.test(v) ? null : "A Google client ID ends in .apps.googleusercontent.com."),
  },
  {
    name: "GOOGLE_CLIENT_SECRET", label: "OAuth client secret", group: "google", secret: true, placeholder: "GOCSPX-…",
    hint: "Shown next to the client ID in Google Cloud Console → Credentials.",
    check: noSpaces("The client secret", 10, 200),
  },
  {
    name: "WHATSAPP_TOKEN", label: "Access token", group: "whatsapp", secret: true,
    hint: "A permanent token (system user) with whatsapp_business_messaging permission.",
    check: noSpaces("The token", 20, 1000),
  },
  {
    name: "WHATSAPP_PHONE_NUMBER_ID", label: "Phone number ID", group: "whatsapp", secret: false, placeholder: "123456789012345",
    hint: "The number's ID (not the phone number itself).",
    check: (v) => (/^\d{5,30}$/.test(v) ? null : "The phone number ID is digits only."),
  },
  {
    name: "WHATSAPP_APP_SECRET", label: "App secret", group: "whatsapp", secret: true,
    hint: "App settings → Basic. Used to check that delivery receipts really come from Meta.",
    check: noSpaces("The app secret", 16, 200),
  },
  {
    name: "WHATSAPP_VERIFY_TOKEN", label: "Webhook verify token", group: "whatsapp", secret: true,
    hint: "Any long random text; enter the same text in Meta's webhook settings.",
    check: noSpaces("The verify token", 12, 200),
  },
  {
    name: "WHATSAPP_API_VERSION", label: "Graph API version", group: "whatsapp", secret: false, defaultValue: "v21.0", placeholder: "v21.0",
    hint: "Leave empty for v21.0.",
    check: (v) => (/^v\d{1,3}\.\d{1,2}$/.test(v) ? null : "Use a version such as v21.0."),
  },
  {
    name: "RECORDING_STORAGE", label: "Storage", group: "recordings", secret: false, defaultValue: "gridfs",
    hint: "Recordings already saved stay where they are and keep playing.",
    options: [
      { value: "gridfs", label: "MongoDB (GridFS), default" },
      { value: "s3", label: "Amazon S3 (private bucket)" },
    ],
    check: (v) => (v === "gridfs" || v === "s3" ? null : "Choose where recordings are stored."),
  },
  {
    name: "S3_RECORDINGS_BUCKET", label: "S3 bucket", group: "recordings", secret: false, placeholder: "ukvalley-interview-recordings",
    hint: "A private bucket (Block all public access on).",
    check: (v) => (/^[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]$/.test(v) ? null : "Use a valid S3 bucket name (lowercase letters, digits, dots and dashes)."),
  },
  {
    name: "AWS_REGION", label: "AWS region", group: "recordings", secret: false, defaultValue: "ap-south-1", placeholder: "ap-south-1",
    hint: "The bucket's region. Leave empty for ap-south-1 (Mumbai).",
    check: (v) => (/^[a-z]{2}(-[a-z]+)+-\d{1,2}$/.test(v) ? null : "Use a region such as ap-south-1."),
  },
  {
    name: "AWS_ACCESS_KEY_ID", label: "AWS access key ID", group: "recordings", secret: true, placeholder: "AKIA…",
    hint: "An IAM user allowed only s3:PutObject, s3:GetObject and s3:DeleteObject on this bucket.",
    check: (v) => (/^[A-Z0-9]{16,128}$/.test(v) ? null : "An access key ID is capital letters and digits."),
  },
  {
    name: "AWS_SECRET_ACCESS_KEY", label: "AWS secret access key", group: "recordings", secret: true,
    hint: "Shown once, when the access key is created.",
    check: noSpaces("The secret access key", 20, 200),
  },
  {
    name: "RECORDING_ENCRYPTION_KEY", label: "Recording encryption key", group: "recordings", secret: true,
    hint: "Optional extra key for encrypting recordings (at least 16 characters). It can only be set or changed while no recordings are stored: a different key could not open the ones already saved.",
    check: (v) => (v.length < 16 ? "Use at least 16 characters." : v.length > 200 ? "Use at most 200 characters." : null),
  },
  {
    name: "INTERVIEW_BASE_URL", label: "Interview link address", group: "links", secret: false, placeholder: "https://www.ukvalley.com",
    hint: "Leave empty to use the website's own address.",
    check: (v) => {
      try {
        const u = new URL(v);
        return (u.protocol === "https:" || (u.protocol === "http:" && /^(localhost|127\.0\.0\.1)$/.test(u.hostname))) && u.pathname === "/" && !u.search
          ? null
          : "Use the site address only, e.g. https://www.ukvalley.com (https, no path).";
      } catch {
        return "Use the site address, e.g. https://www.ukvalley.com.";
      }
    },
  },
];

export const KEY_NAMES = KEY_DEFS.map((d) => d.name);
export type KeyName = (typeof KEY_DEFS)[number]["name"];
export const keyDef = (name: string) => KEY_DEFS.find((d) => d.name === name);

/** What the admin page shows for one key (never the secret itself). */
export type KeyStatus = {
  name: string;
  /** where the value in use comes from */
  source: "settings" | "env" | "default" | "none";
  /** plain values: the value in use; secrets: "••••" + last 4 */
  display: string;
  /** plain values saved in the admin (to prefill the box) */
  savedValue: string;
  updatedAt: string | null;
  updatedBy: string | null;
  /** saved, but it can't be decrypted (AUTH_SECRET changed): enter it again */
  unreadable: boolean;
  /** RECORDING_ENCRYPTION_KEY while recordings exist */
  locked: boolean;
};

export const mask = (v: string) => (v ? `••••${v.slice(-4)}` : "");
