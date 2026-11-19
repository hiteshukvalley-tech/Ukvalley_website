"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import {
  AlertTriangle, Bot, Camera, CheckCircle2, Clock, Loader2, Mic, RefreshCw, ShieldCheck, Square, Volume2, Wifi,
} from "lucide-react";
import type { PortalState } from "@/lib/ai-interview/portal";
import { ANSWER_MAX, CONSENT_ITEMS, sectionLabel } from "@/lib/ai-interview/types";
import { pickMime, useRecorder } from "./use-recorder";
import { speechInputSupported, speechOutputSupported, useSpeech, type DeepgramOptions } from "./use-speech";
import { useFaceWatch, useOnline } from "./use-integrity";

// The candidate's interview, start to finish: welcome and consent, device
// check, the spoken interview (one question at a time), the timed test and
// the completion screen. The server decides which screen applies (state.phase);
// this component only shows it and sends what the candidate does.

const CONSENT_TEXT: Record<string, string> = CONSENT_ITEMS;

/**
 * A browser capability, read without a hydration mismatch: the server renders
 * `server`, the browser then shows its real value.
 */
const noSubscribe = () => () => {};
function useBrowser<T>(read: () => T, server: T): T {
  return useSyncExternalStore(noSubscribe, read, () => server);
}

/** The camera/microphone stream, shared by the device check and the interview. */
type StreamBox = { get: () => MediaStream | null; set: (s: MediaStream | null) => void };

type Api = (action: string, body?: Record<string, unknown>) => Promise<{ ok: boolean; state?: PortalState; message?: string; segment?: number; link?: string }>;

const card = "rounded-2xl border border-uk-line bg-uk-card p-6 sm:p-8";
const primary =
  "inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-uk-blue px-5 text-sm font-semibold text-uk-white transition-colors hover:bg-uk-blue-bright disabled:cursor-not-allowed disabled:opacity-50";
const secondary =
  "inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-uk-line px-5 text-sm font-medium text-uk-body transition-colors hover:bg-uk-surface-2 hover:text-uk-heading disabled:opacity-50";

