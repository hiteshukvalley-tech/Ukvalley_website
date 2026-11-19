import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { hasDatabaseUrl } from "@/lib/db/client";
import { findOpenCareer } from "@/lib/careers-store";
import { getSiteSettings } from "@/lib/settings";
import { checkApplicationLimits, createApplication, markEmailsSent } from "@/lib/applications-store";
import { emailBrand, sendApplicationEmails } from "@/lib/application-emails";
import { API_HOST, API_URL, SITE_HOST, trustedRequestOrigin } from "@/lib/site-origin";
import { clientIp } from "@/lib/client-ip";
import { onApplicationCreated } from "@/lib/ai-interview/lifecycle";
import {
  ROLE_CLOSED_MESSAGE, RESUME_MAX_BYTES, closedRoleHref, looksLikePdf, readApplication, resumeError, validateApplication, type ApplyResult,
} from "@/lib/applications-validation";

export const dynamic = "force-dynamic";

const json = (body: ApplyResult, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

// Per-IP cap on top of the per-email limits in the store. In-memory and
// per-instance, like the contact form's.
const IP_LIMIT = 10;
const IP_WINDOW_MS = 60 * 60 * 1000;
const MAX_TRACKED = 5000;
const byIp = new Map<string, number[]>();

function ipLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (byIp.get(ip) ?? []).filter((t) => now - t < IP_WINDOW_MS);
  if (recent.length >= IP_LIMIT) {
    byIp.set(ip, recent);
    return true;
  }
  if (!byIp.has(ip) && byIp.size >= MAX_TRACKED) {
    for (const [k, ts] of byIp) if (ts.every((t) => now - t >= IP_WINDOW_MS)) byIp.delete(k);
    for (const k of byIp.keys()) {
      if (byIp.size < MAX_TRACKED) break;
      byIp.delete(k);
    }
  }
  recent.push(now);
  byIp.set(ip, recent);
  return false;
}

/** A form sent back with field messages doesn't count: fixing a typo must never lock a candidate out. */
function refundAttempt(ip: string) {
  byIp.get(ip)?.pop();
}

/**
 * Whether the request came from this site's own pages. Browsers send Origin
 * on every cross-site POST (Referer as a fallback), so another site can't make
 * a visitor's browser submit applications here.
 */
function sameSite(h: Headers): boolean {
  const source = h.get("origin") || h.get("referer");
  if (!source) return false;
  let host: string;
  try {
    host = new URL(source).hostname.toLowerCase();
  } catch {
    return false;
  }
  // `next dev` on the local network (npm run dev:mobile) is opened at 192.168.x.x.
  if (process.env.NODE_ENV === "development") return true;
  if (host === SITE_HOST || host === API_HOST) return true;
  const render = (process.env.RENDER_EXTERNAL_HOSTNAME ?? "").trim().toLowerCase();
  if (render && host === render) return true;
  // A local page only for a server reached locally (a production build run on
  // this machine for QA): on the live site a page on someone's localhost
  // can't post applications.
  const local = /^(?:localhost|127\.0\.0\.1|\[::1\])$/;
  const served = (h.get("host") ?? "").replace(/:\d+$/, "").toLowerCase();
  return local.test(host) && local.test(served);
}

