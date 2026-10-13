"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "@/components/site/intent-link";
import { Bell, CalendarClock, CheckCheck, CircleAlert, FileUser, Loader2, MailOpen } from "lucide-react";
import { loadNotificationsAction, markNotificationsReadAction } from "@/app/admin/(panel)/notifications-actions";
import type { NotificationFeed, NotificationKind } from "@/lib/notifications";
import { cn } from "@/lib/utils";

const ICONS = { application: FileUser, interview: CalendarClock, reply: MailOpen } satisfies Record<NotificationKind, unknown>;
const LABELS: Record<NotificationKind, string> = { application: "New application", interview: "Interview today", reply: "New message" };

/** Checks for new notifications this often while the panel is open in a tab. */
const REFRESH_MS = 2 * 60 * 1000;

/** "03:30 PM" from HH:MM. */
function clock(v: string): string {
  const m = /^(\d{1,2}):(\d{2})$/.exec(v.trim());
  if (!m) return v;
  const h = Number(m[1]);
  return `${String(((h + 11) % 12) + 1).padStart(2, "0")}:${m[2]} ${h < 12 ? "AM" : "PM"}`;
}

function timeAgo(at: number, now: number): string {
  const mins = Math.max(0, Math.round((now - at) / 60000));
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} hr${hrs === 1 ? "" : "s"} ago`;
  const days = Math.round(hrs / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

/**
 * Top-bar bell: new job applications, today's interviews and applicants'
 * emails to HR. The count shows what arrived since "Mark all as read"; click
 * the bell to see the list. Loads after the page, so a slow mailbox never
 * holds anything up.
 */
export function NotificationBell() {
  const [feed, setFeed] = useState<NotificationFeed | null>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [now, setNow] = useState(0);
  const box = useRef<HTMLDivElement>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setFeed(await loadNotificationsAction());
      setNow(Date.now());
    } catch {
      // keep the last list; the next refresh tries again
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // first load right after the page, then every few minutes
    const first = setTimeout(refresh, 0);
    const timer = setInterval(refresh, REFRESH_MS);
    return () => {
      clearTimeout(first);
      clearInterval(timer);
    };
  }, [refresh]);

  // Close on a click outside the panel or Escape.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (box.current && !box.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  async function markAllRead() {
    if (!feed) return;
    setFeed({ ...feed, unread: 0, items: feed.items.map((n) => ({ ...n, unread: false })) });
    const r = await markNotificationsReadAction().catch(() => ({ ok: false }));
    if (!r.ok) void refresh();
  }

  const unread = feed?.unread ?? 0;

  return (
    <div ref={box} className="relative">
      <button
        type="button"
        onClick={() => {
          const next = !open;
          setOpen(next);
          if (next) void refresh();
        }}
        aria-expanded={open}
        aria-controls="admin-notifications"
        aria-label={unread ? `Notifications, ${unread} new` : "Notifications"}
        className="relative inline-flex h-9 w-9 items-center justify-center rounded-lg border border-uk-line text-uk-muted transition-colors hover:bg-uk-surface-2 hover:text-uk-heading"
      >
        <Bell className="h-4 w-4" />
        {unread > 0 && (
          <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-uk-blue px-1 text-[10px] font-bold text-uk-white">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div
          id="admin-notifications"
          role="dialog"
          aria-label="Notifications"
          className="fixed inset-x-3 top-16 z-40 flex max-h-[75vh] flex-col overflow-hidden rounded-2xl border border-uk-line bg-uk-card shadow-xl sm:absolute sm:inset-x-auto sm:right-0 sm:top-11 sm:w-[24rem]"
        >
          <div className="flex items-center justify-between gap-3 border-b border-uk-line px-4 py-3">
            <p className="flex items-center gap-2 font-heading text-sm font-semibold text-uk-heading">
              Notifications
              {unread > 0 && <span className="rounded-full bg-uk-blue px-2 py-0.5 text-[11px] font-semibold text-uk-white">{unread} new</span>}
              {loading && <Loader2 className="h-3.5 w-3.5 animate-spin text-uk-muted" aria-label="Loading" />}
            </p>
            {unread > 0 && (
              <button
                type="button"
                onClick={markAllRead}
                className="inline-flex items-center gap-1 text-xs font-medium text-uk-blue hover:text-uk-blue-bright"
              >
                <CheckCheck className="h-3.5 w-3.5" /> Mark all as read
              </button>
            )}
          </div>

          <div className="overflow-y-auto">
            {!feed ? (
              <div className="space-y-2 p-4">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="h-12 animate-pulse rounded-lg bg-uk-surface-2" />
                ))}
              </div>
            ) : (
              <>
                {feed.problems.length > 0 && (
                  <p className="m-3 flex items-start gap-2 rounded-lg bg-amber-500/10 px-3 py-2 text-xs text-amber-800 dark:text-amber-300">
                    <CircleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    <span>{feed.problems.join(" ")}</span>
                  </p>
                )}
                {feed.items.length === 0 ? (
                  <p className="px-4 py-8 text-center text-sm text-uk-muted">Nothing new. You're all caught up.</p>
                ) : (
                  <ul className="divide-y divide-uk-line">
                    {feed.items.map((n) => {
                      const Icon = ICONS[n.kind];
                      return (
                        <li key={n.key}>
                          <Link
                            href={n.href}
                            onClick={() => setOpen(false)}
                            className={cn("flex items-start gap-3 px-4 py-3 transition-colors hover:bg-uk-surface-2", n.unread && "bg-uk-blue/5")}
                          >
                            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-uk-surface-blue text-uk-blue">
                              <Icon className="h-4 w-4" />
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block text-[11px] font-semibold uppercase tracking-wide text-uk-muted">{LABELS[n.kind]}</span>
                              <span className="block truncate text-sm font-semibold text-uk-heading">{n.title}</span>
                              {n.detail && <span className="block truncate text-xs text-uk-muted">{n.detail}</span>}
                            </span>
                            <span className="flex shrink-0 items-center gap-2 text-[11px] text-uk-muted">
                              {n.kind === "interview" ? (n.time ? clock(n.time) : "Today") : timeAgo(n.at, now)}
                              {n.unread && <span className="h-2 w-2 rounded-full bg-uk-blue" aria-label="New" />}
                            </span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}
                {!feed.mailbox && (
                  <p className="border-t border-uk-line px-4 py-3 text-xs text-uk-muted">
                    Applicants' emails to HR appear here once the HR email (SMTP) is set up in Site settings.
                  </p>
                )}
              </>
            )}
          </div>

          <div className="flex items-center justify-between border-t border-uk-line px-4 py-2.5 text-xs">
            <Link href="/admin/todays-applications" onClick={() => setOpen(false)} className="font-medium text-uk-blue hover:text-uk-blue-bright">
              Today's applications
            </Link>
            <Link href="/admin/interviews" onClick={() => setOpen(false)} className="font-medium text-uk-blue hover:text-uk-blue-bright">
              Interviews
            </Link>
            <Link href="/admin/email-logs" onClick={() => setOpen(false)} className="font-medium text-uk-blue hover:text-uk-blue-bright">
              Email logs
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
