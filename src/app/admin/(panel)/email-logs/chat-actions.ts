"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin-session";
import { findApplicationByEmail } from "@/lib/applications-store";
import { isApplicationStatus, type ApplicationStatus } from "@/lib/applications-validation";
import { sendChatMessage } from "@/lib/application-emails";
import { emailKindLabel, listConversationEmails } from "@/lib/email-logs-store";
import { clearChatCache, listMessagesFrom } from "@/lib/inbox-replies";
import { hasMailer } from "@/lib/mailer";
import { getSiteSettings } from "@/lib/settings";
import { getSmtpConfig, getSmtpConfigFor } from "@/lib/smtp-settings";

// The chat in Admin → Careers → Email logs: every email HR sent an applicant
// (from the email log) and every email the applicant sent HR (read from the
// HR inbox, and the user's own when they send from it), in one conversation.

export type ChatMessage = {
  id: string;
  /** who wrote it */
  side: "hr" | "applicant";
  /** ms since epoch */
  at: number;
  subject: string;
  text: string;
  /** HR: the admin who sent it, or "Automatic"; applicant: their name */
  by: string;
  /** HR: the kind of email, e.g. "Status update (to applicant)" */
  label: string;
  /** HR: why it could not be sent */
  failed?: string;
};

export type Chat = {
  email: string;
  name: string;
  position: string;
  applicationId: string;
  messages: ChatMessage[];
  problems: string[];
  /** false when no HR email (SMTP) is set up, so the applicant's emails can't be read */
  mailbox: boolean;
  canSend: boolean;
};

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const MESSAGE_MAX = 5000;

const cleanEmail = (v: unknown) => String(v ?? "").trim().toLowerCase().slice(0, 200);

async function mailboxesFor(userId: string) {
  const [hr, own] = await Promise.all([getSmtpConfig(), getSmtpConfigFor(userId)]);
  return [hr?.config, own?.source === "user" ? own.config : undefined].filter((c) => !!c);
}

/** The whole conversation with one applicant, oldest first. */
export async function loadChatAction(rawEmail: string): Promise<Chat | { error: string }> {
  const me = await requireAdmin("applications");
  const email = cleanEmail(rawEmail);
  if (!EMAIL.test(email)) return { error: "That isn't a valid email address." };

  const mailboxes = await mailboxesFor(me.id);
  const [app, logs, inbox, canSend] = await Promise.all([
    findApplicationByEmail(email),
    listConversationEmails(email),
    mailboxes.length ? listMessagesFrom(mailboxes, email) : Promise.resolve({ items: [], error: undefined }),
    hasMailer(me.id),
  ]);
  const lastLog = logs.items[logs.items.length - 1];
  const messages: ChatMessage[] = [
    ...logs.items.map((l): ChatMessage => ({
      id: `log-${l.id}`,
      side: "hr",
      at: l.at.getTime(),
      subject: l.subject,
      text: l.body ?? "",
      by: l.sentBy || "Automatic",
      label: emailKindLabel[l.kind],
      ...(l.result === "failed" ? { failed: l.error || "Not sent" } : {}),
    })),
    ...inbox.items.map((m): ChatMessage => ({
      id: `in-${m.id}`,
      side: "applicant",
      at: m.receivedAt.getTime(),
      subject: m.subject,
      text: m.text,
      by: m.fromName || app?.name || m.fromEmail,
      label: `Email to ${m.mailbox}`,
    })),
  ].sort((a, b) => a.at - b.at);

  return {
    email,
    name: app?.name || lastLog?.applicantName || inbox.items[0]?.fromName || email,
    position: app?.position || lastLog?.position || "",
    applicationId: app?.id || lastLog?.applicationId || "",
    messages,
    problems: [logs.dbError, inbox.error].filter((p): p is string => !!p),
    mailbox: mailboxes.length > 0,
    canSend,
  };
}

export type SendChatResult = { ok: boolean; message: string };

/** Sends HR's chat message to the applicant as an email (logged as a "Chat message"). */
export async function sendChatAction(rawEmail: string, rawMessage: string): Promise<SendChatResult> {
  const me = await requireAdmin("applications");
  const email = cleanEmail(rawEmail);
  const message = String(rawMessage ?? "").replace(/\r\n?/g, "\n").trim();
  if (!EMAIL.test(email)) return { ok: false, message: "That isn't a valid email address." };
  if (!message) return { ok: false, message: "Write a message first." };
  if (message.length > MESSAGE_MAX) return { ok: false, message: `Keep the message to ${MESSAGE_MAX} characters or fewer.` };
  if (!(await hasMailer(me.id))) {
    return { ok: false, message: "Email is not set up yet: add your own SMTP in Settings, or an admin can add the HR SMTP in Site settings." };
  }

  const [app, logs, settings] = await Promise.all([findApplicationByEmail(email), listConversationEmails(email), getSiteSettings()]);
  const last = logs.items[logs.items.length - 1];
  const name = app?.name || last?.applicantName || email;
  const position = app?.position || last?.position || "";
  const status: ApplicationStatus = app?.status ?? (isApplicationStatus(last?.status) ? last.status : "new");
  // Keep the thread together in the applicant's inbox: reply to the last subject HR used.
  const lastSubject = [...logs.items].reverse().find((l) => l.result === "sent")?.subject;
  const subject = lastSubject
    ? (/^re:/i.test(lastSubject) ? lastSubject : `Re: ${lastSubject}`).slice(0, 200)
    : `Message from Ukvalley HR${position ? ` | ${position}` : ""}`;

  try {
    await sendChatMessage(
      { email, name, position, applicationId: app?.id || last?.applicationId || "", status },
      { message, subject, replyTo: settings.hr.email || undefined, sentBy: me.email, senderId: me.id }
    );
  } catch (e) {
    revalidatePath("/admin/email-logs");
    return { ok: false, message: `The message could not be sent: ${e instanceof Error ? e.message : String(e)}` };
  }
  clearChatCache(email);
  revalidatePath("/admin/email-logs");
  return { ok: true, message: `Message sent to ${email}.` };
}
