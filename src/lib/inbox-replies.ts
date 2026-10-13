import { ImapFlow } from "imapflow";
import { getDb, hasDatabaseUrl } from "@/lib/db/client";
import type { SmtpConfig } from "@/lib/smtp-settings";

// Emails applicants sent to HR: replies to status emails, questions about a
// role, and so on. Read from the mailbox's INBOX over IMAP with the same login
// as the SMTP settings (HR, or a user's own), so nothing extra has to be set
// up. Gmail: IMAP must be on (Gmail → Settings → Forwarding and POP/IMAP); the
// App Password already used for sending works for reading too.
// Only messages from someone who has applied are returned, so newsletters and
// other mail in the inbox never reach the dashboard. Server-only.

export type InboxReply = {
  /** Message-ID header (or mailbox + UID), unique per message */
  id: string;
  fromName: string;
  fromEmail: string;
  subject: string;
  receivedAt: Date;
  /** the sender's latest application, when they applied */
  applicationId: string | null;
  position: string;
  /** whose mailbox it arrived in, e.g. "hr@ukvalley.com" */
  mailbox: string;
};

/** How far back the inbox is read. */
export const REPLY_WINDOW_DAYS = 7;
const MAX_MESSAGES = 200;
const CACHE_MS = 2 * 60 * 1000;

type Result = { items: InboxReply[]; error?: string };
const g = globalThis as unknown as { _inboxCache?: Map<string, { at: number; value: Promise<Result> }> };
const cache = () => (g._inboxCache ??= new Map());

/** smtp.gmail.com → imap.gmail.com; any other host is assumed to serve IMAP too. */
export const imapHostFor = (smtpHost: string) => smtpHost.trim().replace(/^smtp\./i, "imap.");

type Envelope = { from: string; name: string; subject: string; date: Date; id: string };

/** Opens the mailbox's INBOX read-only, runs `fn`, and always signs out. */
async function withInbox<T>(cfg: SmtpConfig, fn: (client: ImapFlow) => Promise<T>): Promise<T> {
  const client = new ImapFlow({
    host: imapHostFor(cfg.host),
    port: 993,
    secure: true,
    auth: { user: cfg.user, pass: cfg.pass },
    logger: false,
    connectionTimeout: 8000,
    greetingTimeout: 8000,
    socketTimeout: 20000,
  });
  // A dropped connection emits "error"; without a listener that would crash the server.
  client.on("error", () => {});
  await client.connect();
  try {
    const lock = await client.getMailboxLock("INBOX", { readOnly: true });
    try {
      return await fn(client);
    } finally {
      lock.release();
    }
  } finally {
    await client.logout().catch(() => client.close());
  }
}

/** The mailbox's own addresses: its emails are HR's, never an applicant's. */
const ownAddresses = (cfg: SmtpConfig) => new Set([cfg.user, cfg.fromEmail].map((a) => a.trim().toLowerCase()).filter(Boolean));

const imapError = (cfg: SmtpConfig, e: unknown) => {
  const msg = e instanceof Error ? e.message : String(e);
  return /auth|login|credentials|invalid/i.test(msg)
    ? `Could not sign in to ${cfg.user} over IMAP. Check that IMAP is turned on for this mailbox.`
    : `Could not read the inbox of ${cfg.user} (${msg.slice(0, 120)}).`;
};

async function readInbox(cfg: SmtpConfig): Promise<Envelope[]> {
  return withInbox(cfg, async (client) => {
    const since = new Date(Date.now() - REPLY_WINDOW_DAYS * 24 * 60 * 60 * 1000);
    const uids = await client.search({ since }, { uid: true });
    if (!uids || uids.length === 0) return [];
    const recent = uids.slice(-MAX_MESSAGES);
    const messages = await client.fetchAll(recent, { uid: true, envelope: true, internalDate: true }, { uid: true });
    return messages.flatMap((m) => {
      const from = m.envelope?.from?.[0];
      if (!from?.address) return [];
      const raw = m.internalDate ?? m.envelope?.date;
      const date = raw ? new Date(raw) : new Date();
      return [{
        from: from.address.toLowerCase(),
        name: from.name ?? "",
        subject: m.envelope?.subject ?? "",
        date,
        id: m.envelope?.messageId || `${cfg.user}#${m.uid}`,
      }];
    });
  });
}

