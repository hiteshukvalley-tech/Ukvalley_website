"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { company } from "@/lib/site-core";

/**
 * Site-wide "Book a scoping call" popup. Any scoping-call button on the site
 * opens this modal, which hosts the same "Tell us about your project" form
 * as the Contact page. The header CTA intentionally stays a normal link to
 * /contact — only this popup wraps the form elsewhere.
 *
 * This file is only the light part every page loads (the context and the
 * button). The popup itself lives in scoping-dialog.tsx and is downloaded
 * when a visitor first reaches for a scoping button.
 */

const loadDialog = () => import("./scoping-dialog");
const ScopingDialog = dynamic(() => loadDialog().then((m) => m.ScopingDialog), { ssr: false });

/** Starts downloading the popup ahead of the click (hover, focus, touch). */
const preloadDialog = () => {
  void loadDialog();
};

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
      onPointerEnter={preloadDialog}
      onFocus={preloadDialog}
      onTouchStart={preloadDialog}
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
  // Mounted on the first open and kept afterwards, so later opens are instant.
  const [used, setUsed] = useState(false);
  const triggerRef = useRef<HTMLElement | null>(null);
  const open = useCallback((trigger?: HTMLElement | null) => {
    triggerRef.current = trigger ?? null;
    setUsed(true);
    setOpen(true);
  }, []);

  return (
    <ScopingContext.Provider value={{ open }}>
      {children}
      {used && <ScopingDialog open={isOpen} onOpenChange={setOpen} email={email} phone={phone} triggerRef={triggerRef} />}
    </ScopingContext.Provider>
  );
}
