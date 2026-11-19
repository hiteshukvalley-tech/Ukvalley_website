"use client";

import { Suspense, useEffect, useSyncExternalStore } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";

// "Back" at the top of every admin / HR panel page (rendered by AdminShell;
// /hr/<page> redirects to /admin/<page>, so both panels share it).
//
// Opens the previous panel page you were on, with the filters, search and
// page number it had (e.g. an edit page → the list on page 2, filtered).
// Changing a filter or page on the same screen is not a new "page", so Back
// never just undoes a filter. The trail is kept per browser tab and survives a
// reload. With no panel page before this one (opened from a link or an email),
// it goes up one level instead (/admin/services/web → /admin/services), so it
// never leaves the panel.

type Entry = { path: string; url: string };

const STORAGE_KEY = "uk-admin-back-trail";
const MAX_ENTRIES = 50;

let trail: Entry[] | null = null;
const listeners = new Set<() => void>();

const isPanelUrl = (v: unknown): v is string => typeof v === "string" && /^\/admin(?:[/?]|$)/.test(v);

function load(): Entry[] {
  if (trail) return trail;
  trail = [];
  try {
    const parsed: unknown = JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? "[]");
    if (Array.isArray(parsed)) {
      trail = parsed
        .filter((e): e is Entry => !!e && isPanelUrl(e.path) && isPanelUrl(e.url))
        .slice(-MAX_ENTRIES);
    }
  } catch {
    // Storage blocked or corrupt: start a fresh trail.
  }
  return trail;
}

function save(next: Entry[]) {
  trail = next;
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Storage blocked: the trail still works until the next reload.
  }
  listeners.forEach((l) => l());
}

function record(path: string, url: string) {
  const t = load();
  const top = t[t.length - 1];
  if (top?.path === path) {
    // Same screen, new filters / page number: remember the latest URL.
    if (top.url !== url) save([...t.slice(0, -1), { path, url }]);
  } else if (t[t.length - 2]?.path === path) {
    // Back to the page before (this button, the browser's Back, or e.g. a save
    // that returns to the list): drop the page we left.
    save([...t.slice(0, -2), { path, url }]);
  } else {
    save([...t, { path, url }].slice(-MAX_ENTRIES));
  }
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
};
const hasPreviousNow = () => load().length > 1;
const hasPreviousOnServer = () => false;

// --- the page one level up ------------------------------------------------------

/** Folders that only group pages and have no page of their own. */
const NO_PAGE = new Set(["/admin/site"]);

/** /admin/a/b → /admin/a, skipping folders without a page; never above /admin. */
function parentOf(path: string): string {
  const parts = path.replace(/\/+$/, "").split("/").filter(Boolean);
  while (parts.length > 1) {
    parts.pop();
    const up = "/" + parts.join("/");
    if (!NO_PAGE.has(up)) return up;
  }
  return "/admin";
}

function BackButtonInner() {
  const pathname = usePathname();
  const search = useSearchParams().toString();
  const router = useRouter();
  const hasPrevious = useSyncExternalStore(subscribe, hasPreviousNow, hasPreviousOnServer);

  useEffect(() => {
    record(pathname, search ? `${pathname}?${search}` : pathname);
  }, [pathname, search]);

  // The dashboard is the top: only show Back there when you came from another panel page.
  if (pathname === "/admin" && !hasPrevious) return null;

  const goBack = () => {
    const t = load();
    const previous = t[t.length - 1]?.path === pathname ? t[t.length - 2] : undefined;
    // record() sees the previous page come back and drops the current one.
    router.push(previous ? previous.url : parentOf(pathname));
  };

  return (
    <button
      type="button"
      onClick={goBack}
      className="mb-4 inline-flex items-center gap-1.5 rounded-lg border border-uk-line bg-uk-card px-3 py-1.5 text-sm font-medium text-uk-muted transition-colors hover:bg-uk-surface-2 hover:text-uk-heading focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-uk-blue"
      aria-label={hasPrevious ? "Go back to the previous page" : "Go back one level"}
    >
      <ArrowLeft className="h-4 w-4" aria-hidden />
      Back
    </button>
  );
}

/** useSearchParams needs a Suspense boundary in Next 16. */
export function BackButton() {
  return (
    <Suspense fallback={null}>
      <BackButtonInner />
    </Suspense>
  );
}
