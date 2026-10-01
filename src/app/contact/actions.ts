"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { hasDatabaseUrl } from "@/lib/db/client";
import { validateEnquiry } from "@/lib/contact-validation";
import { createLead } from "@/lib/leads-store";

export type EnquiryResult =
  | { ok: true }
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

/** Public enquiry form (Contact page and the scoping popup). */
export async function submitEnquiryAction(formData: FormData): Promise<EnquiryResult> {
  // Honeypot: real visitors never see or fill this field. Pretend it worked.
  if (String(formData.get("website") ?? "").trim()) return { ok: true };

  const result = validateEnquiry(formData);
  if (!result.ok) return { ok: false, kind: "invalid", errors: result.errors };

  if (!hasDatabaseUrl()) return { ok: false, kind: "unavailable" };

  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0].trim() || "local";
  if (ipLimited(ip)) return { ok: false, kind: "limited" };

  try {
    const outcome = await createLead(result.value);
    if (outcome === "limited") return { ok: false, kind: "limited" };
  } catch {
    return { ok: false, kind: "unavailable" };
  }
  revalidatePath("/admin/leads");
  revalidatePath("/admin");
  return { ok: true };
}
