"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// The AI interviewer's voice (speechSynthesis) and the candidate's
// speech-to-text (the browser's SpeechRecognition: Chrome and Edge send the
// audio to their own speech service). Both are optional: without them the
// question is shown as text and the candidate types the answer.

type Recognition = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((e: { resultIndex: number; results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }> }) => void) | null;
  onend: (() => void) | null;
  onerror: ((e: { error: string }) => void) | null;
};

const recognitionClass = (): (new () => Recognition) | null => {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: new () => Recognition; webkitSpeechRecognition?: new () => Recognition };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
};

export const speechOutputSupported = () => typeof window !== "undefined" && "speechSynthesis" in window;

// --- Deepgram live speech-to-text (as on GrowthValley) ------------------------------------------
// When the server has a Deepgram key, the microphone is turned into 16 kHz
// PCM here and streamed to Deepgram over a WebSocket: words come back while
// the candidate is still speaking, in any modern browser. The server hands out
// a 60-second token per listening session. The browser's own recognition is
// the fallback (no key, no connection, or two failed sessions in a row).

type AudioCtxClass = typeof AudioContext;
const audioCtxClass = (): AudioCtxClass | null =>
  typeof window === "undefined" ? null : (window.AudioContext ?? (window as unknown as { webkitAudioContext?: AudioCtxClass }).webkitAudioContext ?? null);

/** This browser can capture and stream the microphone (needed for Deepgram). */
export const streamingSupported = () =>
  !!(audioCtxClass() && typeof WebSocket !== "undefined" && typeof navigator !== "undefined" && typeof navigator.mediaDevices?.getUserMedia === "function" && typeof MediaStream !== "undefined");

const TARGET_RATE = 16000;
const FRAME = 2048; // ~43 ms at 48 kHz: small pieces keep the delay low
const FINAL_WAIT_MS = 3000; // after Stop: wait this long for the last words before closing
const MAX_QUEUED = 200; // audio pieces kept while the connection opens (~8 s)

/** Float samples at `inRate` → 16-bit PCM at 16 kHz (averaging the samples of each output sample). */
function toPcm16(input: Float32Array, inRate: number): ArrayBuffer {
  const ratio = inRate / TARGET_RATE;
  const len = Math.max(0, Math.floor(input.length / ratio));
  const out = new Int16Array(len);
  for (let i = 0; i < len; i++) {
    const start = Math.floor(i * ratio);
    const end = Math.min(input.length, Math.max(start + 1, Math.floor((i + 1) * ratio)));
    let sum = 0;
    for (let j = start; j < end; j++) sum += input[j];
    const v = Math.max(-1, Math.min(1, sum / (end - start)));
    out[i] = v < 0 ? v * 0x8000 : v * 0x7fff;
  }
  return out.buffer;
}

// Deepgram problems on this page: after 2 failed sessions in a row (or "not
// set up"), the browser's own recognition is used for the rest of the visit.
let deepgramFailures = 0;
let deepgramOff = false;
const deepgramUsable = () => !deepgramOff && deepgramFailures < 2 && streamingSupported();

export type DeepgramOptions = {
  /** a token and WebSocket address for one session; throws (with .status 404 when not set up) on failure */
  getToken: () => Promise<{ url: string; accessToken: string }>;
  /** the camera stream, whose microphone is reused */
  getStream: () => MediaStream | null;
};

/** Speech-to-text works here: Deepgram (any browser that can stream audio) or the browser's own recognition. */
export const speechInputSupported = (provider: "deepgram" | "browser" = "browser") =>
  recognitionClass() !== null || (provider === "deepgram" && deepgramUsable());