const when = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString(undefined, { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit", timeZoneName: "short" }) : "";

export function InterviewPortal({ token, initial, logo }: { token: string; initial: PortalState; logo: string }) {
  const [state, setState] = useState(initial);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const stream = useRef<MediaStream | null>(null);
  const box = useMemo<StreamBox>(() => ({ get: () => stream.current, set: (s) => void (stream.current = s) }), []);
  const segment = useRef<number | null>(null);
  const recorder = useRecorder(token);

  const api: Api = useCallback(
    async (action, body = {}) => {
      try {
        const res = await fetch(`/interview/${token}/api/${action}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
        const data = (await res.json().catch(() => ({ ok: false, message: "Unexpected response." }))) as Awaited<ReturnType<Api>>;
        if (data.state) setState(data.state);
        if (!data.ok) setError(data.message ?? "Something went wrong. Please try again.");
        else setError("");
        return data;
      } catch {
        setError("You seem to be offline. Check your connection; your progress is saved.");
        return { ok: false };
      }
    },
    [token]
  );

  // Mid-interview: tell the server when the page closes, and flag tab switches.
  const running = state.phase === "interview" || state.phase === "test";
  useEffect(() => {
    if (!running) return;
    const flag = (kind: string, detail = "") => void fetch(`/interview/${token}/api/flag`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind, detail }), keepalive: true }).catch(() => {});
    let lastBlur = 0;
    const onVisibility = () => document.visibilityState === "hidden" && flag("tab_hidden");
    const onBlur = () => {
      if (Date.now() - lastBlur > 10_000) flag("window_blur");
      lastBlur = Date.now();
    };
    const onHide = () => navigator.sendBeacon?.(`/interview/${token}/api/interrupt`, new Blob([JSON.stringify({ reason: "page closed" })], { type: "application/json" }));
    // Leaving the full screen the interview opened in (only when it was full screen to begin with).
    const onFullscreen = () => {
      if (!document.fullscreenElement) flag("fullscreen_exit");
    };
    document.addEventListener("visibilitychange", onVisibility);
    document.addEventListener("fullscreenchange", onFullscreen);
    window.addEventListener("blur", onBlur);
    window.addEventListener("pagehide", onHide);
    return () => {
      document.removeEventListener("fullscreenchange", onFullscreen);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("blur", onBlur);
      window.removeEventListener("pagehide", onHide);
    };
  }, [running, token]);

  // Connection lost mid-interview: tell the candidate; when it's back, note it for HR
  // (as a technical problem: it never counts against the answers).
  const online = useOnline((ms) => {
    if (!running || ms < 3000) return;
    void fetch(`/interview/${token}/api/flag`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: "offline", detail: `${Math.round(ms / 1000)} s` }),
    }).catch(() => {});
  });

  // Release the camera when leaving: when the page is closed or reloaded too (React's
  // clean-up doesn't run then), so the reopened page can use the camera at once.
  useEffect(() => {
    const release = () => stream.current?.getTracks().forEach((t) => t.stop());
    window.addEventListener("pagehide", release);
    return () => {
      window.removeEventListener("pagehide", release);
      release();
    };
  }, []);

  const begin = async () => {
    setBusy(true);
    const res = await api("start");
    setBusy(false);
    if (!res.ok || !res.state || typeof res.segment !== "number") return;
    segment.current = res.segment;
    if (res.state.mode === "video" && stream.current) recorder.start(stream.current, res.segment);
    try {
      await document.documentElement.requestFullscreen?.();
    } catch {}
  };

  const finish = async () => {
    setBusy(true);
    await recorder.stop(90_000);
    stream.current?.getTracks().forEach((t) => t.stop());
    if (document.fullscreenElement) await document.exitFullscreen().catch(() => {});
    await api("finish");
    setBusy(false);
  };

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:py-10">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logo} alt={state.company} className="h-9 w-auto" />
          <span className="hidden text-sm text-uk-muted sm:inline">AI interview</span>
        </div>
        {running && <RecordingBadge mode={state.mode} status={recorder.status} />}
      </header>

      {running && !online && (
        <div role="alert" className="mb-5 flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-300">
          <Wifi className="mt-0.5 h-4 w-4 shrink-0" />
          <span>You're offline. Stay on this page: your recording keeps going and uploads when the connection is back. Answers can be submitted once you're online again.</span>
        </div>
      )}

      {error && (
        <div role="alert" className="mb-5 flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-800 dark:text-amber-300">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {state.phase === "welcome" && <Welcome state={state} api={api} busy={busy} onStart={begin} stream={box} />}
      {state.phase === "interview" && state.question && <Interview key={state.question.id} token={token} state={state} api={api} stream={box} recorder={recorder} />}
      {state.phase === "test" && <Test state={state} api={api} />}
      {state.phase === "finish" && (
        <section className={`${card} text-center`}>
          <CheckCircle2 className="mx-auto mb-3 h-10 w-10 text-uk-blue" />
          <h1 className="font-heading text-2xl font-bold text-uk-heading">You've answered every question</h1>
          <p className="mx-auto mt-2 max-w-md text-sm text-uk-muted">Submit to finish. We'll save the last part of your recording first; this can take up to a minute.</p>
          <button type="button" className={`${primary} mt-6`} onClick={finish} disabled={busy}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {busy ? `Saving recording${recorder.status.pending ? ` (${recorder.status.pending} left)` : ""}…` : "Submit interview"}
          </button>
        </section>
      )}
      {!["welcome", "interview", "test", "finish"].includes(state.phase) && <Notice state={state} />}
      {state.reschedule && state.phase !== "welcome" && <PickTime state={state} api={api} open />}
    </div>
  );
}

function RecordingBadge({ mode, status }: { mode: PortalState["mode"]; status: ReturnType<typeof useRecorder>["status"] }) {
  if (mode !== "video") return <span className="rounded-full bg-uk-surface-2 px-3 py-1 text-xs font-medium text-uk-body">Written interview · not recorded</span>;
  return (
    <span className="flex items-center gap-2 rounded-full bg-uk-surface-2 px-3 py-1 text-xs font-medium text-uk-body" aria-live="polite">
      <span className={`h-2.5 w-2.5 rounded-full ${status.recording ? "animate-pulse bg-red-500" : "bg-uk-muted"}`} />
      {status.recording ? "Recording" : "Not recording"}
      {status.pending > 1 && <span className="text-uk-muted">· saving {status.pending}</span>}
      {status.failed && <span className="text-amber-600 dark:text-amber-400">· retrying upload</span>}
    </span>
  );
}

// --- informational screens ------------------------------------------------------------------

function Notice({ state }: { state: PortalState }) {
  const content: Record<string, { title: string; text: string }> = {
    too_early: { title: "Your interview hasn't opened yet", text: `It starts ${when(state.startsAt)}. Please come back a few minutes before then, using the same link.` },
    closed: { title: "This interview link is closed", text: `The time for this interview has passed. If you'd like another time, please write to ${state.hrEmail}.` },
    cancelled: { title: "This interview was cancelled", text: `Our HR team will contact you about the next steps. Questions: ${state.hrEmail}.` },
    completed: { title: "Thank you, your interview is complete", text: "Our HR team will review it, and a person, not the AI, makes every hiring decision. We'll be in touch about the next steps. You can close this page." },
    accommodation_pending: { title: "We received your request", text: `Our HR team will contact you to arrange an alternative. Nobody is rejected for needing one. Questions: ${state.hrEmail}.` },
    other_device: { title: "This interview is open in another browser", text: `For security, an interview continues in the browser it started in. Please go back to that browser, or write to ${state.hrEmail} to unlock it.` },
    resume_limit: { title: "This interview was interrupted too many times", text: `Please write to ${state.hrEmail}; HR can arrange a new time and you'll continue where you stopped.` },
    invalid: { title: "This link is not valid", text: "Please use the latest link from your invitation email." },
  };
  const c = content[state.phase] ?? content.invalid;
  return (
    <section className={`${card} text-center`}>
      {state.phase === "completed" ? <CheckCircle2 className="mx-auto mb-3 h-10 w-10 text-uk-blue" /> : <Clock className="mx-auto mb-3 h-10 w-10 text-uk-muted" />}
      <h1 className="font-heading text-2xl font-bold text-uk-heading">{c.title}</h1>
      <p className="mx-auto mt-2 max-w-lg text-sm text-uk-muted">{c.text}</p>
    </section>
  );
}

// --- the candidate picks another time ------------------------------------------------------------------

/**
 * "Can't make this time?": the times HR's settings allow, in the candidate's
 * own time zone. Choosing one moves the interview; the page then opens the new
 * link (also emailed), and the old link stops working.
 */
function PickTime({ state, api, open = false }: { state: PortalState; api: Api; open?: boolean }) {
  const r = state.reschedule!;
  const [show, setShow] = useState(open);
  const [chosen, setChosen] = useState("");
  const [busy, setBusy] = useState(false);
  const fmt = (iso: string) => {
    try {
      return new Date(iso).toLocaleString(undefined, { timeZone: r.timeZone, weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
    } catch {
      return new Date(iso).toLocaleString();
    }
  };
  if (!show) {
    return (
      <button type="button" className="text-sm text-uk-blue hover:underline" onClick={() => setShow(true)}>
        Can't make this time? Pick another one
      </button>
    );
  }
  return (
    <section className={`${card} ${open ? "" : "!p-4"}`} aria-labelledby="pick-time">
      <h2 id="pick-time" className="font-heading text-base font-semibold text-uk-heading">Pick another time</h2>
      <p className="mt-1 text-sm text-uk-muted">
        Times are in your time zone ({r.timeZone}). You can do this {r.left === 1 ? "once more" : `${r.left} more times`}. We'll email you the new link.
      </p>
      <fieldset className="mt-3 grid gap-2 sm:grid-cols-2">
        <legend className="sr-only">Available times</legend>
        {r.slots.map((s) => (
          <label key={s} className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-sm ${chosen === s ? "border-uk-blue bg-uk-blue/5 text-uk-heading" : "border-uk-line text-uk-body hover:border-uk-blue/50"}`}>
            <input type="radio" name="slot" value={s} checked={chosen === s} onChange={() => setChosen(s)} className="accent-uk-blue" />
            {fmt(s)}
          </label>
        ))}
      </fieldset>
      <button
        type="button"
        className={`${primary} mt-4`}
        disabled={!chosen || busy}
        onClick={async () => {
          setBusy(true);
          const res = await api("reschedule", { startsAt: chosen });
          if (res.ok && res.link) window.location.assign(res.link);
          else setBusy(false);
        }}
      >
        {busy ? <><Loader2 className="h-4 w-4 animate-spin" /> Moving…</> : "Move my interview to this time"}
      </button>
    </section>
  );
}

// --- welcome, consent, device check ---------------------------------------------------------------

type Check = "idle" | "checking" | "ok" | "error";

function Welcome({ state, api, busy, onStart, stream }: { state: PortalState; api: Api; busy: boolean; onStart: () => void; stream: StreamBox }) {
  const video = state.mode === "video";
  const needed = video ? ["audio", "video", "transcription", "ai", "storage"] : ["ai", "storage"];
  const [ticked, setTicked] = useState<Record<string, boolean>>({});
  const [cam, setCam] = useState<Check>("idle");
  const [deviceError, setDeviceError] = useState("");
  const [level, setLevel] = useState(0);
  const [heardSound, setHeardSound] = useState(false);
  const [net, setNet] = useState<{ ms: number } | null>(null);
  const [showAlt, setShowAlt] = useState(false);
  const [note, setNote] = useState("");
  const preview = useRef<HTMLVideoElement>(null);
  const audioCtx = useRef<AudioContext | null>(null);
  const supported = useBrowser(() => !!navigator.mediaDevices?.getUserMedia && !!pickMime(), true);
  const canSpeak = useBrowser(speechOutputSupported, true);
  const canListen = useBrowser(() => speechInputSupported(state.speechProvider), true);

  const allTicked = needed.every((k) => ticked[k]);

  const checkDevices = async () => {
    setCam("checking");
    setDeviceError("");
    try {
      stream.get()?.getTracks().forEach((t) => t.stop());
      const open = async () => {
        const got = await navigator.mediaDevices.getUserMedia({ video: { width: { ideal: 640 }, height: { ideal: 360 }, frameRate: { ideal: 15 } }, audio: { echoCancellation: true, noiseSuppression: true } });
        if (!got.getVideoTracks().length || !got.getAudioTracks().length) {
          got.getTracks().forEach((t) => t.stop());
          throw Object.assign(new Error("missing"), { name: "NotFoundError" });
        }
        return got;
      };
      // Right after a reload the closing page may still hold the camera for a moment:
      // a busy or "not found" device is tried twice more before the candidate sees an error.
      let s: MediaStream | null = null;
      for (let attempt = 1; !s; attempt++) {
        try {
          s = await open();
        } catch (err) {
          const n = (err as { name?: string }).name;
          if (attempt >= 3 || !(n === "NotReadableError" || n === "NotFoundError" || n === "AbortError")) throw err;
          await new Promise((r) => setTimeout(r, 1200 * attempt));
        }
      }
      stream.set(s);
      if (preview.current) {
        preview.current.srcObject = s;
        await preview.current.play().catch(() => {});
      }
      // Microphone level meter.
      audioCtx.current?.close().catch(() => {});
      const ctx = new AudioContext();
      audioCtx.current = ctx;
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      ctx.createMediaStreamSource(s).connect(analyser);
      const data = new Uint8Array(analyser.frequencyBinCount);
      const tick = () => {
        if (ctx.state === "closed") return;
        analyser.getByteTimeDomainData(data);
        let peak = 0;
        for (const v of data) peak = Math.max(peak, Math.abs(v - 128));
        const l = Math.min(1, peak / 64);
        setLevel(l);
        if (l > 0.12) setHeardSound(true);
        requestAnimationFrame(tick);
      };
      tick();
      setCam("ok");
    } catch (e) {
      const name = (e as { name?: string }).name;
      // The browser's own reason, for support (the candidate sees the plain-language message below).
      console.warn("[interview] camera/microphone check failed:", name, (e as { message?: string }).message ?? "");
      setCam("error");
      setDeviceError(
        name === "NotAllowedError" || name === "SecurityError"
          ? "Camera or microphone access was blocked. Click the camera icon in your browser's address bar (or Settings → Privacy → Site settings), allow both for this site, then press “Check again”."
          : name === "NotFoundError" || name === "OverconstrainedError"
            ? "We couldn't find a camera and a microphone. Connect them (or check they're enabled in your computer's settings) and press “Check again”."
            : name === "NotReadableError"
              ? "Your camera or microphone is being used by another app (Zoom, Teams…). Close it and press “Check again”."
              : "We couldn't start your camera and microphone. Press “Check again”, or try Chrome or Edge."
      );
    }
  };

  useEffect(() => () => void audioCtx.current?.close().catch(() => {}), []);

  // Once consent is given (or was already saved), ask for the camera and
  // microphone straight away: the browser's permission prompt opens without
  // the candidate having to find the button. "Check again" stays for retries.
  const autoChecked = useRef(false);
  const autoCheckDevices = () => {
    if (!video || autoChecked.current) return;
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) return;
    autoChecked.current = true;
    void checkDevices();
  };
  // Consent already saved (page reopened): ask for the devices as soon as the page shows.
  useEffect(() => {
    if (!state.consented) return;
    const t = setTimeout(autoCheckDevices, 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.consented]);

  // Internet check: time a round trip to the server.
  useEffect(() => {
    const t0 = performance.now();
    void api("state").then(() => setNet({ ms: Math.round(performance.now() - t0) }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const consent = async () => {
    await api("consent", { items: needed });
    // Straight on to the browser's camera/microphone permission prompt.
    autoCheckDevices();
  };

  const ready = state.consented && (!video || (cam === "ok" && heardSound));

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
      <section className={card}>
        <p className="text-sm font-medium text-uk-blue">{state.company}</p>
        <h1 className="mt-1 font-heading text-2xl font-bold text-uk-heading sm:text-3xl">Hello {state.candidateName.split(" ")[0]},</h1>
        <p className="mt-2 text-uk-body">
          Welcome to your first-round interview for <strong className="text-uk-heading">{state.position}</strong>.
          {state.resuming ? " You can continue where you stopped." : ""}
        </p>
        <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-xl bg-uk-surface-2 p-3"><dt className="text-uk-muted">Duration</dt><dd className="font-semibold text-uk-heading">About {state.durationMinutes} minutes</dd></div>
          <div className="rounded-xl bg-uk-surface-2 p-3"><dt className="text-uk-muted">Questions</dt><dd className="font-semibold text-uk-heading">{state.questionCount} in {state.sections.length} sections</dd></div>
          {state.test && <div className="col-span-2 rounded-xl bg-uk-surface-2 p-3"><dt className="text-uk-muted">Short test at the end</dt><dd className="font-semibold text-uk-heading">Multiple choice, {state.test.minutes} minutes</dd></div>}
        </dl>
        <h2 className="mt-6 font-heading text-base font-semibold text-uk-heading">How it works</h2>
        <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm text-uk-body">
          <li>An <strong>AI interviewer</strong> asks one question at a time, out loud and on screen. It may ask a short follow-up.</li>
          <li>{video ? "Answer out loud. Your words appear as text: check and correct them, then submit." : "Type your answer to each question, then submit."}</li>
          <li>There are no trick questions. If you don't know something, say so and move on.</li>
          <li>Stay on this page: switching tabs is noted for HR (it never rejects you on its own).</li>
          <li>If your connection drops, open the link again in the same browser to continue.</li>
        </ul>
        <p className="mt-4 text-sm text-uk-muted">Sections: {state.sections.map((s) => s.label).join(" · ")}</p>
        {state.reschedule && <div className="mt-5"><PickTime state={state} api={api} /></div>}
      </section>

      <section className={`${card} space-y-6`}>
        {/* Step 1: consent */}
        <div>
          <h2 className="flex items-center gap-2 font-heading text-base font-semibold text-uk-heading"><ShieldCheck className="h-5 w-5 text-uk-blue" /> 1. Privacy and recording</h2>
          <p className="mt-1 text-sm text-uk-muted">
            {video ? "Your interview is recorded (video and audio) and transcribed. " : ""}An AI assesses your answers against the job's requirements only, never your appearance, voice, accent or background, and HR reviews every result.
            {state.retentionDays > 0 ? ` Recordings are deleted after ${state.retentionDays} days.` : ""} You can ask HR ({state.hrEmail}) to withdraw your consent or delete your data at any time.
          </p>
          {state.consented ? (
            <p className="mt-3 flex items-center gap-2 text-sm font-medium text-emerald-700 dark:text-emerald-400"><CheckCircle2 className="h-4 w-4" /> Thank you, your consent is saved.</p>
          ) : (
            <fieldset className="mt-3 space-y-2">
              <legend className="sr-only">I agree to</legend>
              {needed.map((k) => (
                <label key={k} className="flex items-start gap-2.5 text-sm text-uk-body">
                  <input type="checkbox" className="mt-0.5 h-4 w-4 accent-[var(--uk-blue)]" checked={!!ticked[k]} onChange={(e) => setTicked((t) => ({ ...t, [k]: e.target.checked }))} />
                  {CONSENT_TEXT[k]}
                </label>
              ))}
              <button type="button" className={`${primary} mt-2`} disabled={!allTicked} onClick={consent}>I agree</button>
            </fieldset>
          )}
        </div>

        {/* Step 2: devices */}
        {video && (
          <div>
            <h2 className="flex items-center gap-2 font-heading text-base font-semibold text-uk-heading"><Camera className="h-5 w-5 text-uk-blue" /> 2. Camera and microphone</h2>
            {!supported ? (
              <p className="mt-2 text-sm text-amber-700 dark:text-amber-400">This browser can't record the interview. Please open the link in a recent Google Chrome or Microsoft Edge on a computer.</p>
            ) : (
              <>
                <div className="relative mt-3 aspect-video overflow-hidden rounded-xl bg-black/80">
                  <video ref={preview} muted playsInline className="h-full w-full -scale-x-100 object-cover" aria-label="Your camera preview" />
                  {cam !== "ok" && <div className="absolute inset-0 flex items-center justify-center text-sm text-white/80">{cam === "checking" ? "Starting camera…" : "Camera off"}</div>}
                </div>
                {cam === "ok" && (
                  <div className="mt-3">
                    <div className="flex items-center gap-2 text-sm text-uk-body"><Mic className="h-4 w-4" /> Say something to test your microphone</div>
                    <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-uk-surface-2" role="meter" aria-label="Microphone level" aria-valuenow={Math.round(level * 100)} aria-valuemin={0} aria-valuemax={100}>
                      <div className="h-full rounded-full bg-emerald-500 transition-[width] duration-75" style={{ width: `${Math.round(level * 100)}%` }} />
                    </div>
                    {heardSound && <p className="mt-1 text-xs text-emerald-700 dark:text-emerald-400">Microphone works.</p>}
                  </div>
                )}
                {deviceError && <p role="alert" className="mt-3 text-sm text-red-700 dark:text-red-400">{deviceError}</p>}
                <button type="button" className={`${secondary} mt-3`} onClick={checkDevices} disabled={cam === "checking"}>
                  <RefreshCw className="h-4 w-4" /> {cam === "idle" ? "Turn on camera and microphone" : "Check again"}
                </button>
                <ul className="mt-3 space-y-1 text-xs text-uk-muted">
                  <li className="flex items-center gap-1.5"><Wifi className="h-3.5 w-3.5" /> Connection: {net ? (net.ms < 1500 ? `good (${net.ms} ms)` : `slow (${net.ms} ms), close other downloads if you can`) : "checking…"}</li>
                  <li className="flex items-center gap-1.5"><Camera className="h-3.5 w-3.5" /> Sit alone, facing the camera, in a well-lit place.</li>
                  <li className="flex items-center gap-1.5"><Volume2 className="h-3.5 w-3.5" /> {canSpeak ? "The interviewer will speak; turn your volume up." : "Questions will be shown as text."}</li>
                  <li className="flex items-center gap-1.5"><Mic className="h-3.5 w-3.5" /> {canListen ? "Your answers are transcribed as you speak." : "Speech-to-text isn't available in this browser: you'll type your answers (still recorded)."}</li>
                </ul>
              </>
            )}
          </div>
        )}

        <div className="border-t border-uk-line pt-5">
          <button type="button" className={`${primary} w-full`} disabled={!ready || busy} onClick={onStart}>
            {busy ? <><Loader2 className="h-4 w-4 animate-spin" /> Preparing your interview…</> : state.resuming ? "Continue interview" : "Start interview"}
          </button>
          {!ready && <p className="mt-2 text-center text-xs text-uk-muted">{!state.consented ? "Accept the notice above first." : "Turn on your camera and say something to test the microphone."}</p>}
          {!state.resuming && (
            <div className="mt-4 text-center">
              {!showAlt ? (
                <button type="button" className="text-sm text-uk-blue underline-offset-2 hover:underline" onClick={() => setShowAlt(true)}>
                  I can't use a camera or microphone: I need an alternative
                </button>
              ) : (
                <form
                  className="space-y-2 text-left"
                  onSubmit={(e) => {
                    e.preventDefault();
                    void api("accommodation", { note });
                  }}
                >
                  <label htmlFor="alt-note" className="text-sm font-medium text-uk-heading">Tell us what would help (optional)</label>
                  <textarea id="alt-note" value={note} onChange={(e) => setNote(e.target.value)} maxLength={1000} rows={3} className="w-full rounded-lg border border-input bg-transparent p-3 text-sm outline-none focus-visible:border-ring" />
                  <p className="text-xs text-uk-muted">HR will contact you to arrange another way, such as a written interview. Nobody is rejected for asking.</p>
                  <button type="submit" className={secondary}>Send request</button>
                </form>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

// --- the interview ----------------------------------------------------------------------------------------

function Interview({ token, state, api, stream, recorder }: { token: string; state: PortalState; api: Api; stream: StreamBox; recorder: ReturnType<typeof useRecorder> }) {
  const q = state.question!;
  const video = state.mode === "video";
  // Deepgram live speech-to-text when the server has a key (a 60-second token per
  // answer, fetched quietly: on any failure the browser's own recognition is used).
  const deepgram = useMemo<DeepgramOptions | null>(
    () =>
      state.speechProvider === "deepgram"
        ? {
            getStream: () => stream.get(),
            getToken: async () => {
              const res = await fetch(`/interview/${token}/api/speech_token`, { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
              const data = (await res.json().catch(() => ({}))) as { ok?: boolean; speech?: { url: string; accessToken: string } };
              if (!res.ok || !data.ok || !data.speech) throw Object.assign(new Error("speech token"), { status: res.status });
              return data.speech;
            },
          }
        : null,
    [state.speechProvider, stream, token]
  );
  const speech = useSpeech(state.language, deepgram);
  const canSpeak = useBrowser(speechOutputSupported, false);
  const canListen = useBrowser(() => speechInputSupported(state.speechProvider), false);
  // The answer typed so far is kept as a draft for this question (restored after a reload).
  const [answer, setAnswer] = useState(() => readDraft<string>(`q:${q.id}`, ""));
  useEffect(() => {
    const t = setTimeout(() => writeDraft(`q:${q.id}`, answer), 400);
    return () => clearTimeout(t);
  }, [answer, q.id]);
  const [usedSpeech, setUsedSpeech] = useState(false);
  const [edited, setEdited] = useState(false);
  const [sending, setSending] = useState(false);
  const [lost, setLost] = useState<string>(() =>
    video && !stream.get() ? "Your camera and microphone are off. Reload the page to continue; your answers so far are saved." : ""
  );
  const startedAt = useRef(new Date().toISOString());
  const self = useRef<HTMLVideoElement>(null);
  // Face count (where the browser supports it): a warning for HR only.
  useFaceWatch(self, video && !lost, (kind, detail) => void api("flag", { kind, detail }));
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  // Show the camera, and watch for it (or the microphone) stopping.
  useEffect(() => {
    if (!video) return;
    const s = stream.get();
    if (!s) return;
    if (self.current) {
      self.current.srcObject = s;
      void self.current.play().catch(() => {});
    }
    const handlers = s.getTracks().map((t) => {
      const h = () => {
        setLost(`Your ${t.kind === "video" ? "camera" : "microphone"} stopped. Check it's connected and allowed, then reload the page to continue where you left off.`);
        void api("flag", { kind: t.kind === "video" ? "camera_lost" : "mic_lost" });
      };
      t.addEventListener("ended", h);
      return () => t.removeEventListener("ended", h);
    });
    return () => handlers.forEach((off) => off());
  }, [video, stream, api]);

  // Each question (this component is keyed by it): read it out, then listen.
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      await speech.speak(q.text);
      if (!cancelled && video && speechInputSupported(state.speechProvider)) {
        if (speech.listen((t) => setAnswer((a) => (a ? `${a} ${t}` : t)))) setUsedSpeech(true);
      }
    })();
    return () => {
      cancelled = true;
      speech.stopListening();
      speech.stopSpeaking();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q.id]);

  // Read the question again with the microphone paused, so the interviewer's
  // own voice never ends up in the answer; listen again afterwards if it was on.
  const repeatQuestion = async () => {
    const wasListening = speech.listening;
    speech.stopListening();
    await speech.speak(q.text);
    if (wasListening && video && speechInputSupported(state.speechProvider)) speech.listen((t) => setAnswer((a) => (a ? `${a} ${t}` : t)));
  };

  const submit = async (skipped: boolean) => {
    speech.stopListening();
    speech.stopSpeaking();
    setSending(true);
    const text = skipped ? "" : `${answer} ${speech.interim}`.trim();
    const res = await api("answer", {
      questionId: q.id,
      text,
      skipped,
      input: usedSpeech ? (edited ? "speech_edited" : "speech") : "typed",
      startedAt: startedAt.current,
      offsetMs: recorder.offset(),
    });
    if (res.ok) writeDraft(`q:${q.id}`, null);
    setSending(false);
  };

  const elapsed = state.startedAt ? Math.max(0, Math.floor((now - new Date(state.startedAt).getTime()) / 1000)) : 0;
  const left = state.durationMinutes * 60 - elapsed;
  const progress = Math.round((q.index / Math.max(1, q.total)) * 100);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
      <aside className="space-y-4">
        {video && (
          <div className="relative aspect-video overflow-hidden rounded-2xl bg-black/80">
            <video ref={self} muted playsInline className="h-full w-full -scale-x-100 object-cover" aria-label="Your camera" />
            <span className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-black/60 px-2.5 py-1 text-xs text-white">
              {/* The microphone records all the time (it's part of the video); "Listening" means speech-to-text is on too. */}
              <Mic className={`h-3.5 w-3.5 ${speech.listening ? "text-emerald-400" : ""}`} />
              {speech.listening ? "Listening" : "Mic on"}
            </span>
          </div>
        )}
        <div className="rounded-2xl border border-uk-line bg-uk-card p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-uk-muted">Question {q.index + 1} of {q.total}</span>
            <span className={`flex items-center gap-1 font-medium ${left < 0 ? "text-amber-600 dark:text-amber-400" : "text-uk-heading"}`}>
              <Clock className="h-4 w-4" /> {left >= 0 ? `${Math.floor(left / 60)}:${String(left % 60).padStart(2, "0")} left` : "Over time: take the time you need"}
            </span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-uk-surface-2" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} aria-label="Interview progress">
            <div className="h-full rounded-full bg-uk-blue transition-[width]" style={{ width: `${progress}%` }} />
          </div>
          <p className="mt-2 text-xs text-uk-muted">{sectionLabel[q.section]}</p>
        </div>
      </aside>

      <section className={card}>
        {lost && (
          <div role="alert" className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-300">{lost}</div>
        )}
        <div className="flex items-start gap-3">
          <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-uk-blue/12 text-uk-blue ${speech.speaking ? "animate-pulse" : ""}`} aria-hidden>
            <Bot className="h-6 w-6" />
          </span>
          <div>
            <p className="text-xs font-medium text-uk-muted">AI interviewer{q.followUp ? " · follow-up" : ""}</p>
            <h1 className="mt-1 font-heading text-xl font-semibold leading-snug text-uk-heading" aria-live="polite">{q.text}</h1>
            {canSpeak && (
              <button type="button" className="mt-2 inline-flex items-center gap-1 text-xs text-uk-blue hover:underline" onClick={() => void repeatQuestion()}>
                <Volume2 className="h-3.5 w-3.5" /> Repeat the question
              </button>
            )}
          </div>
        </div>

        <label htmlFor="answer" className="mt-6 block text-sm font-medium text-uk-heading">
          Your answer {usedSpeech ? "(transcribed as you speak; correct anything that's wrong)" : ""}
        </label>
        <textarea
          id="answer"
          value={speech.interim ? `${answer}${answer ? " " : ""}${speech.interim}` : answer}
          onChange={(e) => {
            setAnswer(e.target.value);
            if (usedSpeech) setEdited(true);
          }}
          onPaste={() => void api("flag", { kind: "paste" })}
          maxLength={ANSWER_MAX}
          rows={7}
          disabled={sending || !!lost}
          placeholder={video && canListen ? "Start speaking: your words appear here…" : "Type your answer here…"}
          className="mt-2 w-full rounded-xl border border-input bg-transparent p-3 text-sm leading-relaxed outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
        {speech.error && <p className="mt-1 text-xs text-amber-700 dark:text-amber-400">{speech.error}</p>}

        <div className="mt-4 flex flex-wrap items-center gap-3">
          {video && canListen &&
            (speech.listening ? (
              <button type="button" className={secondary} onClick={speech.stopListening}><Square className="h-4 w-4" /> Stop listening</button>
            ) : (
              <button type="button" className={secondary} disabled={sending || !!lost} onClick={() => speech.listen((t) => setAnswer((a) => (a ? `${a} ${t}` : t))) && setUsedSpeech(true)}>
                <Mic className="h-4 w-4" /> Speak
              </button>
            ))}
          <button type="button" className={primary} disabled={sending || !!lost || `${answer}${speech.interim}`.trim().length < 2} onClick={() => submit(false)}>
            {sending ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</> : "Submit answer"}
          </button>
          <button type="button" className="text-sm text-uk-muted hover:text-uk-heading" disabled={sending || !!lost} onClick={() => submit(true)}>
            Skip this question
          </button>
        </div>
      </section>
    </div>
  );
}

// --- the timed test --------------------------------------------------------------------------------------------

// Drafts kept in this browser (per interview link), so a reload, a crash or a
// camera re-check never loses a long typed answer or the test choices. Only a
// convenience: the server is the record, and storage may be unavailable.
const draftKey = (part: string) => (typeof window === "undefined" ? "" : `uk-iv-draft:${window.location.pathname}:${part}`);
function readDraft<T>(part: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(draftKey(part));
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function writeDraft(part: string, value: unknown) {
  try {
    if (value === null || value === "") window.localStorage.removeItem(draftKey(part));
    else window.localStorage.setItem(draftKey(part), JSON.stringify(value));
  } catch {}
}

function Test({ state, api }: { state: PortalState; api: Api }) {
  const t = state.test!;
  const [chosen, setChosenRaw] = useState<Record<string, number>>(() => readDraft("test", {}));
  const setChosen = (fn: (c: Record<string, number>) => Record<string, number>) =>
    setChosenRaw((c) => {
      const next = fn(c);
      writeDraft("test", next);
      return next;
    });
  const [now, setNow] = useState(() => Date.now());
  const [sending, setSending] = useState(false);
  const sent = useRef(false);

  const submit = useCallback(
    async (auto: boolean) => {
      if (sent.current) return;
      sent.current = true;
      setSending(true);
      const res = await api("test_submit", { answers: chosen, auto });
      setSending(false);
      // Failed (offline, server error): let the candidate press Submit again.
      // On success the state moves on and this screen goes away.
      if (!res.ok) sent.current = false;
      else writeDraft("test", null);
    },
    [api, chosen]
  );

  // Time is up but the automatic submit failed (offline): keep trying every few seconds.
  const timeUp = t.deadline ? new Date(t.deadline).getTime() <= now : false;
  useEffect(() => {
    if (!timeUp) return;
    const r = setInterval(() => void submit(true), 8000);
    return () => clearInterval(r);
  }, [timeUp, submit]);

  useEffect(() => {
    if (!t.deadline) return;
    const i = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(i);
  }, [t.deadline]);

  const left = t.deadline ? Math.max(0, Math.floor((new Date(t.deadline).getTime() - now) / 1000)) : null;
  useEffect(() => {
    if (left === 0) void submit(true);
  }, [left, submit]);

  if (!t.deadline) {
    return (
      <section className={`${card} text-center`}>
        <h1 className="font-heading text-2xl font-bold text-uk-heading">Last part: a short test</h1>
        <p className="mx-auto mt-2 max-w-md text-sm text-uk-muted">Multiple-choice questions on the job's skills. You have {t.minutes} minutes; it submits itself when the time is up.</p>
        <button type="button" className={`${primary} mt-6`} onClick={() => void api("test_start")}>Start the test</button>
      </section>
    );
  }

  return (
    <section className={card}>
      <div className="mb-5 flex items-center justify-between">
        <h1 className="font-heading text-xl font-semibold text-uk-heading">Short test</h1>
        <span className={`flex items-center gap-1 text-sm font-semibold ${left !== null && left < 60 ? "text-red-600" : "text-uk-heading"}`} aria-live="polite">
          <Clock className="h-4 w-4" /> {left !== null ? `${Math.floor(left / 60)}:${String(left % 60).padStart(2, "0")}` : ""}
        </span>
      </div>
      <ol className="space-y-6">
        {t.questions.map((m, n) => (
          <li key={m.id}>
            <fieldset>
              <legend className="font-medium text-uk-heading">{n + 1}. {m.question}</legend>
              <div className="mt-2 space-y-1.5">
                {m.options.map((o, k) => (
                  <label key={k} className="flex items-start gap-2.5 rounded-lg border border-uk-line px-3 py-2 text-sm text-uk-body has-[:checked]:border-uk-blue has-[:checked]:bg-uk-blue/5">
                    <input type="radio" name={m.id} className="mt-0.5 accent-[var(--uk-blue)]" checked={chosen[m.id] === k} onChange={() => setChosen((c) => ({ ...c, [m.id]: k }))} />
                    {o}
                  </label>
                ))}
              </div>
            </fieldset>
          </li>
        ))}
      </ol>
      <button type="button" className={`${primary} mt-6`} disabled={sending} onClick={() => submit(false)}>
        {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Submit test
      </button>
    </section>
  );
}
