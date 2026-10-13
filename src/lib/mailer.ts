import nodemailer, { type Transporter } from "nodemailer";
import { getSmtpConfigFor, type SmtpConfig } from "@/lib/smtp-settings";

// Outgoing email over SMTP (Gmail, Zoho, SES…). Server-only. The settings come
// from Admin → Site settings (HR SMTP), or the SMTP_* env vars when none are
// saved there; an email sent by an admin user goes through their own SMTP
// when they set one. For Gmail use an App Password, not the account password.

/** True when email can be sent (the user's own SMTP, the HR SMTP or the env vars). */
export const hasMailer = async (senderId?: string) => (await getSmtpConfigFor(senderId)) !== null;

function createTransport(c: SmtpConfig): Transporter {
  return nodemailer.createTransport({
    host: c.host,
    port: c.port,
    // "ssl": TLS from the start (465). "starttls": upgrade after connecting (587). "none": plain (local/test servers).
    secure: c.security === "ssl",
    requireTLS: c.security === "starttls",
    ignoreTLS: c.security === "none",
    // Google shows App Passwords as "abcd efgh ijkl mnop"; the spaces aren't part of it.
    auth: { user: c.user.trim(), pass: c.pass.replace(/\s+/g, "") },
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 15_000,
  });
}

// One transport per configuration (HR's and each user's own), kept for reuse.
// Changed settings make a new key; old ones are dropped once there are too many.
const MAX_TRANSPORTS = 20;
const g = globalThis as unknown as { _mailers?: Map<string, Transporter> };
const configKey = (c: SmtpConfig) => JSON.stringify([c.host, c.port, c.security, c.user, c.pass]);

function transport(c: SmtpConfig): Transporter {
  const pool = (g._mailers ??= new Map());
  const k = configKey(c);
  let t = pool.get(k);
  if (!t) {
    if (pool.size >= MAX_TRANSPORTS) {
      // Oldest first (Map keeps insertion order); nodemailer finishes a send in progress before closing.
      const [oldKey, old] = pool.entries().next().value!;
      pool.delete(oldKey);
      old.close();
    }
    t = createTransport(c);
    pool.set(k, t);
  }
  return t;
}

/** The sender address: the configured one, else the username. */
const senderAddress = (c: SmtpConfig) => (c.fromEmail || c.user).trim();

export type MailMessage = {
  to: string;
  subject: string;
  text: string;
  html: string;
  /** display name for this email only (e.g. "Ukvalley HR Team"); the address stays the sender's */
  fromName?: string;
  replyTo?: string;
  /** `cid` makes an attachment an inline image the HTML shows with src="cid:…" */
  attachments?: { filename: string; content: Buffer; contentType: string; cid?: string }[];
};

async function deliver(c: SmtpConfig, t: Transporter, { fromName, ...message }: MailMessage) {
  // Gmail only sends from the signed-in address, so only the display name changes.
  const name = fromName || c.fromName;
  const from = name ? { name, address: senderAddress(c) } : senderAddress(c);
  await t.sendMail({ from, ...message });
}

/**
 * Sends an email. With `senderId` (the admin user sending it), it goes through
 * their own SMTP when they set one: from their address and name, with replies
 * coming back to them. Otherwise through the HR SMTP.
 */
export async function sendMail(message: MailMessage, opts: { senderId?: string } = {}) {
  const smtp = await getSmtpConfigFor(opts.senderId);
  if (!smtp) throw new Error("Email is not configured (set it up in Admin → Site settings → HR email (SMTP)).");
  const own = smtp.source === "user";
  const { replyTo, ...rest } = message;
  await deliver(
    smtp.config,
    transport(smtp.config),
    own ? { ...rest, fromName: smtp.config.fromName || message.fromName } : { ...rest, ...(replyTo ? { replyTo } : {}) }
  );
}

/**
 * Connects with these settings (saved or not) and sends a test email.
 * Uses its own short-lived connection, so it never disturbs the live one.
 */
export async function sendTestEmail(c: SmtpConfig, to: string) {
  const t = createTransport(c);
  try {
    await t.verify();
    const when = new Date().toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" });
    await deliver(c, t, {
      to,
      subject: "Test email from the Ukvalley admin panel",
      text: `This is a test email from the Ukvalley admin panel (email SMTP settings), sent ${when}.\n\nServer: ${c.host}:${c.port}\nIf you received it, outgoing email works.`,
      html: `<div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.6;color:#1f2937;max-width:560px">
<h2 style="margin:0 0 8px;font-size:20px;color:#3100ff">Outgoing email works ✓</h2>
<p style="margin:0 0 12px">This is a test email from the Ukvalley admin panel (email SMTP settings), sent ${escapeHtml(when)}.</p>
<p style="margin:0;color:#6b7280;font-size:13px">Server: ${escapeHtml(c.host)}:${c.port} · Sender: ${escapeHtml(senderAddress(c))}</p>
</div>`,
    });
  } finally {
    t.close();
  }
}

/** Escapes text for use inside an email's HTML. */
export const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
