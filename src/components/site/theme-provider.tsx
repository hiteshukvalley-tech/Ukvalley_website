"use client";

import { usePathname } from "next/navigation";
import { ThemeProvider } from "next-themes";

/*
 * The website and the admin panel each keep their own light / dark choice:
 * the toggle on the website changes only the website, the toggle in the admin
 * panel changes only the admin panel. Each is remembered in its own key (and
 * other open tabs of the same part follow it).
 */
const SITE_KEY = "theme";
const ADMIN_KEY = "uk-admin-theme";

export function ThemeProviderWrapper({ children }: { children: React.ReactNode }) {
  const isAdmin = /^\/admin(?:\/|$)/i.test(usePathname() ?? "");
  const storageKey = isAdmin ? ADMIN_KEY : SITE_KEY;
  return (
    // key: going between the website and the admin panel switches to that part's own choice
    <ThemeProvider key={storageKey} storageKey={storageKey} attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange={false}>
      {children}
    </ThemeProvider>
  );
}
