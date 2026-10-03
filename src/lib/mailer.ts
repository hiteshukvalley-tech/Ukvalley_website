import nodemailer, { type Transporter } from "nodemailer";

// Outgoing email over SMTP (Gmail, Zoho, SES…), configured by the SMTP_* env
// vars. Server-only. For Gmail use an App Password, not the account password.

/** True when the SMTP env vars needed to send email are set. */
export const hasMailer = () =>
  Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);

const g = globalThis as unknown as { _mailer?: Transporter };

function transport(): Transporter {
  if (!g._mailer) {
    const port = Number(process.env.SMTP_PORT) || 465;
    g._mailer = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      // 465 is TLS from the start; 587/25 upgrade with STARTTLS.
      secure: port === 465,
      // Google shows App Passwords as "abcd efgh ijkl mnop"; the spaces aren't part of it.
      auth: { user: process.env.SMTP_USER?.trim(), pass: process.env.SMTP_PASS?.replace(/\s+/g, "") },
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 15_000,
    });
  }
  return g._mailer;
}

/** The sender address: MAIL_FROM's address, else SMTP_USER. */
function senderAddress(): string {
  const from = process.env.MAIL_FROM ?? "";
  return from.match(/<([^>]+)>/)?.[1] ?? (from.includes("@") ? from.trim() : (process.env.SMTP_USER ?? "").trim());
}

export type MailMessage = {
  to: string;
  subject: string;
  text: string;
  html: string;
  /** display name for this email only (e.g. "Ukvalley HR Team"); the address stays the sender's */
  fromName?: string;
  replyTo?: string;
  attachments?: { filename: string; content: Buffer; contentType: string }[];
};

export async function sendMail({ fromName, ...message }: MailMessage) {
  if (!hasMailer()) throw new Error("Email is not configured (set SMTP_HOST, SMTP_USER and SMTP_PASS).");
  // Gmail only sends from the signed-in address, so only the display name changes.
  const from = fromName ? { name: fromName, address: senderAddress() } : process.env.MAIL_FROM || process.env.SMTP_USER;
  await transport().sendMail({ from, ...message });
}

/** Escapes text for use inside an email's HTML. */
export const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
