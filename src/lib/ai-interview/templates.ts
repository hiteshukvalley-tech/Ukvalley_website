// Notification templates for AI interviews. Client-safe and import-free (the
// settings form previews them; unit tests run them under node --test).
//
// Email templates are plain text with {{placeholders}}; the server escapes the
// values and puts the text into the branded email layout. WhatsApp messages
// that a business starts must use a template Meta has approved, so a WhatsApp
// template here is only the approved template's name, language and the
// placeholders that fill its {{1}}, {{2}}… in order.

export const NOTIFICATION_KINDS = [
  "invite",
  "reminder",
  "rescheduled",
  "cancelled",
  "completed",
  "missed",
  "hr_evaluation",
] as const;
export type NotificationKind = (typeof NOTIFICATION_KINDS)[number];

/** Sent by email only (no approved WhatsApp template needed). */
export const EMAIL_ONLY_KINDS = ["missed", "hr_evaluation"] as const;
export type EmailOnlyKind = (typeof EMAIL_ONLY_KINDS)[number];
export const isEmailOnlyKind = (k: NotificationKind): k is EmailOnlyKind => (EMAIL_ONLY_KINDS as readonly string[]).includes(k);

export const notificationKindLabel: Record<NotificationKind, string> = {
  invite: "Interview invitation",
  reminder: "Interview reminder",
  rescheduled: "Interview rescheduled",
  cancelled: "Interview cancelled",
  completed: "Interview completed (to candidate)",
  missed: "Missed interview: pick a new time",
  hr_evaluation: "Evaluation ready (to HR)",
};

export const isNotificationKind = (v: unknown): v is NotificationKind =>
  typeof v === "string" && (NOTIFICATION_KINDS as readonly string[]).includes(v);

/** Placeholders every template may use. */
export const PLACEHOLDERS = {
  candidateName: "Candidate's name",
  jobTitle: "Job applied for",
  companyName: "Company name",
  interviewDate: "Date and time in the candidate's time zone",
  interviewDateIst: "Date and time in India time",
  duration: "Interview length, e.g. 25 minutes",
  interviewLink: "The candidate's private interview link",
  joinWindow: "How long the link stays open",
  reminderWhen: "e.g. in 1 hour (reminders only)",
  hrEmail: "HR contact email",
  hrPhone: "HR contact phone",
  reason: "Reason (cancellations only)",
  score: "Overall score (HR only)",
  recommendation: "AI recommendation (HR only)",
  adminLink: "Admin link to the interview (HR only)",
} as const;
export type Placeholder = keyof typeof PLACEHOLDERS;
export type TemplateVars = Partial<Record<Placeholder, string>>;

export type EmailTemplate = { subject: string; body: string };
export type WhatsAppTemplate = { name: string; language: string; params: Placeholder[] };

export type NotificationTemplates = {
  email: Record<NotificationKind, EmailTemplate>;
  whatsapp: Record<Exclude<NotificationKind, EmailOnlyKind>, WhatsAppTemplate>;
};

const INSTRUCTIONS = `Before you start:
• Use a laptop or desktop with Google Chrome or Microsoft Edge, a working camera and microphone, and a stable internet connection.
• Sit in a quiet, well-lit place. The interview is recorded (video and audio) and transcribed.
• The AI interviewer asks one question at a time. Answer out loud; you can check and correct the text before moving on.
• If you cannot use a camera or microphone, open the link and choose "I need an alternative" — we will arrange another way. Nobody is rejected for this.`;

