/**
 * Google Tag Manager + first-touch attribution. Safe to import anywhere.
 *
 * Only the GTM container is installed in code. GA4, Meta Pixel and every
 * other tag are added inside the GTM dashboard, never here.
 *
 * Config (read at build time — rebuild after changing it):
 *   NEXT_PUBLIC_GTM_ID=GTM-XXXXXXX   empty or malformed → no tracking at all
 *   NEXT_PUBLIC_GTM_ENABLED=false    switches tracking off for an environment
 *
 * Never put personal data (name, email, phone, message) in the dataLayer.
 */

const rawId = (process.env.NEXT_PUBLIC_GTM_ID ?? "").trim().toUpperCase();
const enabled = !/^(0|false|no|off)$/i.test((process.env.NEXT_PUBLIC_GTM_ENABLED ?? "").trim());
// The ID is written into an inline script, so only the GTM format is accepted.
// The .env.example placeholder (GTM-XXXXXXX) counts as unset.
const placeholder = /^GTM-X+$/.test(rawId);
const validId = !placeholder && /^GTM-[A-Z0-9]{4,12}$/.test(rawId);

if (rawId && !validId && !placeholder && typeof window === "undefined") {
  console.warn(`[gtm] NEXT_PUBLIC_GTM_ID "${rawId}" is not a GTM container ID (GTM-XXXXXXX); tracking is off.`);
}

/** The container ID to load, or "" when tracking is off. */
export const GTM_ID = enabled && validId ? rawId : "";

/** Public pages only: /admin URLs carry applicant emails (e.g. ?chat=<email>). */
export const isTrackedPath = (pathname: string) => !/^\/admin(\/|$)/i.test(pathname);

type DataLayerEvent = Record<string, unknown>;

declare global {
  interface Window {
    dataLayer?: DataLayerEvent[];
  }
}

function push(event: DataLayerEvent) {
  if (!GTM_ID || typeof window === "undefined") return;
  (window.dataLayer ??= []).push(event);
}

/* ------------------------------------------------------------------ */
/* Attribution: UTM tags, ad click IDs and the referrer                */
/* ------------------------------------------------------------------ */

const COOKIE = "uk_attribution";
const MAX_AGE = 30 * 24 * 60 * 60; // 30 days
const URL_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "gclid", "fbclid"] as const;

export type Attribution = Partial<Record<(typeof URL_KEYS)[number] | "referrer" | "landing_page" | "captured_at", string>>;

const clip = (v: string) => v.trim().slice(0, 200);

export function readAttribution(): Attribution {
  if (typeof document === "undefined") return {};
  const cookie = document.cookie.split("; ").find((c) => c.startsWith(`${COOKIE}=`));
  if (!cookie) return {};
  try {
    const parsed: unknown = JSON.parse(decodeURIComponent(cookie.slice(COOKIE.length + 1)));
    return parsed && typeof parsed === "object" ? (parsed as Attribution) : {};
  } catch {
    return {};
  }
}

function writeAttribution(value: Attribution) {
  const secure = location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${COOKIE}=${encodeURIComponent(JSON.stringify(value))}; Max-Age=${MAX_AGE}; Path=/; SameSite=Lax${secure}`;
}

/** Another site that sent the visitor here, without its query string; "" otherwise. */
function externalReferrer() {
  try {
    const ref = new URL(document.referrer);
    return ref.hostname === location.hostname ? "" : clip(ref.origin + ref.pathname);
  } catch {
    return "";
  }
}

/**
 * Stores the visit's attribution in a 30-day first-party cookie and pushes
 * "utm_captured". The first touch is kept until a visit arrives with new UTM
 * tags or click IDs, which replace it.
 */
export function captureAttribution() {
  if (!GTM_ID || typeof window === "undefined") return;
  const params = new URLSearchParams(location.search);
  const fresh: Attribution = {};
  for (const key of URL_KEYS) {
    const v = params.get(key);
    if (v && v.trim()) fresh[key] = clip(v);
  }

  let attribution = readAttribution();
  const hasNew = Object.keys(fresh).length > 0;
  if (hasNew || !attribution.captured_at) {
    attribution = {
      ...fresh,
      referrer: externalReferrer(),
      landing_page: clip(location.pathname),
      captured_at: new Date().toISOString(),
    };
    writeAttribution(attribution);
  }
  push({ event: "utm_captured", ...attributionFields(attribution) });
}

/** Every attribution key, empty when unknown, so GTM variables never hold stale values. */
function attributionFields(a: Attribution = readAttribution()) {
  return Object.fromEntries(
    [...URL_KEYS, "referrer", "landing_page"].map((k) => [k, a[k as keyof Attribution] ?? ""]),
  );
}

/* ------------------------------------------------------------------ */
/* Events                                                              */
/* ------------------------------------------------------------------ */

/** Pushes a dataLayer event with the stored attribution. No personal data in `data`. */
export function trackEvent(name: string, data: DataLayerEvent = {}) {
  push({ event: name, ...attributionFields(), ...data });
}

export function trackPageView() {
  push({
    event: "page_view",
    page_location: location.href,
    page_path: location.pathname,
    page_title: document.title,
  });
}
