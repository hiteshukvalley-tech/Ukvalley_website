import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { integrationKey } from "@/lib/integration-keys";

// WhatsApp messages through Meta's official WhatsApp Business Cloud API.
// Server-only. Needs, in the environment:
//   WHATSAPP_TOKEN            a permanent (system user) access token
//   WHATSAPP_PHONE_NUMBER_ID  the sending number's id (WhatsApp Manager → API setup)
//   WHATSAPP_API_VERSION      optional, default v21.0
//   WHATSAPP_APP_SECRET       the Meta app secret, to verify delivery webhooks
//   WHATSAPP_VERIFY_TOKEN     any string; also entered in Meta's webhook setup
// Messages a business starts must use a template approved in WhatsApp Manager;
// the template names live in Admin → AI interviews → Settings.

export const whatsappConfigured = () => Boolean(integrationKey("WHATSAPP_TOKEN") && integrationKey("WHATSAPP_PHONE_NUMBER_ID"));

/**
 * An E.164 number without "+", as the API wants it. Numbers typed without a
 * country code are taken as Indian mobiles (10 digits starting 6–9). Null when
 * it can't be a mobile number.
 */
export function toWhatsAppNumber(phone: string): string | null {
  const raw = phone.trim();
  const digits = raw.replace(/\D/g, "");
  if (raw.startsWith("+")) return digits.length >= 8 && digits.length <= 15 ? digits : null;
  if (digits.startsWith("00")) return toWhatsAppNumber(`+${digits.slice(2)}`);
  const local = digits.replace(/^0+/, "");
  if (/^[6-9]\d{9}$/.test(local)) return `91${local}`;
  if (/^91[6-9]\d{9}$/.test(digits)) return digits;
  return null;
}

export class WhatsAppError extends Error {
  constructor(message: string, readonly permanent: boolean) {
    super(message);
  }
}

/** Sends an approved template message. Returns the message id. */
export async function sendWhatsAppTemplate(to: string, template: { name: string; language: string }, params: string[]): Promise<string> {
  if (!whatsappConfigured()) throw new WhatsAppError("WhatsApp is not configured (WHATSAPP_TOKEN, WHATSAPP_PHONE_NUMBER_ID).", true);
  const version = integrationKey("WHATSAPP_API_VERSION") || "v21.0";
  const url = `https://graph.facebook.com/${encodeURIComponent(version)}/${encodeURIComponent(integrationKey("WHATSAPP_PHONE_NUMBER_ID"))}/messages`;
  const body = {
    messaging_product: "whatsapp",
    to,
    type: "template",
    template: {
      name: template.name,
      language: { code: template.language },
      ...(params.length
        ? {
            components: [
              {
                type: "body",
                // Template parameters can't contain newlines or tabs, or more than 4 spaces in a row.
                parameters: params.map((p) => ({ type: "text", text: p.replace(/[\r\n\t]+/g, " ").replace(/ {4,}/g, "   ").slice(0, 1000) || "-" })),
              },
            ],
          }
        : {}),
    },
  };
  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { Authorization: `Bearer ${integrationKey("WHATSAPP_TOKEN")}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(15_000),
    });
  } catch (e) {
    throw new WhatsAppError(`Could not reach WhatsApp: ${e instanceof Error ? e.message : e}`, false);
  }
  const data = (await res.json().catch(() => ({}))) as { messages?: { id: string }[]; error?: { message?: string; code?: number } };
  if (!res.ok || !data.messages?.[0]?.id) {
    const msg = data.error?.message ?? `HTTP ${res.status}`;
    // 4xx other than rate limits won't succeed on retry (bad number, template not approved…).
    throw new WhatsAppError(`WhatsApp: ${msg}`.slice(0, 400), res.status >= 400 && res.status < 500 && res.status !== 429);
  }
  return data.messages[0].id;
}

/** Verifies Meta's X-Hub-Signature-256 header over the raw request body. */
export function verifyWebhookSignature(rawBody: string, header: string | null): boolean {
  const secret = integrationKey("WHATSAPP_APP_SECRET");
  if (!secret || !header?.startsWith("sha256=")) return false;
  const expected = Buffer.from(createHmac("sha256", secret).update(rawBody, "utf8").digest("hex"));
  const given = Buffer.from(header.slice(7));
  return expected.length === given.length && timingSafeEqual(expected, given);
}
