import "server-only";
import { speechProvider } from "./speech";
import { cookies } from "next/headers";
import { getSiteSettings } from "@/lib/settings";
import { hashDeviceKey, hashToken, isTokenShape, newDeviceKey, sameHash } from "./crypto";
import { currentQuestion, effectiveClosesAt, nothingLeft } from "./lifecycle";
import { CONSENT_VERSION as CONSENT_VERSION_VALUE } from "./types";
import { selfRescheduleSlots, selfReschedulesLeft } from "./hr-tools";
import { getInterviewByTokenHash, updateInterview, type InterviewRecord } from "./store";
import { SECTION_KEYS, sectionLabel, type InterviewMode, type PortalMcq, type PortalQuestion, type SectionKey } from "./types";

// The candidate's side of an interview: which screen to show for a link, and
// the device lock. Server-only. The link token is the only credential; it
// works from `earlyJoinMinutes` before the start until `closesAt`. When the
// candidate starts, an httpOnly cookie binds the interview to that browser, so
// a forwarded link can't be used by someone else mid-interview (HR can
// release the lock).

// The consent texts and version live in types.ts (client-safe), so the portal page shows the same words.
export { CONSENT_ITEMS, CONSENT_VERSION, type ConsentItem } from "./types";
import type { ConsentItem } from "./types";
export const requiredConsent = (mode: InterviewMode): ConsentItem[] => (mode === "text" ? ["ai", "storage"] : ["audio", "video", "transcription", "ai", "storage"]);

const cookieName = (id: string) => `uk_iv_${id.replace(/[^a-z0-9]/gi, "").slice(0, 16)}`;

export type Phase =
  | "invalid"
  | "too_early"
  | "closed"
  | "cancelled"
  | "completed"
  | "accommodation_pending"
  | "other_device"
  | "resume_limit"
  | "welcome"
  | "interview"
  | "test"
  | "finish";

export type PortalState = {
  phase: Phase;
  /** speech-to-text engine: "deepgram" (live, any browser; token from the speech_token action) or the browser's own */
  speechProvider: "deepgram" | "browser";
  company: string;
  candidateName: string;
  position: string;
  startsAt: string | null;
  closesAt: string | null;
  durationMinutes: number;
  sections: { key: SectionKey; label: string }[];
  questionCount: number;
  mode: InterviewMode;
  language: string;
  retentionDays: number;
  consented: boolean;
  /** an interview that was started and interrupted */
  resuming: boolean;
  question: PortalQuestion | null;
  answered: number;
  test: { questions: PortalMcq[]; minutes: number; deadline: string | null; submitted: boolean } | null;
  /** the next recording segment number */
  segment: number;
  startedAt: string | null;
  hrEmail: string;
  /** the candidate may move the interview themselves: the times offered, in their time zone */
  reschedule: { left: number; slots: string[]; timeZone: string } | null;
};

/** The interview for a link, or null. Never throws on a malformed token. */
export async function interviewForToken(token: string): Promise<InterviewRecord | null> {
  if (!isTokenShape(token)) return null;
  // A database error throws (callers show "unavailable, try again"), so a
  // short outage never tells a candidate their link is invalid.
  return getInterviewByTokenHash(hashToken(token));
}

/** Whether this browser holds the device lock (or no lock is set yet). */
export async function deviceOk(i: InterviewRecord): Promise<boolean> {
  if (!i.device) return true;
  const key = (await cookies()).get(cookieName(i.id))?.value;
  return !!key && sameHash(hashDeviceKey(key), i.device.keyHash);
}

/** Binds the interview to this browser: sets the cookie and returns the hash to store. */
export async function bindDevice(i: InterviewRecord, token: string): Promise<string> {
  const key = newDeviceKey();
  (await cookies()).set(cookieName(i.id), key, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: `/interview/${token}`,
    // Long enough to outlive a link extension or a later resume; the link itself still decides access.
    maxAge: DEVICE_COOKIE_SECONDS,
  });
  return hashDeviceKey(key);
}

const DEVICE_COOKIE_SECONDS = 14 * 86400;

