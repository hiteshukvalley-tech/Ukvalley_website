import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { hasDatabaseUrl } from "@/lib/db/client";
import { getCareers } from "@/lib/careers-store";
import { getSiteSettings } from "@/lib/settings";
import { checkApplicationLimits, createApplication, markEmailsSent } from "@/lib/applications-store";
import { sendApplicationEmails } from "@/lib/application-emails";
import { SITE_ORIGIN, trustedRequestOrigin } from "@/lib/site-origin";
import {
  RESUME_MAX_BYTES, looksLikePdf, readApplication, resumeError, validateApplication, type ApplyResult,
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
    for (const k of byIp.keys()) {
      if (byIp.size < MAX_TRACKED) break;
      byIp.delete(k);
    }
  }
  recent.push(now);
  byIp.set(ip, recent);
  return false;
}

/** Public Careers application form: details plus a PDF resume. */
export async function POST(request: Request) {
  // Refuse oversized (or unsized) requests before reading the body.
  const declared = Number(request.headers.get("content-length") ?? NaN);
  if (!Number.isFinite(declared) || declared > RESUME_MAX_BYTES + 256 * 1024) {
    return json({ ok: false, kind: "too-large", message: `The resume must be ${RESUME_MAX_BYTES / 1024 / 1024} MB or smaller.` }, 413);
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
  if (Object.keys(errors).length) return json({ ok: false, kind: "invalid", errors });

  if (!hasDatabaseUrl()) {
    return json({ ok: false, kind: "unavailable", message: "Applications can't be received right now." }, 503);
  }
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0].trim() || "local";
  if (ipLimited(ip)) {
    return json({ ok: false, kind: "limited", message: "Too many applications from this connection. Please try again later." }, 429);
  }

  try {
    const limit = await checkApplicationLimits(input.email, input.position);
    if (limit === "duplicate") {
      return json({ ok: false, kind: "duplicate", message: "You've already applied for this position. Our HR team will be in touch." });
    }
    if (limit === "limited") {
      return json({ ok: false, kind: "limited", message: "You've sent several applications recently. Please try again later." }, 429);
    }

    const [careers, settings] = await Promise.all([getCareers(), getSiteSettings()]);
    const match = careers.find((c) => c.role.toLowerCase() === input.position.toLowerCase());
    const app = await createApplication(
      { ...input, position: match?.role ?? input.position, careerSlug: match?.slug ?? null },
      { bytes: bytes!, name: resume!.name }
    );

    // Email HR and the applicant after replying, so the visitor isn't kept waiting.
    // The link HR gets: this site's address, never one taken from a forged Host header.
    const origin = trustedRequestOrigin(request.headers) ?? SITE_ORIGIN;
    const resumeBuffer = Buffer.from(bytes!);
    after(async () => {
      const sent = await sendApplicationEmails(app, {
        hrEmail: settings.hr.email,
        adminUrl: `${origin}/admin/applications/${app.id}`,
        resume: resumeBuffer,
      });
      await markEmailsSent(app.id, sent).catch(() => {});
    });
  } catch {
    return json({ ok: false, kind: "unavailable", message: "Applications can't be received right now." }, 503);
  }

  revalidatePath("/admin/applications");
  revalidatePath("/admin");
  return json({ ok: true });
}
