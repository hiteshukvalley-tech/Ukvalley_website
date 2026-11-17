"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import Link from "@/components/site/intent-link";
import { AlarmClock, ExternalLink, MapPin, Video, X } from "lucide-react";
import { upcomingInterviewsAction, type UpcomingInterview } from "@/app/admin/(panel)/interviews/actions";
import { INTERVIEWS_CHANGED } from "@/app/admin/(panel)/interviews/interview-actions";

/** Remind this long before an interview starts. */
const LEAD_MS = 30 * 60 * 1000;
/** Re-read today's interviews this often (and right after a reschedule or cancel). */
const RELOAD_MS = 5 * 60 * 1000;
/** Check the clock this often. */
const TICK_MS = 15 * 1000;

/** One reminder per interview time: a rescheduled interview gets a new one. */
const keyOf = (i: UpcomingInterview) => `uk-interview-reminder:${i.applicationId}:${i.startsAt}`;

// The browser remembers which reminders were shown (per device), so a reload or
// a second tab doesn't show the same one again. Storage can be unavailable.
const wasShown = (k: string) => {
  try {
    return localStorage.getItem(k) === "1";
  } catch {
    return false;
  }
};
const markShown = (k: string) => {
  try {
    localStorage.setItem(k, "1");
  } catch {
    /* in-memory only */
  }
};

const clock = (t: number) =>
  new Intl.DateTimeFormat("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true, timeZone: "Asia/Kolkata" }).format(t).toUpperCase();
const minutesLeft = (t: number, now: number) => Math.max(0, Math.round((t - now) / 60000));
const isUrl = (s: string) => /^https?:\/\/\S+$/i.test(s);

/**
 * Today's-interview reminder for HR: 30 minutes before each interview (not
 * cancelled, with a time) a popup opens in the admin panel and, when the
 * browser allows it, a desktop notification is shown too.
 */
export function InterviewReminder() {
  const [interviews, setInterviews] = useState<UpcomingInterview[]>([]);
  const [due, setDue] = useState<UpcomingInterview[]>([]);
  const [now, setNow] = useState(() => Date.now());
  const shown = useRef(new Set<string>());
  const router = useRouter();

  const load = useCallback(async () => {
    try {
      setInterviews(await upcomingInterviewsAction());
    } catch {
      // keep the last list; the next reload tries again
    }
  }, []);

  useEffect(() => {
    const first = setTimeout(load, 0);
    const timer = setInterval(load, RELOAD_MS);
    const onVisible = () => document.visibilityState === "visible" && void load();
    window.addEventListener(INTERVIEWS_CHANGED, load);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearTimeout(first);
      clearInterval(timer);
      window.removeEventListener(INTERVIEWS_CHANGED, load);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [load]);

  // Ask once for desktop notifications, on the first click (browsers want a user action).
  useEffect(() => {
    if (typeof Notification === "undefined" || Notification.permission !== "default") return;
    const ask = () => void Notification.requestPermission().catch(() => {});
    document.addEventListener("pointerdown", ask, { once: true });
    return () => document.removeEventListener("pointerdown", ask);
  }, []);

  useEffect(() => {
    const check = () => {
      const t = Date.now();
      setNow(t);
      const fresh = interviews.filter((i) => {
        const k = keyOf(i);
        const inWindow = i.startsAt > t && i.startsAt - t <= LEAD_MS;
        return inWindow && !shown.current.has(k) && !wasShown(k);
      });
      if (!fresh.length) return;
      for (const i of fresh) {
        const k = keyOf(i);
        shown.current.add(k);
        markShown(k);
        notifyDesktop(i, t, (href) => router.push(href));
      }
      setDue((d) => [...d.filter((x) => !fresh.some((f) => f.applicationId === x.applicationId)), ...fresh].sort((a, b) => a.startsAt - b.startsAt));
    };
    const first = setTimeout(check, 0);
    const timer = setInterval(check, TICK_MS);
    return () => {
      clearTimeout(first);
      clearInterval(timer);
    };
  }, [interviews, router]);

  // Drop reminders for interviews that were cancelled or moved since they were shown.
  const live = due.filter((d) => interviews.some((i) => i.applicationId === d.applicationId && i.startsAt === d.startsAt));
  if (!live.length) return null;
  const close = () => setDue([]);

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-start justify-center bg-black/40 p-4 pt-24" onPointerDown={(e) => e.target === e.currentTarget && close()}>
      <div role="alertdialog" aria-modal="true" aria-labelledby="interview-reminder-title" className="w-full max-w-md overflow-hidden rounded-2xl border border-uk-line bg-uk-card shadow-2xl">
        <div className="flex items-center justify-between gap-3 bg-uk-blue px-5 py-3 text-uk-white">
          <h2 id="interview-reminder-title" className="flex items-center gap-2 font-heading text-base font-semibold">
            <AlarmClock className="h-5 w-5" /> {live.length === 1 ? "Interview starting soon" : `${live.length} interviews starting soon`}
          </h2>
          <button type="button" onClick={close} aria-label="Dismiss" className="rounded-lg p-1 hover:bg-white/15">
            <X className="h-5 w-5" />
          </button>
        </div>
        <ul className="max-h-[60vh] divide-y divide-uk-line overflow-y-auto" data-lenis-prevent>
          {live.map((i) => (
            <li key={keyOf(i)} className="px-5 py-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-uk-blue">
                {clock(i.startsAt)} · starts in {minutesLeft(i.startsAt, now)} min
              </p>
              <p className="mt-1 font-semibold text-uk-heading">{i.name}</p>
              <p className="text-sm text-uk-body">{i.position}</p>
              <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-uk-muted">
                {i.mode && <span className="inline-flex items-center gap-1"><Video className="h-3.5 w-3.5" /> {i.mode}</span>}
                {i.venue &&
                  (isUrl(i.venue) ? (
                    <a href={i.venue} target="_blank" rel="noopener noreferrer" className="inline-flex max-w-full items-center gap-1 text-uk-blue hover:underline">
                      <ExternalLink className="h-3.5 w-3.5 shrink-0" /> <span className="truncate">Join meeting</span>
                    </a>
                  ) : (
                    <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {i.venue}</span>
                  ))}
              </div>
              <Link href={`/admin/applications/${i.applicationId}`} onClick={close} className="mt-2 inline-block text-sm font-medium text-uk-blue hover:underline">
                Open application
              </Link>
            </li>
          ))}
        </ul>
        <div className="flex justify-end border-t border-uk-line px-5 py-3">
          <button type="button" onClick={close} className="h-9 rounded-lg bg-uk-blue px-4 text-sm font-semibold text-uk-white hover:bg-uk-blue-bright">
            OK, got it
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

/** A desktop notification (only when the browser allows it); a click brings the admin panel forward. */
function notifyDesktop(i: UpcomingInterview, now: number, open: (href: string) => void) {
  if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
  try {
    const n = new Notification(`Interview in ${minutesLeft(i.startsAt, now)} min: ${i.name}`, {
      body: `${i.position} · ${clock(i.startsAt)}${i.mode ? ` · ${i.mode}` : ""}`,
      tag: keyOf(i),
      icon: "/icon.png",
    });
    n.onclick = () => {
      window.focus();
      open(`/admin/applications/${i.applicationId}`);
      n.close();
    };
  } catch {
    // some browsers only allow notifications from a service worker; the popup still shows
  }
}