export const DEFAULT_TEMPLATES: NotificationTemplates = {
  email: {
    invite: {
      subject: "Your AI interview for {{jobTitle}} at {{companyName}}",
      body: `Dear {{candidateName}},

Thank you for applying for {{jobTitle}}. The first round is a short interview with our AI interviewer, which you can take from your own computer.

Interview time: {{interviewDate}}
India time: {{interviewDateIst}}
Length: about {{duration}}
Your link stays open for {{joinWindow}} after the start time, in case you are running late.

Your private interview link:
{{interviewLink}}

${INSTRUCTIONS}

A calendar invitation is attached. If the time doesn't suit you, reply to this email or contact us at {{hrEmail}} {{hrPhone}}.

Please don't share this link: it is for you only.`,
    },
    reminder: {
      subject: "Reminder: your AI interview for {{jobTitle}} {{reminderWhen}}",
      body: `Dear {{candidateName}},

This is a reminder that your AI interview for {{jobTitle}} starts {{reminderWhen}}.

Interview time: {{interviewDate}}
Length: about {{duration}}

Your private interview link:
{{interviewLink}}

Please check that your camera and microphone work before you start.`,
    },
    rescheduled: {
      subject: "New time for your AI interview for {{jobTitle}}",
      body: `Dear {{candidateName}},

Your AI interview for {{jobTitle}} has a new time.

New interview time: {{interviewDate}}
India time: {{interviewDateIst}}
Length: about {{duration}}

Your private interview link (the old link no longer works):
{{interviewLink}}

An updated calendar invitation is attached.`,
    },
    cancelled: {
      subject: "Your AI interview for {{jobTitle}} has been cancelled",
      body: `Dear {{candidateName}},

Your AI interview for {{jobTitle}}, set for {{interviewDate}}, has been cancelled.
{{reason}}

Our HR team will contact you about the next steps. For questions, write to {{hrEmail}}.`,
    },
    completed: {
      subject: "Thank you for completing your interview for {{jobTitle}}",
      body: `Dear {{candidateName}},

Thank you for completing the AI interview for {{jobTitle}}. Our HR team will review it, and a person, not the AI, makes every hiring decision.

We will contact you about the next steps. For questions, write to {{hrEmail}}.`,
    },
    missed: {
      subject: "We missed you: pick a new time for your {{jobTitle}} interview",
      body: `Dear {{candidateName}},

Your AI interview for {{jobTitle}}, set for {{interviewDate}}, wasn't started before the link closed. That's all right: you can choose a new time yourself.

Open your link and pick one of the times shown:
{{interviewLink}}

If none of the times suit you, write to {{hrEmail}} {{hrPhone}}.`,
    },
    hr_evaluation: {
      subject: "AI interview evaluated: {{candidateName}} for {{jobTitle}} ({{score}})",
      body: `The AI interview of {{candidateName}} for {{jobTitle}} has been evaluated.

Overall score: {{score}}
AI recommendation: {{recommendation}}

The score is a recommendation only. Review the recording, transcript and evidence before deciding:
{{adminLink}}`,
    },
  },
  whatsapp: {
    invite: { name: "ai_interview_invite", language: "en", params: ["candidateName", "jobTitle", "interviewDate", "interviewLink"] },
    reminder: { name: "ai_interview_reminder", language: "en", params: ["candidateName", "jobTitle", "reminderWhen", "interviewLink"] },
    rescheduled: { name: "ai_interview_rescheduled", language: "en", params: ["candidateName", "jobTitle", "interviewDate", "interviewLink"] },
    cancelled: { name: "ai_interview_cancelled", language: "en", params: ["candidateName", "jobTitle", "interviewDate"] },
    completed: { name: "ai_interview_completed", language: "en", params: ["candidateName", "jobTitle"] },
  },
};

/** Fills {{placeholders}}. Unknown or empty ones become "". */
export function renderTemplate(text: string, vars: TemplateVars): string {
  return text
    .replace(/\{\{\s*([a-zA-Z]+)\s*\}\}/g, (_, k: string) => (Object.hasOwn(PLACEHOLDERS, k) ? (vars[k as Placeholder] ?? "") : ""))
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Placeholders a template uses that don't exist (for the settings form). */
export function unknownPlaceholders(text: string): string[] {
  const out = new Set<string>();
  for (const m of text.matchAll(/\{\{\s*([a-zA-Z]+)\s*\}\}/g)) if (!Object.hasOwn(PLACEHOLDERS, m[1])) out.add(m[1]);
  return [...out];
}

export const isPlaceholder = (v: unknown): v is Placeholder => typeof v === "string" && Object.hasOwn(PLACEHOLDERS, v);

export const EMAIL_SUBJECT_MAX = 200;
export const EMAIL_BODY_MAX = 5000;
export const WA_NAME = /^[a-z0-9_]{1,512}$/;
export const WA_LANGUAGE = /^[a-z]{2,3}(?:_[A-Z]{2})?$/;
