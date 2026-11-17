"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { GTM_ID, captureAttribution, isTrackedPath, trackPageView } from "@/lib/analytics";

/** GTM's no-JavaScript fallback, first thing in <body>. Not on /admin. */
export function GtmNoscript() {
  const pathname = usePathname();
  if (!GTM_ID || !isTrackedPath(pathname ?? "")) return null;
  return (
    <noscript>
      <iframe
        src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
        height="0"
        width="0"
        style={{ display: "none", visibility: "hidden" }}
      />
    </noscript>
  );
}

/** Stores the attribution cookie once, then pushes a page_view on every route change. */
export function GtmTracker() {
  const pathname = usePathname();
  const captured = useRef(false);
  const lastPath = useRef<string | null>(null);

  useEffect(() => {
    if (!GTM_ID || !pathname || !isTrackedPath(pathname)) return;
    if (!captured.current) {
      captured.current = true;
      captureAttribution();
    }
    // Strict mode runs effects twice in development: one page_view per path.
    if (lastPath.current === pathname) return;
    lastPath.current = pathname;
    // Wait a tick so document.title is the new page's title.
    const t = window.setTimeout(trackPageView, 0);
    return () => window.clearTimeout(t);
  }, [pathname]);

  return null;
}