export function useSpeech(language: string, deepgram?: DeepgramOptions | null) {
  const rec = useRef<Recognition | null>(null);
  const wantListening = useRef(false);
  const finalText = useRef("");
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [interim, setInterim] = useState("");
  const [error, setError] = useState("");
  const [engine, setEngine] = useState<"deepgram" | "browser" | null>(null);
  const onFinal = useRef<(text: string) => void>(() => {});
  const dgRef = useRef(deepgram);
  useEffect(() => {
    dgRef.current = deepgram;
  });
  /** Ends the running Deepgram session: discard = drop words still on their way. */
  const stopStream = useRef<((discard: boolean) => void) | null>(null);

  const speak = useCallback(
    (text: string) =>
      new Promise<void>((resolve) => {
        if (!speechOutputSupported()) return resolve();
        const synth = window.speechSynthesis;
        synth.cancel();
        const u = new SpeechSynthesisUtterance(text);
        u.lang = language;
        const base = language.split("-")[0];
        const voice = synth.getVoices().find((v) => v.lang === language) ?? synth.getVoices().find((v) => v.lang.startsWith(base));
        if (voice) u.voice = voice;
        u.rate = 0.97;
        u.onstart = () => setSpeaking(true);
        u.onend = u.onerror = () => {
          setSpeaking(false);
          resolve();
        };
        synth.speak(u);
        // Some browsers never fire onend for a cancelled utterance: don't wait forever.
        setTimeout(() => {
          setSpeaking(false);
          resolve();
        }, Math.min(60_000, 2000 + text.length * 90));
      }),
    [language]
  );

  const stopSpeaking = useCallback(() => {
    if (speechOutputSupported()) window.speechSynthesis.cancel();
    setSpeaking(false);
  }, []);

  /** The browser's own recognition (Chrome / Edge). */
  const listenBrowser = useCallback(
    (append: (text: string) => void) => {
      const R = recognitionClass();
      if (!R) return false;
      onFinal.current = append;
      wantListening.current = true;
      setError("");
      setEngine("browser");
      const r = new R();
      r.lang = language;
      r.continuous = true;
      r.interimResults = true;
      r.onresult = (e) => {
        let live = "";
        for (let k = e.resultIndex; k < e.results.length; k++) {
          const res = e.results[k];
          if (res.isFinal) onFinal.current(res[0].transcript.trim());
          else live += res[0].transcript;
        }
        setInterim(live);
      };
      r.onerror = (e) => {
        if (e.error === "not-allowed" || e.error === "service-not-allowed") {
          wantListening.current = false;
          setError("Speech recognition isn't available. Please type your answer.");
        } else if (e.error === "network") {
          setError("Speech recognition lost its connection. You can keep talking or type.");
        }
      };
      // Chrome stops after a pause: start again while the candidate is still answering.
      r.onend = () => {
        setInterim("");
        if (wantListening.current) {
          try {
            r.start();
            return;
          } catch {}
        }
        setListening(false);
      };
      try {
        r.start();
        rec.current = r;
        setListening(true);
        return true;
      } catch {
        return false;
      }
    },
    [language]
  );

  /** Deepgram live streaming. Falls back to the browser's recognition when it can't start. */
  const listenDeepgram = useCallback(
    (append: (text: string) => void, dg: DeepgramOptions) => {
      onFinal.current = append;
      wantListening.current = true;
      setError("");
      setEngine("deepgram");
      setListening(true);
      const session = { dead: false, wanted: true };
      let timer: ReturnType<typeof setTimeout> | undefined;
      const finish = () => {
        clearTimeout(timer);
        if (stopStream.current === stop) stopStream.current = null;
        setListening(false);
        setInterim("");
        setEngine(null);
      };
      const fallBack = (status?: number) => {
        deepgramFailures += 1;
        if (status === 404) deepgramOff = true; // not set up on the server
        if (stopStream.current === stop) stopStream.current = null;
        if (!session.wanted || session.dead) return finish();
        if (!listenBrowser(append)) {
          setError("Speech-to-text isn't available right now. Please type your answer.");
          finish();
        }
      };

      let stream: MediaStream | null = null;
      let ownStream = false;
      let ctx: AudioContext | null = null;
      let source: MediaStreamAudioSourceNode | null = null;
      let proc: ScriptProcessorNode | null = null;
      let ws: WebSocket | null = null;
      let opened = false;
      const queue: ArrayBuffer[] = [];
      const stopAudio = () => {
        try {
          proc?.disconnect();
          source?.disconnect();
        } catch {}
        if (proc) proc.onaudioprocess = null;
        void ctx?.close().catch(() => {});
        ctx = null;
        if (ownStream) stream?.getTracks().forEach((t) => t.stop());
        ownStream = false;
      };
      const closeWhenDone = () => {
        if (!ws) return;
        queue.splice(0).forEach((b) => ws!.send(b));
        ws.send(JSON.stringify({ type: "Finalize" }));
        ws.send(JSON.stringify({ type: "CloseStream" }));
        timer = setTimeout(() => ws?.close(), FINAL_WAIT_MS);
      };
      // Stop (keep the last words) or discard (new question, answer sent).
      const stop = (discard: boolean) => {
        session.wanted = false;
        if (discard) session.dead = true;
        stopAudio();
        clearTimeout(timer);
        if (!ws) return void (discard && finish());
        if (ws.readyState > 1) return finish();
        if (discard || ws.readyState !== 1) {
          if (discard || ws.readyState !== 0) ws.close();
          if (discard) finish();
          return;
        }
        closeWhenDone();
      };
      stopStream.current = stop;

      void (async () => {
        // Microphone first (the camera stream's microphone), so nothing said while connecting is lost.
        stream = dg.getStream();
        if (!stream?.getAudioTracks().some((t) => t.readyState === "live")) {
          try {
            stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } });
            ownStream = true;
          } catch {
            setError("Speech-to-text can't hear your microphone. Please type your answer.");
            return finish();
          }
        }
        if (!session.wanted || session.dead) {
          stopAudio();
          return finish();
        }
        try {
          const Ctx = audioCtxClass()!;
          const c = new Ctx();
          ctx = c;
          source = c.createMediaStreamSource(new MediaStream(stream.getAudioTracks()));
          proc = c.createScriptProcessor(FRAME, 1, 1);
          const mute = c.createGain(); // the processor must reach the speakers to run: silently
          mute.gain.value = 0;
          proc.onaudioprocess = (e) => {
            if (!session.wanted || session.dead || !ctx) return;
            const pcm = toPcm16(e.inputBuffer.getChannelData(0), c.sampleRate);
            if (ws?.readyState === 1) ws.send(pcm);
            else if (queue.length < MAX_QUEUED) queue.push(pcm);
          };
          source.connect(proc);
          proc.connect(mute);
          mute.connect(c.destination);
          void c.resume().catch(() => {});
        } catch {
          stopAudio();
          return fallBack();
        }

        let info: { url: string; accessToken: string };
        try {
          info = await dg.getToken();
        } catch (e) {
          stopAudio();
          return fallBack((e as { status?: number }).status);
        }
        if (session.dead || (!session.wanted && !queue.length)) {
          stopAudio();
          return finish();
        }
        try {
          const sep = info.url.includes("?") ? "&" : "?";
          ws = new WebSocket(`${info.url}${sep}encoding=linear16&sample_rate=${TARGET_RATE}&channels=1`, ["bearer", info.accessToken]);
          ws.binaryType = "arraybuffer";
        } catch {
          stopAudio();
          return fallBack();
        }
        ws.onopen = () => {
          opened = true;
          deepgramFailures = 0;
          if (session.dead) return ws?.close();
          queue.splice(0).forEach((b) => ws!.send(b));
          // Stop was pressed while connecting: get the words of the audio sent so far, then close.
          if (!session.wanted) closeWhenDone();
        };
        ws.onmessage = (ev) => {
          if (session.dead || typeof ev.data !== "string") return;
          let m: { type?: string; is_final?: boolean; channel?: { alternatives?: { transcript?: string }[] } };
          try {
            m = JSON.parse(ev.data);
          } catch {
            return;
          }
          if (m.type !== "Results") return;
          const text = String(m.channel?.alternatives?.[0]?.transcript ?? "").trim();
          if (m.is_final) {
            if (text) onFinal.current(text);
            setInterim("");
          } else setInterim(text);
        };
        ws.onclose = (ev) => {
          clearTimeout(timer);
          stopAudio();
          if (session.dead) return finish();
          if (!opened) return fallBack(); // refused: the browser's recognition instead
          if (session.wanted && ev.code !== 1000) setError("Speech-to-text was interrupted. Press “Speak” to continue, or type.");
          finish();
        };
      })();
      return true;
    },
    [listenBrowser]
  );

  /** Starts listening; `append` receives each finished phrase. Deepgram when set up, else the browser's recognition. */
  const listen = useCallback(
    (append: (text: string) => void) => {
      const dg = dgRef.current;
      if (dg && deepgramUsable()) return listenDeepgram(append, dg);
      return listenBrowser(append);
    },
    [listenBrowser, listenDeepgram]
  );

  const stopListening = useCallback(() => {
    wantListening.current = false;
    stopStream.current?.(false);
    rec.current?.stop();
    rec.current = null;
    setListening(false);
    setInterim("");
  }, []);

  useEffect(
    () => () => {
      wantListening.current = false;
      stopStream.current?.(true);
      rec.current?.abort();
      if (speechOutputSupported()) window.speechSynthesis.cancel();
    },
    []
  );

  return { speak, stopSpeaking, listen, stopListening, listening, speaking, interim, error, engine, finalText };
}
