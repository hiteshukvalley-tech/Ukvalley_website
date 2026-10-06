"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { Dialog } from "@base-ui/react/dialog";
import { X, Phone, Clock, ShieldCheck, CalendarCheck, ChevronDown } from "lucide-react";
import { ContactForm } from "./contact-form";
import { company } from "@/lib/site-core";
import { T, Tx } from "@/components/site/texts-context";

/**
 * Site-wide "Book a scoping call" popup. Any scoping-call button on the site
 * opens this modal, which hosts the same "Tell us about your project" form
 * as the Contact page. The header CTA intentionally stays a normal link to
 * /contact — only this popup wraps the form elsewhere.
 *
 * Built on Base UI's Dialog so focus moves into the popup, Tab is trapped
 * inside, the page behind is inert, Escape / backdrop click close it and
 * focus returns to the button that opened it.
 */

type ScopingContextValue = { open: (trigger?: HTMLElement | null) => void };

const ScopingContext = createContext<ScopingContextValue>({ open: () => {} });

export function useScoping() {
  return useContext(ScopingContext);
}

/**
 * Opens the scoping-call popup. Rendered as a real link to /contact so a
 * click before hydration (or with JS off) still reaches the form; once
 * hydrated, a plain left-click is intercepted to open the popup instead.
 */
