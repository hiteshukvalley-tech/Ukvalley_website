"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { X, Phone, Clock, ShieldCheck, CalendarCheck, ChevronDown } from "lucide-react";
import { ContactForm } from "./contact-form";
import { company } from "@/lib/site-core";
import { T, Tx } from "@/components/site/texts-context";

/**
 * Site-wide "Book a scoping call" popup. Any scoping-call button on the site
 * opens this modal, which hosts the same "Tell us about your project" form
 * as the Contact page. The header CTA intentionally stays a normal link to
 * /contact — only this popup wraps the form elsewhere.
 */

type ScopingContextValue = { open: () => void };

const ScopingContext = createContext<ScopingContextValue>({ open: () => {} });

export function useScoping() {
  return useContext(ScopingContext);
}

/** Button that opens the scoping-call popup (drops in for a /contact Link). */
export function ScopingButton({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  const { open } = useScoping();
  return (
    <button type="button" onClick={open} className={`cursor-pointer ${className ?? ""}`}>
      {children}
    </button>
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
  const open = useCallback(() => setOpen(true), []);
  const close = useCallback(() => setOpen(false), []);

  // Escape closes the popup; lock page scroll behind it.
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    // Lock <html> as well as <body>: iOS Safari ignores overflow on body
    // alone, so the page kept scrolling behind the popup on iPhones.
    const html = document.documentElement;
    const prevBody = document.body.style.overflow;
    const prevHtml = html.style.overflow;
    document.body.style.overflow = "hidden";
    html.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevBody;
      html.style.overflow = prevHtml;
    };
  }, [isOpen]);

  // Show the "scroll for more" pill only when the form actually overflows,
  // and hide it once the user reaches the bottom.
  useEffect(() => {
    if (!isOpen) return;
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = 0;
    const measure = window.setTimeout(() => {
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
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Book a free scoping call"
          className="fixed inset-0 z-[90] flex items-center justify-center overflow-y-auto p-4 sm:p-6"
        >
          {/* Backdrop — deep blur; pure black in dark mode (uk-heading
              turns light there, so it can't tint the dim layer) */}
          <div
            className="scoping-fade fixed inset-0 bg-uk-heading/50 backdrop-blur-md dark:bg-[#070511]/70"
            onClick={close}
            aria-hidden
          />
          <div
            className="scoping-fade fixed left-1/2 top-1/2 h-[36rem] w-[36rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-uk-blue/15 blur-[140px]"
            onClick={close}
            aria-hidden
          />

          {/* Centered by the container; the container's own padding is the
              only spacing, so top and bottom gaps are always identical.
              Panel max-height matches the padded area exactly, so centering
              never clips the top when the form is full-height. */}
          <div className="scoping-pop relative w-full max-w-xl" data-lenis-prevent>
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
            <button
              type="button"
              onClick={close}
              className="absolute right-4 top-4 z-20 inline-flex h-9 w-9 items-center justify-center rounded-full border border-uk-line bg-white/90 text-uk-muted shadow-float backdrop-blur transition-all duration-300 hover:rotate-90 hover:border-uk-blue/50 hover:text-uk-blue dark:bg-uk-card/90 dark:hover:border-uk-blue-bright"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
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
                    Book a scoping call with a{" "}
                    <span className="text-gradient-blue"><T>software architect</T></span> <T>— not a
                    sales bot.</T>
                  </h3>
                  <p className="text-sm leading-relaxed text-uk-muted">
                    Tell us about your project below. A reply within{" "}
                    <span className="font-semibold text-uk-heading"><T>1 business hour</T></span><T>,
                    a rough estimate in 3 days, a fixed proposal in 7.</T>
                  </p>

                  {/* Quick proof chips */}
                  <div className="mt-1 flex flex-wrap gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-uk-line bg-white/80 px-3 py-1 text-xs font-medium text-uk-heading shadow-float backdrop-blur dark:bg-uk-card/80">
                      <Clock className="h-3.5 w-3.5 text-uk-blue" aria-hidden />
                      <T>Reply in 1 business hour</T>
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
                  Prefer to talk first? Call{" "}
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
          </div>
        </div>
      )}
    </ScopingContext.Provider>
  );
}