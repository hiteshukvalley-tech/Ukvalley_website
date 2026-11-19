import { timingSafeEqual } from "node:crypto";
import { ensureIntegrationKeys, integrationKey } from "@/lib/integration-keys";
import { verifyWebhookSignature } from "@/lib/ai-interview/whatsapp";
import { updateNotificationByProviderId, type NotificationStatus } from "@/lib/ai-interview/store";

// WhatsApp delivery receipts (Meta webhook): marks interview messages as
// delivered, read or failed in Admin → AI interviews → Notifications.
// Set up in the Meta app: Webhooks → WhatsApp Business Account → callback
// URL <API_URL>/whatsapp/webhook, verify token = WHATSAPP_VERIFY_TOKEN,
// subscribe to "messages". Every POST must carry Meta's signature.

export const dynamic = "force-dynamic";

/** Meta's one-time verification handshake. */
export async function GET(request: Request) {
  const p = new URL(request.url).searchParams;
  await ensureIntegrationKeys();
  const expected = integrationKey("WHATSAPP_VERIFY_TOKEN");
  const given = p.get("hub.verify_token") ?? "";
  // Compare bytes, not characters: equal-length strings can differ in byte length (non-ASCII), and timingSafeEqual throws on that.
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  const ok = expected && a.length === b.length && timingSafeEqual(a, b);
  if (p.get("hub.mode") === "subscribe" && ok) return new Response(p.get("hub.challenge") ?? "", { status: 200 });
  return new Response("Forbidden", { status: 403 });
}

type StatusUpdate = { id?: string; status?: string; errors?: { title?: string; message?: string; error_data?: { details?: string } }[] };

export async function POST(request: Request) {
  await ensureIntegrationKeys();
  const raw = await request.text();
  if (raw.length > 512 * 1024 || !verifyWebhookSignature(raw, request.headers.get("x-hub-signature-256"))) {
    return new Response("Forbidden", { status: 403 });
  }
  try {
    const body = JSON.parse(raw) as { entry?: { changes?: { value?: { statuses?: StatusUpdate[] } }[] }[] };
    for (const entry of body.entry ?? []) {
      for (const change of entry.changes ?? []) {
        for (const s of change.value?.statuses ?? []) {
          const map: Record<string, NotificationStatus> = { sent: "sent", delivered: "delivered", read: "read", failed: "failed" };
          const status = s.status ? map[s.status] : undefined;
          if (!s.id || !status) continue;
          const err = s.errors?.[0];
          await updateNotificationByProviderId(s.id, status, err ? [err.title, err.message, err.error_data?.details].filter(Boolean).join(": ") : undefined);
        }
      }
    }
  } catch (e) {
    console.error("[whatsapp] webhook could not be processed:", e instanceof Error ? e.message : e);
  }
  // Always 200 for a signed request, so Meta doesn't keep retrying.
  return new Response("OK", { status: 200 });
}
