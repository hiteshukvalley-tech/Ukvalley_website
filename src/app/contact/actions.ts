"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { after } from "next/server";
import { escapeHtml, hasMailer, sendMail } from "@/lib/mailer";
import { getSiteSettings } from "@/lib/settings";
import { WEB3FORMS_KEY } from "@/lib/web3forms";
import type { EnquiryInput } from "@/lib/contact-validation";
import { hasDatabaseUrl } from "@/lib/db/client";
import { validateEnquiry } from "@/lib/contact-validation";
import { createLead } from "@/lib/leads-store";
import { clientIp } from "@/lib/client-ip";

export type EnquiryResult =
  // duplicate: the same enquiry was just saved (a double submit); its email copy already went out.
  | { ok: true; duplicate?: boolean }
  | { ok: false; kind: "invalid"; errors: Record<string, string> }
  // The enquiry was not saved (no database, or it failed). The form falls
  // back to the visitor's email app so the enquiry is never lost.
  | { ok: false; kind: "unavailable" }
  | { ok: false; kind: "limited" };

// Per-IP cap on saved enquiries, on top of the per-email limit in createLead —
// a bot rotating email addresses would otherwise flood the leads inbox.
// In-memory and per-instance, like the admin login throttle.
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

/**
 * Emails a new enquiry to the company inbox through the site's SMTP. Only
 * when Web3Forms is off: with a Web3Forms key the browser already sends the
 * copy, and two emails per enquiry would be noise. Never throws.
 */
async function emailLead(v: EnquiryInput) {
  try {
    if (WEB3FORMS_KEY || !(await hasMailer())) return;
    const settings = await getSiteSettings();
    const to = settings.sales.email || settings.email;
    if (!to) return;
    const kind = v.source === "scoping-popup" ? "scoping call request" : "project enquiry";
    const rows: [string, string][] = [
      ["Name", v.name], ["Email", v.email], ["Phone", v.phone], ["Company", v.company],
      ["Service", v.service], ["Budget", v.budget], ["Form", v.source === "scoping-popup" ? "Scoping popup" : "Contact page"],
    ];
    const filled = rows.filter(([, val]) => val);
    await sendMail({
      to,
      replyTo: v.email,
      fromName: "Ukvalley Website",
      subject: `New ${kind} from ${v.name}`.replace(/[\r\n]+/g, " ").slice(0, 150),
      text: `${filled.map(([k, val]) => `${k}: ${val}`).join("\n")}\n\nMessage:\n${v.message}\n\nSaved in Admin → Leads.`,
      html: `<div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.6;color:#1f2937;max-width:600px">
<h2 style="margin:0 0 12px;font-size:19px">New ${escapeHtml(kind)}</h2>
<table style="border-collapse:collapse">${filled.map(([k, val]) => `<tr><td style="padding:2px 12px 2px 0;color:#6b7280">${escapeHtml(k)}</td><td>${escapeHtml(val)}</td></tr>`).join("")}</table>
<p style="margin:16px 0 4px;color:#6b7280">Message</p>
<p style="margin:0;white-space:pre-wrap">${escapeHtml(v.message)}</p>
<p style="margin:16px 0 0;color:#6b7280;font-size:13px">Saved in Admin → Leads.</p>
</div>`,
    });
  } catch (e) {
    console.error("[leads] could not email the enquiry:", e instanceof Error ? e.message : e);
  }
}

/** Public enquiry form (Contact page and the scoping popup). */
export async function submitEnquiryAction(formData: FormData): Promise<EnquiryResult> {
  // Honeypot: real visitors never see or fill this field. Pretend it worked.
  if (String(formData.get("website") ?? "").trim()) return { ok: true };

  const result = validateEnquiry(formData);
  if (!result.ok) return { ok: false, kind: "invalid", errors: result.errors };

  if (!hasDatabaseUrl()) return { ok: false, kind: "unavailable" };

  const ip = clientIp(await headers());
  if (ipLimited(ip)) return { ok: false, kind: "limited" };

  let duplicate = false;
  try {
    const outcome = await createLead(result.value);
    if (outcome === "limited") return { ok: false, kind: "limited" };
    duplicate = outcome === "duplicate";
  } catch {
    return { ok: false, kind: "unavailable" };
  }
  if (duplicate) return { ok: true, duplicate: true };
  const lead = result.value;
  after(() => emailLead(lead));
  revalidatePath("/admin/leads");
  revalidatePath("/admin");
  return { ok: true };
}
