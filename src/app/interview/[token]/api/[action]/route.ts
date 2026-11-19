import { after } from "next/server";
import { clientIp } from "@/lib/client-ip";
import { hasDatabaseUrl } from "@/lib/db/client";
import { ensureIntegrationKeys } from "@/lib/integration-keys";
import { escapeHtml, sendMail } from "@/lib/mailer";
import { getSiteSettings } from "@/lib/settings";
import { API_HOST, SITE_HOST } from "@/lib/site-origin";
import { AiError } from "@/lib/ai-interview/ai";
import { completeInterview, ensurePlan, startTest, submitAnswer, submitTest } from "@/lib/ai-interview/lifecycle";
import { adminInterviewUrl } from "@/lib/ai-interview/notify";
import { CONSENT_ITEMS, CONSENT_VERSION, bindDevice, consentCovers, deviceOk, interviewForToken, phaseOf, portalState, refreshDeviceCookie, requiredConsent, type ConsentItem } from "@/lib/ai-interview/portal";
import { CHUNK_MAX_BYTES, INTERVIEW_MAX_BYTES, SEGMENT_MAX, SEQ_MAX, recordedBytes, saveChunk } from "@/lib/ai-interview/recordings";
import { audit, getInterview, updateInterview, type InterviewRecord } from "@/lib/ai-interview/store";
import { SpeechError, speechSession } from "@/lib/ai-interview/speech";
import { ACCOMMODATION_NOTE_MAX, ANSWER_MAX, isCheatFlag } from "@/lib/ai-interview/types";

// The candidate portal's API: POST /interview/<token>/api/<action>.
// The token in the address is the credential; once the interview starts, the
// device cookie must match too. Every answer is checked against the server's
// own idea of the current question, so the client can't skip or reorder.

export const dynamic = "force-dynamic";
// Generating the questions on "start" can take a minute when they weren't prepared in advance.
export const maxDuration = 300;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });
const fail = (message: string, status = 400, extra: Record<string, unknown> = {}) => json({ ok: false, message, ...extra }, status);

/** Requests must come from the portal page itself (blocks cross-site form posts). */
function sameSite(h: Headers): boolean {
  if (process.env.NODE_ENV === "development") return true;
  const source = h.get("origin") || h.get("referer");
  if (!source) return false;
  try {
    const host = new URL(source).hostname.toLowerCase();
    // The page must be on this server's own address (localhost when it runs
    // there) or on the site's addresses, not any other localhost app.
    const own = (h.get("x-forwarded-host") ?? h.get("host") ?? "").split(",")[0].trim().replace(/:\d+$/, "").toLowerCase();
    return host === own || host === SITE_HOST || host === API_HOST;
  } catch {
    return false;
  }
}

// Per-link request budget (in memory, per instance): generous for chunk uploads, low enough to stop floods.
const WINDOW_MS = 60_000;
const LIMIT = 150;
const hits = new Map<string, number[]>();
function limited(key: string): boolean {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(key, recent);
  if (hits.size > 5000) for (const [k, v] of hits) if (v.every((t) => now - t >= WINDOW_MS)) hits.delete(k);
  return recent.length > LIMIT;
}