async function load(cfg: SmtpConfig): Promise<Result> {
  let envelopes: Envelope[];
  try {
    envelopes = await readInbox(cfg);
  } catch (e) {
    return { items: [], error: imapError(cfg, e) };
  }
  if (!envelopes.length || !hasDatabaseUrl()) return { items: [] };

  // Keep only applicants' emails (never the mailbox's own), and link each to their latest application.
  const own = ownAddresses(cfg);
  envelopes = envelopes.filter((e) => !own.has(e.from));
  const senders = [...new Set(envelopes.map((e) => e.from))];
  const apps = await getDb()
    .collection<{ _id: string; email: string; position: string; createdAt: Date }>("applications")
    .find({ email: { $in: senders } }, { projection: { email: 1, position: 1, createdAt: 1 } })
    .sort({ createdAt: 1 })
    .toArray();
  const latest = new Map(apps.map((a) => [a.email.toLowerCase(), a]));
  const items = envelopes
    .filter((e) => latest.has(e.from))
    .map((e) => {
      const app = latest.get(e.from)!;
      return {
        id: e.id,
        fromName: e.name,
        fromEmail: e.from,
        subject: e.subject,
        receivedAt: e.date,
        applicationId: app._id,
        position: app.position,
        mailbox: cfg.user,
      };
    })
    .sort((a, b) => b.receivedAt.getTime() - a.receivedAt.getTime());
  return { items };
}

/**
 * Applicants' emails from the last week in these mailboxes, newest first.
 * Each mailbox is read at most every two minutes (results are kept in memory).
 */
export async function listApplicantReplies(configs: SmtpConfig[]): Promise<Result> {
  const unique = [...new Map(configs.map((c) => [`${c.host.toLowerCase()}|${c.user.toLowerCase()}`, c])).entries()];
  const results = await Promise.all(
    unique.map(([key, cfg]) => {
      const hit = cache().get(key);
      if (hit && Date.now() - hit.at < CACHE_MS) return hit.value;
      const value = load(cfg).catch((e): Result => ({ items: [], error: e instanceof Error ? e.message : "Could not read the inbox." }));
      cache().set(key, { at: Date.now(), value });
      return value;
    })
  );
  const seen = new Set<string>();
  const items = results
    .flatMap((r) => r.items)
    .filter((i) => (seen.has(i.id) ? false : (seen.add(i.id), true)))
    .sort((a, b) => b.receivedAt.getTime() - a.receivedAt.getTime());
  const errors = results.map((r) => r.error).filter(Boolean);
  return { items, ...(errors.length ? { error: errors.join(" ") } : {}) };
}

// --- one applicant's messages (the chat in Admin → Careers → Email logs) ------

export type InboxMessage = {
  id: string;
  fromName: string;
  fromEmail: string;
  subject: string;
  receivedAt: Date;
  /** the message text, without the quoted earlier emails below it */
  text: string;
  mailbox: string;
};

/** How far back an applicant's chat reads the inbox. */
export const CHAT_WINDOW_DAYS = 180;
const CHAT_MAX_MESSAGES = 40;
const CHAT_CACHE_MS = 30 * 1000;
const gc = globalThis as unknown as { _chatCache?: Map<string, { at: number; value: Promise<{ items: InboxMessage[]; error?: string }> }> };
const chatCache = () => (gc._chatCache ??= new Map());

type Part = { part?: string; type: string; disposition?: string; childNodes?: Part[] };

/** The text part to show: text/plain if there is one, else text/html (not attachments). */
function textPart(node: Part | undefined): { part: string; html: boolean } | null {
  if (!node) return null;
  const attachment = node.disposition?.toLowerCase() === "attachment";
  if (!node.childNodes?.length) {
    if (attachment) return null;
    if (node.type === "text/plain") return { part: node.part ?? "1", html: false };
    if (node.type === "text/html") return { part: node.part ?? "1", html: true };
    return null;
  }
  const found = node.childNodes.map(textPart).filter((p): p is { part: string; html: boolean } => !!p);
  return found.find((p) => !p.html) ?? found[0] ?? null;
}

const htmlToText = (html: string) =>
  html
    .replace(/<(style|script)[\s\S]*?<\/\1>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li|tr|h\d)>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");

