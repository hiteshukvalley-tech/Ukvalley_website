import "server-only";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/admin-session";
import { canUseArea } from "@/lib/admin-access";
import type { SessionUser } from "@/lib/admin-auth";
import { hasDatabaseUrl } from "@/lib/db/client";
import { ensureIntegrationKeys } from "@/lib/integration-keys";
import { API_HOST, SITE_HOST } from "@/lib/site-origin";
import { AiError } from "./ai";
import { CalendarNotConnected } from "./google-calendar";
import { WhatsAppError } from "./whatsapp";

// Shared plumbing for the HR REST API (/admin/api/ai-interviews/…):
//   - the same signed-in session as the admin panel (cookie), re-checked
//     against the database on every call;
//   - the "AI interviews" section: admins always, team members (HR) only
//     when it is ticked for them in Admin → Users;
//   - writes must come from the panel's own origin (no cross-site requests);
//   - JSON in, JSON out: { ok: true, data } or { ok: false, error }.

export const AREA = "ai-interviews";

export const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" },
  });

export const ok = (data: unknown, status = 200) => json({ ok: true, data }, status);
export const fail = (error: string, status = 400, details?: unknown) => json({ ok: false, error, ...(details ? { details } : {}) }, status);

function sameOrigin(h: Headers): boolean {
  if (process.env.NODE_ENV === "development") return true;
  const source = h.get("origin") || h.get("referer");
  if (!source) return false;
  try {
    const host = new URL(source).hostname.toLowerCase();
    const own = (h.get("x-forwarded-host") ?? h.get("host") ?? "").split(",")[0].trim().replace(/:\d+$/, "").toLowerCase();
    // A page on this server's own address (localhost included, when that is
    // where it runs) or on the site's addresses. Any other localhost page is a
    // different app on the visitor's machine, so it no longer counts.
    return host === own || host === API_HOST || host === SITE_HOST;
  } catch {
    return false;
  }
}

/**
 * Runs an API handler for signed-in HR. Returns 401/403/503 itself; errors the
 * handler throws come back as 400 with their message (lifecycle.ts throws
 * messages meant for people, e.g. "This interview can't be rescheduled").
 */
export async function hrApi(request: Request, handler: (me: SessionUser) => Promise<Response>): Promise<Response> {
  const session = await getSession();
  if (!session) return fail("Sign in to the admin panel first.", 401);
  if (!canUseArea(session.role, session.access, AREA)) return fail("You don't have access to AI interviews.", 403);
  if (request.method !== "GET" && request.method !== "HEAD" && !sameOrigin(request.headers)) {
    return fail("Cross-site requests are not allowed.", 403);
  }
  if (!hasDatabaseUrl()) return fail("The database is not configured (MONGODB_URI).", 503);
  await ensureIntegrationKeys();
  try {
    return await handler(session);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Something went wrong.";
    if (!(e instanceof Error) || /mongo|ECONN|timed out/i.test(message) || /^Mongo/.test(e.name)) {
      console.error("[ai-interview] api error:", e);
      return fail("The service is temporarily unavailable. Try again shortly.", 503);
    }
    // An outside service (Claude, Google Calendar, WhatsApp) failed: its
    // message says what to fix (a missing key, a rate limit…), so HR sees it.
    if (e instanceof AiError || e instanceof CalendarNotConnected || e instanceof WhatsAppError) {
      console.error("[ai-interview] api error:", e.message);
      return fail(message, 502);
    }
    // The lifecycle throws plain Errors with messages meant for people. Anything
    // else (TypeError, a duplicate-key error…) is a bug: logged, never shown.
    if (e.constructor !== Error || /E11000|Cannot read propert|is not a function/.test(message)) {
      console.error("[ai-interview] api error:", e);
      return fail("Something went wrong. Try again, or reload the page.", 500);
    }
    return fail(message, 400);
  }
}

/** The request body as an object (JSON), or {} when it is missing or invalid. Capped at 64 KB. */
export async function readJson(request: Request): Promise<Record<string, unknown>> {
  try {
    const text = await request.text();
    if (!text || text.length > 64 * 1024) return {};
    const v = JSON.parse(text);
    return v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

/** A string query/body value, trimmed and capped. */
export const text = (v: unknown, max = 200) => (typeof v === "string" ? v.trim().slice(0, max) : "");

/** Positive integer from a query value, else the fallback. */
export const int = (v: unknown, fallback: number, max = 10_000) => {
  const n = Number(v);
  return Number.isInteger(n) && n > 0 ? Math.min(n, max) : fallback;
};

/** An ISO date-time ("2026-11-24T11:00:00+05:30" or …Z). A time without a zone is read as India time. */
export function isoDate(v: unknown): Date | null {
  const s = text(v, 40);
  if (!s) return null;
  const withZone = /[zZ]|[+-]\d{2}:?\d{2}$/.test(s) ? s : /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/.test(s) ? `${s.length === 16 ? `${s}:00` : s}+05:30` : "";
  if (!withZone) return null;
  const d = new Date(withZone);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Refreshes the admin pages after an API change, as the panel's own actions do. */
export function refreshPanel(id?: string) {
  revalidatePath("/admin/ai-interviews", "layout");
  if (id) revalidatePath(`/admin/ai-interviews/${id}`);
}