async function body(request: Request): Promise<Record<string, unknown>> {
  try {
    const text = await request.text();
    if (text.length > 64 * 1024) return {};
    return text ? (JSON.parse(text) as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

const state = async (i: InterviewRecord) => json({ ok: true, state: await portalState(i) });

export async function POST(request: Request, { params }: { params: Promise<{ token: string; action: string }> }) {
  const { token, action } = await params;
  if (!sameSite(request.headers)) return fail("Please open the interview from its link.", 403);
  if (!hasDatabaseUrl()) return fail("The interview service is unavailable right now.", 503);
  await ensureIntegrationKeys();
  if (limited(`${token}:${clientIp(request.headers)}`)) return fail("Too many requests. Please wait a moment.", 429);

  let i: Awaited<ReturnType<typeof interviewForToken>>;
  try {
    i = await interviewForToken(token);
  } catch {
    return fail("The interview service is unavailable right now. Please try again in a minute.", 503);
  }
  if (!i) return fail("This interview link is not valid. Please use the latest link from your email.", 404);
  const now = new Date();
  const onDevice = await deviceOk(i);
  const phase = phaseOf(i, now, onDevice);

  // Recording chunks: raw bytes, details in the query string.
  if (action === "recording") return recording(request, i, onDevice);

  const b = await body(request);
  const by = { interviewId: i.id, applicationId: i.applicationId, candidateName: i.candidate.name, by: "candidate" } as const;

  switch (action) {
    case "state":
      return state(i);

    case "consent": {
      if (phase !== "welcome") return state(i);
      const given = new Set((Array.isArray(b.items) ? b.items : []).filter((x): x is ConsentItem => typeof x === "string" && x in CONSENT_ITEMS));
      const needed = requiredConsent(i.mode);
      if (!needed.every((k) => given.has(k))) return fail("Please tick every item to continue.");
      const updated = await updateInterview(i.id, {
        $set: { consent: { at: now, ip: clientIp(request.headers), userAgent: (request.headers.get("user-agent") ?? "").slice(0, 300), items: needed, version: CONSENT_VERSION } },
      });
      await audit({ ...by, action: "consent_given", detail: needed.join(", ") });
      return state(updated ?? i);
    }

    case "accommodation": {
      if (!["welcome", "too_early"].includes(phase) || i.answers.length) return fail("Please contact HR by email for help with this interview.");
      const note = String(b.note ?? "").trim().slice(0, ACCOMMODATION_NOTE_MAX);
      const updated = await updateInterview(i.id, { $set: { status: "accommodation", accommodation: { requestedAt: now, note } } }, { status: { $in: ["scheduled", "interrupted"] } });
      await audit({ ...by, action: "accommodation_requested", detail: note });
      // Tell HR straight away (best effort; the request also shows in the admin).
      after(async () => {
        try {
          const s = await getSiteSettings();
          const to = s.hr.email || s.email;
          const text = `${i.candidate.name} (${i.position}) asked for an alternative to the video interview.\n\nTheir note: ${note || "(none)"}\n\nOpen the interview to allow a written interview or arrange another way:\n${adminInterviewUrl(i.id)}`;
          await sendMail({ to, subject: `Interview accommodation request: ${i.candidate.name}`, text, html: `<pre style="font-family:Arial,sans-serif;white-space:pre-wrap">${escapeHtml(text)}</pre>` });
        } catch (e) {
          console.error("[ai-interview] accommodation email failed:", e instanceof Error ? e.message : e);
        }
      });
      return state(updated ?? i);
    }

    case "start": {
      if (phase === "other_device") return fail("This interview was started in another browser. Please continue there, or ask HR to unlock it.", 409);
      if (phase !== "welcome") return state(i);
      // The saved consent must cover what this mode records (HR may have switched written → video since).
      if (!consentCovers(i)) return fail("Please accept the recording and privacy notice first.");
      let current = i;
      try {
        current = await ensurePlan(i.id);
      } catch (e) {
        console.error("[ai-interview] plan failed:", e instanceof Error ? e.message : e);
        await audit({ ...by, by: "system", action: "plan_failed", detail: e instanceof Error ? e.message : String(e) });
        return fail(e instanceof AiError ? "The interviewer couldn't be prepared right now. Please try again in a few minutes." : "Something went wrong. Please try again.", 503);
      }
      const resuming = current.status === "interrupted";
      // A resume counts against the limit only when the candidate answered
      // something since the last start: reloading the page on the same
      // question (by accident, or after a camera problem) never locks them out.
      const counted = resuming && current.answers.length > (current.answersAtStart ?? 0);
      const set: Record<string, unknown> = { status: "in_progress", lastActivityAt: now, answersAtStart: current.answers.length };
      if (!current.startedAt) set.startedAt = now;
      if (!current.device) set.device = { keyHash: await bindDevice(current, token), boundAt: now };
      else await refreshDeviceCookie(current, token);
      const updated = await updateInterview(
        current.id,
        { $set: set, $inc: { "recording.segments": 1, ...(counted ? { resumes: 1 } : {}) }, ...(resuming ? { $push: { flags: { kind: "resumed", at: now } } } : {}) },
        { status: { $in: ["scheduled", "interrupted"] } }
      );
      if (!updated) return state((await getInterview(i.id)) ?? i);
      await audit({ ...by, action: resuming ? "resumed" : "started", detail: `segment ${updated.recording.segments - 1}` });
      return json({ ok: true, state: await portalState(updated), segment: updated.recording.segments - 1 });
    }

    case "answer": {
      if (phase !== "interview") return state(i);
      const text = String(b.text ?? "").slice(0, ANSWER_MAX);
      const skipped = b.skipped === true;
      if (!skipped && text.trim().length < 2) return fail("Please answer, or choose “Skip this question”.");
      const input = b.input === "speech" || b.input === "speech_edited" ? b.input : "typed";
      const startedAt = new Date(String(b.startedAt ?? ""));
      const offsetMs = Number(b.offsetMs);
      const updated = await submitAnswer(i, {
        questionId: String(b.questionId ?? ""),
        text,
        input,
        skipped,
        startedAt: Number.isNaN(startedAt.getTime()) || startedAt > now ? now : startedAt,
        ...(Number.isFinite(offsetMs) && offsetMs >= 0 ? { offsetMs: Math.round(offsetMs) } : {}),
        // The part being recorded now: the server counts the parts (one per start or resume).
        ...(i.recording.segments > 0 ? { segment: i.recording.segments - 1 } : {}),
      });
      return state(updated);
    }

    case "test_start":
      if (phase !== "test") return state(i);
      return state(await startTest(i));

    case "test_submit": {
      if (phase !== "test") return state(i);
      const raw = (b.answers && typeof b.answers === "object" ? b.answers : {}) as Record<string, unknown>;
      const chosen: Record<string, number | null> = {};
      for (const [k, v] of Object.entries(raw).slice(0, 50)) chosen[k] = typeof v === "number" ? v : null;
      return state(await submitTest(i, chosen, b.auto === true));
    }

    case "finish": {
      if (phase !== "finish") return state(i);
      const done = await completeInterview(i);
      return state(done ?? (await getInterview(i.id)) ?? i);
    }

    case "flag": {
      if (i.status !== "in_progress" || !onDevice || !isCheatFlag(b.kind) || b.kind === "resumed") return json({ ok: true });
      if (i.flags.length >= 200) return json({ ok: true });
      await updateInterview(i.id, { $push: { flags: { kind: b.kind, at: now, detail: String(b.detail ?? "").slice(0, 200) } } }, { status: "in_progress" });
      return json({ ok: true });
    }

    case "reschedule": {
      // The candidate picks another time (when HR's settings allow it).
      try {
        const { candidateReschedule } = await import("@/lib/ai-interview/hr-tools");
        const { link } = await candidateReschedule(i, new Date(String(b.startsAt ?? "")), now);
        // Stay on this address: the new link's path, on the host the page is on.
        return json({ ok: true, link: new URL(link).pathname });
      } catch (e) {
        return fail(e instanceof Error ? e.message : "Something went wrong. Please try again.", 400);
      }
    }

    case "speech_token": {
      // Deepgram live speech-to-text for one answer: a 60-second token, only
      // for the browser running this interview (the API key stays here).
      if (!onDevice || !["in_progress", "interrupted"].includes(i.status)) return fail("The interview is not running in this browser.", 409);
      if (i.mode !== "video") return fail("This interview is written.", 409);
      try {
        return json({ ok: true, speech: await speechSession(i.config.language) });
      } catch (e) {
        if (e instanceof SpeechError) {
          if (e.status !== 404) console.error("[ai-interview] Deepgram:", e.message);
          // The candidate's page falls back to the browser's recognition; never show them the key problem.
          return fail(e.status === 404 ? "Speech-to-text by Deepgram is not set up." : "Speech-to-text is unavailable right now.", e.status);
        }
        throw e;
      }
    }

    case "interrupt": {
      // Sent by the page when it closes mid-interview; the candidate can resume within the window.
      if (i.status === "in_progress" && onDevice) {
        await updateInterview(i.id, { $set: { status: "interrupted" } }, { status: "in_progress" });
        await audit({ ...by, action: "interrupted", detail: String(b.reason ?? "page closed").slice(0, 100) });
      }
      return json({ ok: true });
    }

    default:
      return fail("Unknown action.", 404);
  }
}

/** Stores one encrypted recording chunk. Accepted while the interview runs and for 30 minutes after it ends. */
async function recording(request: Request, i: InterviewRecord, onDevice: boolean): Promise<Response> {
  if (i.mode !== "video" || !i.config.recordVideo) return fail("This interview is not recorded.", 409);
  // HR deleted the recording (a data request): nothing more is stored.
  if (i.recording.deletedAt) return fail("This interview is no longer recorded.", 410);
  if (!onDevice || !i.device) return fail("This interview was started in another browser.", 409);
  const lateOk = i.status === "completed" && i.completedAt && Date.now() - i.completedAt.getTime() < 30 * 60_000;
  if (!["in_progress", "interrupted"].includes(i.status) && !lateOk) return fail("The interview is not running.", 409);
  const url = new URL(request.url);
  const segment = Number(url.searchParams.get("segment"));
  const seq = Number(url.searchParams.get("seq"));
  if (!Number.isInteger(segment) || segment < 0 || segment >= Math.min(SEGMENT_MAX, i.recording.segments) || !Number.isInteger(seq) || seq < 0 || seq > SEQ_MAX) {
    return fail("Invalid chunk.", 400);
  }
  const declared = Number(request.headers.get("content-length") ?? NaN);
  if (!Number.isFinite(declared) || declared <= 0 || declared > CHUNK_MAX_BYTES) return fail("Chunk too large.", 413);
  const mime = (request.headers.get("content-type") ?? "").split(";")[0].trim().toLowerCase();
  if (!/^(video|audio)\/(webm|mp4)$/.test(mime)) return fail("Unsupported recording format.", 415);
  const bytes = new Uint8Array(await request.arrayBuffer());
  if (!bytes.length || bytes.length > CHUNK_MAX_BYTES) return fail("Chunk too large.", 413);
  if ((await recordedBytes(i.id)) + bytes.length > INTERVIEW_MAX_BYTES) return fail("The recording is too large.", 413);
  try {
    const fresh = await saveChunk(i.id, segment, seq, bytes, mime);
    if (fresh) await updateInterview(i.id, { $inc: { "recording.chunks": 1, "recording.bytes": bytes.length }, $set: { "recording.lastChunkAt": new Date() } });
    return json({ ok: true });
  } catch (e) {
    console.error("[ai-interview] chunk save failed:", e instanceof Error ? e.message : e);
    return fail("Could not save the recording. Retrying…", 503);
  }
}
