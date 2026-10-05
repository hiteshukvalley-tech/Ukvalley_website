"use client";

import { createContext, useContext, type ReactNode } from "react";
import { loadClientTexts } from "@/lib/texts";

/*
 * Client components can't read the server's text overrides, so the layout
 * hands them over once (TextsProvider) and <T>…</T> swaps in the admin's
 * replacement for exactly that text. Without an override it renders as-is.
 */
const TextsContext = createContext<Record<string, string>>({});

export function TextsProvider({ map, children }: { map: Record<string, string>; children: ReactNode }) {
  // In the browser, also fill ukText()'s map before the page renders, so client
  // components that call ukText() show the same replacement the server
  // rendered (otherwise the text flips back to the original on hydration).
  loadClientTexts(map);
  return <TextsContext.Provider value={map}>{children}</TextsContext.Provider>;
}

/** A line of text the admin can replace (Admin → Pages & text). */
export function T({ children }: { children: string }) {
  const map = useContext(TextsContext);
  const r = map[children];
  return <>{r === undefined ? children : r}</>;
}

/** The replacement function itself, for text that has to be a plain string (e.g. passed to another component). */
export function useT(): (s: string) => string {
  const map = useContext(TextsContext);
  return (s) => map[s] ?? s;
}

/** Like <T>, for text that comes from data or props: strings can be replaced by the admin; anything else shows as-is. */
export function Tx({ children }: { children?: ReactNode }) {
  const map = useContext(TextsContext);
  if (typeof children !== "string") return <>{children}</>;
  const r = map[children];
  return <>{r === undefined ? children : r}</>;
}