export function ScopingButton({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  const { open } = useScoping();
  return (
    <a
      href="/contact"
      aria-haspopup="dialog"
      onClick={(e) => {
        // Let new-tab / new-window clicks follow the link as normal.
        if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        e.preventDefault();
        open(e.currentTarget);
      }}
      className={`cursor-pointer ${className ?? ""}`}
    >
      {children}
    </a>
  );
}

export function ScopingProvider({
  children,
  email = company.email,
  phone = company.phonePrimary,
}: {
  children: React.ReactNode;
  /** contact details from Admin → Settings (fall back to the built-in ones) */
  email?: string;
  phone?: string;
}) {
  const [isOpen, setOpen] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [progress, setProgress] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const open = useCallback((trigger?: HTMLElement | null) => {
    triggerRef.current = trigger ?? null;
    setProgress(0);
    setOpen(true);
  }, []);

  // Escape, backdrop clicks and the page scroll lock are handled by the
  // modal Dialog (its lock covers <html> too, so iOS Safari stays put).

  // Show the "scroll for more" pill only when the form actually overflows,
  // and hide it once the user reaches the bottom.
  useEffect(() => {
    if (!isOpen) return;
    // Read the ref inside the timeout — the portalled panel mounts a beat
    // after this effect runs.
    const measure = window.setTimeout(() => {
      const el = scrollRef.current;
      if (!el) return;
      el.scrollTop = 0;
      setShowHint(el.scrollHeight > el.clientHeight + 8);
    }, 60);
    return () => window.clearTimeout(measure);
  }, [isOpen]);

  const onPanelScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    // Scroll-progress line fill (0 → 1)
    const max = el.scrollHeight - el.clientHeight;
    setProgress(max > 0 ? el.scrollTop / max : 0);
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 24) {
      setShowHint(false);
    }
  };

  return (
    <ScopingContext.Provider value={{ open }}>
      {children}
      <Dialog.Root open={isOpen} onOpenChange={setOpen}>
        <Dialog.Portal>
          {/* Backdrop — deep blur; pure black in dark mode (uk-heading
              turns light there, so it can't tint the dim layer) */}
          <Dialog.Backdrop className="scoping-fade fixed inset-0 z-[90] bg-uk-heading/50 backdrop-blur-md dark:bg-[#070511]/70" />
          <Dialog.Viewport className="fixed inset-0 z-[90] flex items-center justify-center overflow-y-auto p-4 sm:p-6">
          <div
            className="scoping-fade fixed left-1/2 top-1/2 h-[36rem] w-[36rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-uk-blue/15 blur-[140px]"
            aria-hidden
          />

          {/* Centered by the container; the container's own padding is the
              only spacing, so top and bottom gaps are always identical.
              Panel max-height matches the padded area exactly, so centering
              never clips the top when the form is full-height. */}
          <Dialog.Popup
            aria-label="Book a free scoping call"
            initialFocus={closeRef}
            // Return focus to the button that opened the popup (fall back
            // to Base UI's default if it has since left the page).
            finalFocus={() => (triggerRef.current?.isConnected ? triggerRef.current : true)}
            className="scoping-pop relative w-full max-w-xl outline-none"
            data-lenis-prevent
          >
            {/* Soft halo behind the panel — glows deeper in dark mode */}
            <div
              className="pointer-events-none absolute -inset-2 rounded-[2rem] bg-gradient-to-br from-uk-yellow/40 via-uk-blue/30 to-uk-blue-bright/40 opacity-90 blur-lg dark:opacity-100"
              aria-hidden
            />
            {/* Animated rotating gradient border — the panel's opaque body
                covers its center, leaving only the rim visible */}
            <div className="scoping-ring pointer-events-none absolute -inset-[2px] rounded-[1.75rem]" aria-hidden />

            {/* Scroll line — OUTSIDE the popup box, riding its right edge
                against the dimmed page, so it never hides or scrolls away */}
            <div
              className="pointer-events-none absolute -right-3 inset-y-8 z-20 w-1.5 rounded-full bg-white/25 shadow-inner backdrop-blur-sm dark:bg-white/10"
              aria-hidden
            >
              <div
                className="w-full rounded-full bg-gradient-to-b from-uk-yellow via-uk-blue to-uk-blue-bright shadow-[0_0_10px_rgba(49,0,255,0.8)]"
                style={{ height: `${Math.max(progress * 100, 4)}%` }}
              />
            </div>

            <div className="relative">
            {/* Close — pinned to the panel, NOT inside the scroll area, so it
                stays visible while the form scrolls underneath */}
            <Dialog.Close
              ref={closeRef}
              className="absolute right-4 top-4 z-20 inline-flex h-9 w-9 items-center justify-center rounded-full border border-uk-line bg-white/90 text-uk-muted shadow-float backdrop-blur transition-all duration-300 hover:rotate-90 hover:border-uk-blue/50 hover:text-uk-blue dark:bg-uk-card/90 dark:hover:border-uk-blue-bright"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </Dialog.Close>
            {/* The panel itself scrolls — Lenis hijacks wheel events on the
                page, so data-lenis-prevent hands native scrolling back to
                this container and overscroll-contain stops it leaking. */}
            <div
              ref={scrollRef}
              onScroll={onPanelScroll}
              className="scoping-scroll max-h-[calc(100dvh-2rem)] overflow-y-auto overscroll-contain rounded-3xl border border-uk-line bg-uk-surface shadow-premium-lg sm:max-h-[calc(100dvh-3rem)]"
            >
              {/* Animated brand accent — yellow → blue shimmer sweep */}
              <div className="relative h-1.5 w-full overflow-hidden" aria-hidden>
                <div className="absolute inset-0 bg-gradient-to-r from-uk-yellow via-uk-blue to-uk-blue-bright" />
                <div className="scoping-sheen absolute inset-y-0 w-1/2 bg-gradient-to-r from-transparent via-white/60 to-transparent" />
              </div>

              {/* ── Header: ice-blue engineering canvas ── */}
              <div className="relative overflow-hidden bg-uk-surface-blue px-5 pb-6 pt-6 sm:px-8 sm:pb-7 sm:pt-8">
                <div className="bg-aurora absolute inset-0 opacity-30" aria-hidden />
                <div className="absolute inset-0 bg-blueprint bg-grid-fade opacity-60" aria-hidden />
                <div className="radar-sweep absolute -inset-16 opacity-15" aria-hidden />
                <div className="absolute -left-16 -top-16 h-44 w-44 rounded-full bg-uk-blue/20 blur-[70px] dark:bg-uk-blue/30" aria-hidden />
                <div className="absolute -bottom-20 -right-14 h-44 w-44 rounded-full bg-uk-yellow/20 blur-[70px] dark:bg-uk-yellow/25" aria-hidden />
                {/* register marks */}
                <span className="absolute left-4 top-4 select-none font-heading text-sm font-bold text-uk-blue/25" aria-hidden>+</span>
                <span className="absolute bottom-3 right-24 select-none font-heading text-sm font-bold text-uk-blue/25" aria-hidden>+</span>

                <div className="relative flex flex-col gap-3 pr-12">
                  <span className="glass inline-flex w-fit items-center gap-2 rounded-full border border-uk-blue/25 px-3.5 py-1.5 text-[0.65rem] font-bold uppercase tracking-[0.2em] text-uk-blue shadow-float">
                    <span className="relative flex h-2 w-2" aria-hidden>
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-uk-blue/40" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-uk-blue" />
                    </span>
                    <T>Free · 30 minutes · No obligation</T>
                  </span>
                  <h3 className="font-heading text-2xl font-bold leading-tight text-uk-heading">
                    <T>Book a scoping call with a</T>{" "}
                    <span className="text-gradient-blue"><T>software architect</T></span> <T>— not a
                    sales bot.</T>
                  </h3>
                  <p className="text-sm leading-relaxed text-uk-muted">
                    <T>Tell us about your project below. A reply within</T>{" "}
                    <span className="font-semibold text-uk-heading"><T>one business day</T></span><T>,
                    a rough estimate in 3 days, a fixed proposal in 7.</T>
                  </p>

                  {/* Quick proof chips */}
                  <div className="mt-1 flex flex-wrap gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-uk-line bg-white/80 px-3 py-1 text-xs font-medium text-uk-heading shadow-float backdrop-blur dark:bg-uk-card/80">
                      <Clock className="h-3.5 w-3.5 text-uk-blue" aria-hidden />
                      <T>Reply within 1 business day</T>
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-uk-line bg-white/80 px-3 py-1 text-xs font-medium text-uk-heading shadow-float backdrop-blur dark:bg-uk-card/80">
                      <ShieldCheck className="h-3.5 w-3.5 text-uk-blue" aria-hidden />
                      <T>NDA &amp; IP before day one</T>
                    </span>
                    <span className="hidden items-center gap-1.5 rounded-full border border-uk-line bg-white/80 px-3 py-1 text-xs font-medium text-uk-heading shadow-float backdrop-blur dark:bg-uk-card/80 sm:inline-flex">
                      <CalendarCheck className="h-3.5 w-3.5 text-uk-blue" aria-hidden />
                      <T>Estimate in 3 days</T>
                    </span>
                  </div>
                </div>

                {/* Wave divider — blends the header canvas into the form */}
                <svg
                  className="absolute bottom-0 left-0 h-5 w-full text-uk-surface"
                  viewBox="0 0 400 20"
                  preserveAspectRatio="none"
                  aria-hidden
                >
                  <path d="M0 20 V11 C90 3 310 3 400 11 V20 Z" fill="currentColor" />
                </svg>
              </div>

              {/* ── Form body ── */}
              <div className="relative p-5 pt-6 sm:p-8 sm:pt-7">
                <ContactForm source="scoping-popup" email={email} phone={phone} />
              </div>

              {/* ── Footer: prefer to talk first ── */}
              <div className="flex items-center justify-center gap-2 border-t border-uk-line bg-uk-surface-2 px-5 py-4 text-sm text-uk-muted">
                <Phone className="h-3.5 w-3.5 text-uk-blue" aria-hidden />
                <span>
                  <T>Prefer to talk first? Call</T>{" "}
                  <a
                    href={`tel:${phone.replace(/\s+/g, "")}`}
                    className="font-semibold text-uk-blue transition-colors hover:text-uk-blue-bright"
                  >
                    <Tx>{phone}</Tx>
                  </a>
                </span>
              </div>
            </div>

            {/* "Scroll for more" pill — sits over the panel's bottom edge
                until the user reaches the end of the form */}
            {showHint && (
              <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex justify-center" aria-hidden>
                <span className="glass mb-3 inline-flex animate-bounce items-center gap-1.5 rounded-full border border-uk-blue/30 bg-white/85 px-4 py-1.5 text-[0.65rem] font-bold uppercase tracking-[0.18em] text-uk-blue shadow-float backdrop-blur dark:border-uk-blue/40 dark:bg-uk-card/85">
                  <T>Scroll for more</T>
                  <ChevronDown className="h-3.5 w-3.5" />
                </span>
              </div>
            )}
            </div>
          </Dialog.Popup>
          </Dialog.Viewport>
        </Dialog.Portal>
      </Dialog.Root>
    </ScopingContext.Provider>
  );
}