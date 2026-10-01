"use client";

import { usePathname } from "next/navigation";

/** Renders its children on the public site only — never inside /admin. */
export function SiteOnly({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname?.startsWith("/admin")) return null;
  return <>{children}</>;
}