/** Drops the quoted earlier emails a reply carries ("On … wrote:", "> …", "-----Original Message-----"). */
export function stripQuoted(text: string): string {
  let t = text.replace(/\r\n?/g, "\n");
  const cut = [
    /\n[^\n]*On [^\n]*(\n[^\n]*)?wrote:\s*\n/,
    /\n-{2,}\s*Original Message\s*-{2,}/i,
    /\n_{5,}\s*\nFrom:/,
    /\nFrom: [^\n]+\n(Sent|Date): /,
  ]
    .map((rx) => t.search(rx))
    .filter((i) => i >= 0);
  if (cut.length) t = t.slice(0, Math.min(...cut));
  t = t
    .split("\n")
    .filter((l) => !l.startsWith(">"))
    .join("\n");
  return t.replace(/\n{3,}/g, "\n\n").trim().slice(0, 5000);
}

async function readFrom(cfg: SmtpConfig, email: string): Promise<InboxMessage[]> {
  // Mail "from" the mailbox itself is HR's own (e.g. a test applicant using the HR address).
  if (ownAddresses(cfg).has(email)) return [];
  return withInbox(cfg, async (client) => {
    const since = new Date(Date.now() - CHAT_WINDOW_DAYS * 24 * 60 * 60 * 1000);
    const uids = await client.search({ from: email, since }, { uid: true });
    if (!uids || uids.length === 0) return [];
    const recent = uids.slice(-CHAT_MAX_MESSAGES);
    const messages = await client.fetchAll(recent, { uid: true, envelope: true, internalDate: true, bodyStructure: true }, { uid: true });
    const out: InboxMessage[] = [];
    for (const m of messages) {
      const from = m.envelope?.from?.[0];
      // IMAP's FROM search matches anywhere in the header; keep exact senders only.
      if (!from?.address || from.address.toLowerCase() !== email) continue;
      let text = "";
      const part = textPart(m.bodyStructure as Part | undefined);
      if (part) {
        const dl = await client.download(String(m.uid), part.part, { uid: true, maxBytes: 200_000 });
        if (dl.content) {
          const chunks: Buffer[] = [];
          for await (const c of dl.content) chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c));
          const raw = Buffer.concat(chunks).toString("utf8");
          text = stripQuoted(part.html ? htmlToText(raw) : raw);
        }
      }
      const raw = m.internalDate ?? m.envelope?.date;
      out.push({
        id: m.envelope?.messageId || `${cfg.user}#${m.uid}`,
        fromName: from.name ?? "",
        fromEmail: from.address.toLowerCase(),
        subject: m.envelope?.subject ?? "",
        receivedAt: raw ? new Date(raw) : new Date(),
        text,
        mailbox: cfg.user,
      });
    }
    return out;
  });
}

/**
 * Emails this applicant sent to these mailboxes in the last six months, oldest
 * first, with their text. Each mailbox is read at most every 30 seconds per applicant.
 */
export async function listMessagesFrom(configs: SmtpConfig[], email: string): Promise<{ items: InboxMessage[]; error?: string }> {
  const address = email.trim().toLowerCase();
  const unique = [...new Map(configs.map((c) => [`${c.host.toLowerCase()}|${c.user.toLowerCase()}`, c])).entries()];
  const results = await Promise.all(
    unique.map(([key, cfg]) => {
      const k = `${key}|${address}`;
      const hit = chatCache().get(k);
      if (hit && Date.now() - hit.at < CHAT_CACHE_MS) return hit.value;
      const value = readFrom(cfg, address)
        .then((items) => ({ items }))
        .catch((e) => ({ items: [] as InboxMessage[], error: imapError(cfg, e) }));
      chatCache().set(k, { at: Date.now(), value });
      return value;
    })
  );
  const seen = new Set<string>();
  const items = results
    .flatMap((r) => r.items)
    .filter((i) => (seen.has(i.id) ? false : (seen.add(i.id), true)))
    .sort((a, b) => a.receivedAt.getTime() - b.receivedAt.getTime());
  const errors = results.map((r) => ("error" in r ? r.error : undefined)).filter(Boolean);
  return { items, ...(errors.length ? { error: errors.join(" ") } : {}) };
}

/** Forgets the cached messages for this applicant (after HR sends one, to pick up a quick reply). */
export function clearChatCache(email: string) {
  const address = email.trim().toLowerCase();
  for (const k of chatCache().keys()) if (k.endsWith(`|${address}`)) chatCache().delete(k);
}