/** Public Careers application form: details plus a PDF resume. */
export async function POST(request: Request) {
  if (!sameSite(request.headers)) {
    return json({ ok: false, kind: "invalid", errors: { form: "Could not read the form. Please reload the page and try again." } }, 403);
  }

  // Refuse oversized (or unsized) requests before reading the body.
  const declared = Number(request.headers.get("content-length") ?? NaN);
  if (!Number.isFinite(declared) || declared > RESUME_MAX_BYTES + 256 * 1024) {
    return json({ ok: false, kind: "too-large", message: `The resume must be ${RESUME_MAX_BYTES / 1024 / 1024} MB or smaller.` }, 413);
  }

  // Count the attempt before reading (and buffering) the upload.
  const ip = clientIp(request.headers);
  if (ipLimited(ip)) {
    return json({ ok: false, kind: "limited", message: "Too many applications from this connection. Please try again later." }, 429);
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return json({ ok: false, kind: "invalid", errors: { form: "Could not read the form. Please try again." } }, 400);
  }

  // Honeypot: real visitors never see or fill this field. Pretend it worked.
  if (String(form.get("website") ?? "").trim()) return json({ ok: true });

  const input = readApplication(form);
  const errors = validateApplication(input);
  const file = form.get("resume");
  const resume = typeof file === "string" ? null : file;
  let bytes: Uint8Array | null = null;
  const fileError = resumeError(resume);
  if (fileError) errors.resume = fileError;
  else {
    bytes = new Uint8Array(await resume!.arrayBuffer());
    // The extension and browser type can be faked; check the file itself.
    if (!looksLikePdf(bytes)) errors.resume = "That file isn't a valid PDF. Please upload your resume as a PDF.";
  }
  // Answered with 200: a field message is a normal outcome for a form, and a
  // 4xx would log an error in the visitor's browser console.
  if (Object.keys(errors).length) {
    refundAttempt(ip);
    return json({ ok: false, kind: "invalid", errors });
  }

  if (!hasDatabaseUrl()) {
    return json({ ok: false, kind: "unavailable", message: "Applications can't be received right now." }, 503);
  }
  try {
    // Only roles that are open right now take applications. Checked against
    // the database itself (not the cached list), so a role moved to drafts stops
    // taking applications at once, even from a page or shared link opened while
    // it was still live. The position is also repeated in the email sent to the
    // applicant, so free text is never accepted.
    const [check, settings] = await Promise.all([findOpenCareer(input.position), getSiteSettings()]);
    if (check.status === "unavailable") {
      return json({ ok: false, kind: "unavailable", message: "Applications can't be received right now." }, 503);
    }
    if (check.status === "closed") {
      return json({ ok: false, kind: "closed", message: ROLE_CLOSED_MESSAGE, redirectTo: closedRoleHref(check.slug) });
    }
    const match = check.career;
    input.position = match.role;

    const limit = await checkApplicationLimits(input.email, input.position);
    if (limit === "duplicate") {
      return json({ ok: false, kind: "duplicate", message: "You've already applied for this position. Our HR team will be in touch." });
    }
    if (limit === "limited") {
      return json({ ok: false, kind: "limited", message: "You've sent several applications recently. Please try again later." }, 429);
    }

    const app = await createApplication(
      { ...input, careerSlug: match.slug },
      { bytes: bytes!, name: resume!.name }
    );

    // Email HR and the applicant after replying, so the visitor isn't kept waiting.
    // The link HR gets: the admin panel's address (API_URL), never one taken from
    // a forged Host header. On a local test server, that server.
    const here = trustedRequestOrigin(request.headers);
    const origin = here && /^https?:\/\/(localhost|127\.0\.0\.1)[:/]?/.test(here) ? here : API_URL;
    const resumeBuffer = Buffer.from(bytes!);
    after(async () => {
      // Each step on its own: a mail-server problem must never stop the AI interview, and the other way round.
      try {
        const sent = await sendApplicationEmails(app, {
          hrEmail: settings.hr.email,
          adminUrl: `${origin}/admin/applications/${app.id}`,
          resume: resumeBuffer,
          brand: emailBrand(settings),
        });
        await markEmailsSent(app.id, sent).catch(() => {});
      } catch (e) {
        console.error("[careers] application emails failed:", e instanceof Error ? e.message : e);
      }
      // AI interview: creates, schedules and sends the invitation when it's on (Admin → AI interviews → Settings).
      try {
        await onApplicationCreated(app);
      } catch (e) {
        console.error("[careers] AI interview setup failed:", e instanceof Error ? e.message : e);
      }
    });
  } catch {
    return json({ ok: false, kind: "unavailable", message: "Applications can't be received right now." }, 503);
  }

  revalidatePath("/admin/applications");
  revalidatePath("/admin");
  return json({ ok: true });
}
