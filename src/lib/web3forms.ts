/**
 * Web3Forms (https://web3forms.com): emails each enquiry to the inbox that
 * owns the access key. Browser only: Web3Forms' free plan refuses
 * server-side submissions.
 *
 * Config (read at build time — rebuild after changing it):
 *   NEXT_PUBLIC_WEB3FORMS_KEY=<access key>   empty → switched off
 * The access key is public by design (it can only send to its own inbox).
 */

const rawKey = (process.env.NEXT_PUBLIC_WEB3FORMS_KEY ?? "").trim();
// Keys are UUIDs. Anything else (a placeholder, a typo) counts as unset.
export const WEB3FORMS_KEY = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(rawKey) ? rawKey : "";

const ENDPOINT = "https://api.web3forms.com/submit";

/**
 * Sends one enquiry. Resolves true when Web3Forms accepted it; never throws.
 * `fields` become the email's rows, in order. `replyTo` lets the inbox
 * answer the visitor directly.
 */
export async function sendToWeb3Forms({
  subject,
  fromName,
  replyTo,
  fields,
}: {
  subject: string;
  fromName: string;
  replyTo?: string;
  fields: Record<string, string>;
}): Promise<boolean> {
  if (!WEB3FORMS_KEY || typeof window === "undefined") return false;
  // FormData, not JSON: a JSON body needs a CORS preflight, and Web3Forms'
  // Cloudflare front answers preflights with 403.
  const body = new FormData();
  body.set("access_key", WEB3FORMS_KEY);
  body.set("subject", subject);
  body.set("from_name", fromName);
  if (replyTo) body.set("replyto", replyTo);
  for (const [k, v] of Object.entries(fields)) body.set(k, v);
  try {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { Accept: "application/json" },
      body,
      // Still delivered if the visitor leaves the page right after submitting.
      keepalive: true,
    });
    const json = (await res.json().catch(() => null)) as { success?: boolean } | null;
    return res.ok && json?.success === true;
  } catch {
    return false;
  }
}
