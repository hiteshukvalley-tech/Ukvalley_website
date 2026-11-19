"use client";

import { usePathname } from "next/navigation";

/** Renders its children on the public site only — never inside /admin or the candidate's /interview page. */
export function SiteOnly({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname?.startsWith("/admin") || pathname?.startsWith("/interview/")) return null;
  return <>{children}</>;
}
