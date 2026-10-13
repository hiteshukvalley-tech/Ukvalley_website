"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import Link from "@/components/site/intent-link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CircleAlert, ExternalLink, Loader2, MessagesSquare, RefreshCw, Send, X } from "lucide-react";
import { toast } from "@/components/admin/toast";
import { cn } from "@/lib/utils";
import { loadChatAction, sendChatAction, type Chat } from "./chat-actions";

/** The address parameter that opens the chat (also used by the notification bell). */
const PARAM = "chat";
/** Checks for new messages this often while the chat is open. */
const REFRESH_MS = 60 * 1000;

const when = (ms: number) =>
  new Date(ms).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata" });

/** "Chat" button in the Email logs table: opens the conversation with this applicant. */
export function ChatButton({ email, name }: { email: string; name: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  if (!email) return null;
  return (
    <button
      type="button"
      onClick={() => {
        const p = new URLSearchParams(params.toString());
        p.set(PARAM, email);
        router.push(`${pathname}?${p.toString()}`, { scroll: false });
      }}
      title={`Chat with ${name || email}`}
      aria-label={`Chat with ${name || email}`}
      className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-uk-line px-2.5 text-xs font-medium text-uk-body transition-colors hover:border-uk-blue/50 hover:bg-uk-surface-blue hover:text-uk-blue"
    >
      <MessagesSquare className="h-3.5 w-3.5" /> Chat
    </button>
  );
}

/**
 * The conversation with one applicant, opened from the Chat column (or a
 * notification): every email HR sent them and every email they sent HR,
 * oldest first, with a box to send a new message. Lives in the address
 * (?chat=<email>), so a link opens it straight away.
 */
export function ChatPanel() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const email = params.get(PARAM)?.trim() ?? "";

  const [chat, setChat] = useState<Chat | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [draft, setDraft] = useState("");
  const [sending, startSend] = useTransition();
  const list = useRef<HTMLDivElement>(null);

  const close = useCallback(() => {
    const p = new URLSearchParams(params.toString());
    p.delete(PARAM);
    const qs = p.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [params, pathname, router]);

  const load = useCallback(async (address: string) => {
    setLoading(true);
    try {
      const r = await loadChatAction(address);
      if ("error" in r) {
        setError(r.error);
        setChat(null);
      } else {
        setError("");
        setChat(r);
      }
    } catch {
      setError("Could not load the conversation. Try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Load when opened (or another applicant is picked), then check again every minute.
  useEffect(() => {
    if (!email) return;
    const first = setTimeout(() => {
      setChat(null);
      setDraft("");
      void load(email);
    }, 0);
    const timer = setInterval(() => void load(email), REFRESH_MS);
    return () => {
      clearTimeout(first);
      clearInterval(timer);
    };
  }, [email, load]);

  // Newest message in view.
  const count = chat?.messages.length ?? 0;
  useEffect(() => {
    if (list.current) list.current.scrollTop = list.current.scrollHeight;
  }, [count]);

  // Escape closes.
  useEffect(() => {
    if (!email) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [email, close]);

  if (!email) return null;

  const send = () => {
    const text = draft.trim();
    if (!text || sending) return;
    startSend(async () => {
      const r = await sendChatAction(email, text);
      if (r.ok) {
        toast.success(r.message);
        setDraft("");
        await load(email);
      } else {
        toast.error(r.message);
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50">
      <button type="button" aria-label="Close chat" onClick={close} className="absolute inset-0 bg-black/40" />
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="chat-title"
        className="absolute inset-y-0 right-0 flex w-full flex-col border-l border-uk-line bg-uk-card shadow-2xl sm:w-[32rem]"
      >
        {/* Who */}
        <header className="flex items-start gap-3 border-b border-uk-line px-5 py-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-uk-surface-blue font-heading text-base font-bold text-uk-blue">
            {(chat?.name || email).charAt(0).toUpperCase()}
          </span>
          <div className="min-w-0 flex-1">
            <h2 id="chat-title" className="truncate font-heading text-base font-semibold text-uk-heading">{chat?.name || email}</h2>
            <p className="truncate text-xs text-uk-muted">
              {email}
              {chat?.position ? ` · ${chat.position}` : ""}
            </p>
            {chat?.applicationId && (
              <Link href={`/admin/applications/${chat.applicationId}`} className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-uk-blue hover:text-uk-blue-bright">
                Open application <ExternalLink className="h-3 w-3" />
              </Link>
            )}
          </div>
          <button
            type="button"
            onClick={() => void load(email)}
            disabled={loading}
            aria-label="Check for new messages"
            title="Check for new messages"
            className="rounded-lg p-1.5 text-uk-muted hover:bg-uk-surface-2 hover:text-uk-heading disabled:opacity-60"
          >
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          </button>
          <button type="button" onClick={close} aria-label="Close chat" className="rounded-lg p-1.5 text-uk-muted hover:bg-uk-surface-2 hover:text-uk-heading">
            <X className="h-5 w-5" />
          </button>
        </header>

        {/* Messages */}
        <div ref={list} className="dash-scroll min-h-0 flex-1 space-y-4 bg-uk-surface px-4 py-5" aria-live="polite">
          {error && (
            <p className="flex items-start gap-2 rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-700 dark:text-red-300">
              <CircleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {error}
            </p>
          )}
          {chat?.problems.length ? (
            <p className="flex items-start gap-2 rounded-lg bg-amber-500/10 px-3 py-2 text-xs text-amber-800 dark:text-amber-300">
              <CircleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {chat.problems.join(" ")}
            </p>
          ) : null}
          {chat && !chat.mailbox && (
            <p className="rounded-lg bg-uk-surface-2 px-3 py-2 text-xs text-uk-muted">
              The applicant's emails to HR appear here once the HR email (SMTP) is set up in Site settings.
            </p>
          )}
          {!chat && !error && (
            <div className="flex items-center justify-center gap-2 py-16 text-sm text-uk-muted">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading the conversation…
            </div>
          )}
          {chat && chat.messages.length === 0 && (
            <p className="py-16 text-center text-sm text-uk-muted">No messages with {chat.name} yet. Write the first one below.</p>
          )}
          {chat?.messages.map((m) => {
            const hr = m.side === "hr";
            return (
              <div key={m.id} className={cn("flex", hr ? "justify-end" : "justify-start")}>
                <div
                  className={cn(
                    "max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm",
                    hr ? "rounded-br-md bg-uk-blue text-uk-white" : "rounded-bl-md border border-uk-line bg-uk-card text-uk-body",
                    m.failed && "bg-red-600"
                  )}
                >
                  {m.subject && <p className={cn("mb-1 text-xs font-semibold", hr ? "text-white/85" : "text-uk-heading")}>{m.subject}</p>}
                  {m.text ? (
                    <p className="whitespace-pre-line break-words leading-relaxed">{m.text}</p>
                  ) : (
                    <p className={cn("italic", hr ? "text-white/75" : "text-uk-muted")}>(no text saved for this email)</p>
                  )}
                  <p className={cn("mt-2 text-[11px]", hr ? "text-white/75" : "text-uk-muted")}>
                    {hr ? `${m.by} · ${m.label}` : m.by} · {when(m.at)}
                  </p>
                  {m.failed && <p className="mt-1 text-[11px] font-semibold text-white">Not sent: {m.failed}</p>}
                </div>
              </div>
            );
          })}
        </div>

        {/* New message */}
        <form
          className="border-t border-uk-line p-4"
          onSubmit={(e) => {
            e.preventDefault();
            send();
          }}
        >
          <label htmlFor="chat-message" className="sr-only">Message to {chat?.name || email}</label>
          <textarea
            id="chat-message"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                send();
              }
            }}
            rows={3}
            maxLength={5000}
            disabled={!chat?.canSend || sending}
            placeholder={chat && !chat.canSend ? "Email is not set up, so messages can't be sent." : `Write to ${chat?.name || email}…`}
            className="w-full resize-none rounded-xl border border-input bg-uk-card px-3 py-2 text-sm text-uk-heading outline-none placeholder:text-uk-muted focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-60"
          />
          <div className="mt-2 flex items-center justify-between gap-3">
            <p className="text-[11px] text-uk-muted">Sent as an email from Ukvalley HR Team. Ctrl + Enter to send.</p>
            <button
              type="submit"
              disabled={!draft.trim() || !chat?.canSend || sending}
              className="inline-flex h-9 items-center gap-2 rounded-lg bg-uk-blue px-4 text-sm font-semibold text-uk-white transition-colors hover:bg-uk-blue-bright disabled:opacity-60"
            >
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {sending ? "Sending…" : "Send"}
            </button>
          </div>
        </form>
      </aside>
    </div>
  );
}