/** Re-sends this browser's device cookie with a fresh lifetime (on every start or resume). */
export async function refreshDeviceCookie(i: InterviewRecord, token: string): Promise<void> {
  const jar = await cookies();
  const key = jar.get(cookieName(i.id))?.value;
  if (!key) return;
  jar.set(cookieName(i.id), key, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", path: `/interview/${token}`, maxAge: DEVICE_COOKIE_SECONDS });
}

/** The saved consent covers everything this interview's mode records, in the current wording. */
export function consentCovers(i: Pick<InterviewRecord, "consent" | "mode">): boolean {
  if (!i.consent) return false;
  if (i.consent.version !== CONSENT_VERSION_VALUE) return false;
  const given = new Set(i.consent.items ?? []);
  return requiredConsent(i.mode).every((k) => given.has(k));
}

export function phaseOf(i: InterviewRecord, now: Date, onDevice: boolean): Phase {
  if (i.status === "cancelled") return "cancelled";
  if (i.status === "completed") return "completed";
  if (i.status === "missed" || i.status === "expired" || i.status === "unscheduled" || !i.schedule) return "closed";
  // A running interview keeps a grace period past the scheduled close (effectiveClosesAt).
  if (now > (effectiveClosesAt(i) ?? i.schedule.closesAt)) return "closed";
  if (now.getTime() < i.schedule.startsAt.getTime() - i.config.earlyJoinMinutes * 60_000) return "too_early";
  if (i.status === "accommodation") return "accommodation_pending";
  if (i.status === "in_progress" || i.status === "interrupted") {
    if (!onDevice) return "other_device";
    // All answered, only "Submit" left: a reload must never block submitting (no camera check, no resume count).
    if (nothingLeft(i)) return "finish";
    // Same rule as "start": a resume counts only when something was answered since the last start.
    if (i.status === "interrupted" && i.resumes >= i.config.maxResumes && i.answers.length > (i.answersAtStart ?? 0)) return "resume_limit";
    if (i.status === "interrupted") return "welcome";
    if (currentQuestion(i)) return "interview";
    if (i.mcq && !i.mcq.submittedAt) return "test";
    return "finish";
  }
  return "welcome";
}

export async function portalState(i: InterviewRecord, now = new Date()): Promise<PortalState> {
  const settings = await getSiteSettings();
  const onDevice = await deviceOk(i);
  const phase = phaseOf(i, now, onDevice);
  const q = phase === "interview" ? currentQuestion(i) : null;
  // The first time a question is shown is when it was asked (the transcript's
  // interviewer turn). Atomic: a reload keeps the first time.
  if (q && !q.askedAt) {
    await updateInterview(i.id, { $set: { "questions.$.askedAt": now } }, { questions: { $elemMatch: { id: q.id, askedAt: { $exists: false } } } }).catch(() => null);
  }
  const sections = SECTION_KEYS.filter((k) => i.config.sectionWeights[k] > 0).map((key) => ({ key, label: sectionLabel[key] }));
  const showInterview = phase === "interview" || phase === "test" || phase === "finish";
  return {
    phase,
    company: settings.name,
    candidateName: i.candidate.name,
    position: i.position,
    startsAt: i.schedule?.startsAt.toISOString() ?? null,
    closesAt: i.schedule?.closesAt.toISOString() ?? null,
    durationMinutes: i.config.durationMinutes,
    sections,
    questionCount: i.questions.length || i.config.questionCount,
    mode: i.mode,
    language: i.config.language,
    speechProvider: speechProvider(),
    retentionDays: i.config.retentionDays,
    consented: consentCovers(i),
    resuming: i.answers.length > 0,
    question: q
      ? { id: q.id, index: i.answers.length, total: i.questions.length, section: q.section, text: q.text, followUp: Boolean(q.followUpOf) }
      : null,
    answered: i.answers.length,
    test:
      showInterview && i.mcq
        ? {
            questions: phase === "test" && i.mcq.startedAt ? i.mcq.questions.map((m) => ({ id: m.id, question: m.question, options: m.options })) : [],
            minutes: i.config.mcqMinutes,
            deadline: i.mcq.deadline?.toISOString() ?? null,
            submitted: Boolean(i.mcq.submittedAt),
          }
        : null,
    segment: i.recording.segments,
    startedAt: i.startedAt?.toISOString() ?? null,
    hrEmail: settings.hr.email || settings.email,
    reschedule: (() => {
      // Before starting (welcome, too early) or after missing it.
      if (!["welcome", "too_early", "closed"].includes(phase)) return null;
      const left = selfReschedulesLeft(i);
      const slots = left > 0 ? selfRescheduleSlots(i, now).map((d) => d.toISOString()) : [];
      return slots.length ? { left, slots, timeZone: i.candidate.timeZone } : null;
    })(),
  };
}
