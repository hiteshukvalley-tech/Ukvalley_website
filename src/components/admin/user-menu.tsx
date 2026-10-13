"use client";

import { useEffect, useRef, useState } from "react";
import Link from "@/components/site/intent-link";
import { usePathname } from "next/navigation";
import { ChevronDown, LogOut, UserCog, UserRound } from "lucide-react";
import { logoutAction } from "@/app/admin/actions";
import { cn } from "@/lib/utils";

const item = "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-uk-body transition-colors hover:bg-uk-surface-2 hover:text-uk-heading";

/** Top-bar account button: the user's name opens a menu with My profile, Settings and Sign out. */
export function UserMenu({
  name, email, photo, badge,
}: {
  name?: string;
  email: string;
  photo?: string;
  /** job title or role, e.g. "HR" or "Admin" */
  badge: string;
}) {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  // Close after navigating, on a click outside, or on Escape.
  const [seenPath, setSeenPath] = useState(pathname);
  if (pathname !== seenPath) {
    setSeenPath(pathname);
    setOpen(false);
  }
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (box.current && !box.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const avatar = (size: string) =>
    photo ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={photo} alt="" className={cn(size, "shrink-0 rounded-full object-cover")} />
    ) : (
      <span className={cn(size, "flex shrink-0 items-center justify-center rounded-full bg-uk-surface-blue text-uk-blue")}>
        <UserRound className="h-4 w-4" />
      </span>
    );

  return (
    <div ref={box} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls="admin-user-menu"
        title={email}
        className="inline-flex h-9 max-w-64 items-center gap-2 rounded-lg px-1.5 text-sm font-medium text-uk-muted transition-colors hover:bg-uk-surface-2 hover:text-uk-heading md:px-2"
      >
        {avatar("h-7 w-7")}
        <span className="hidden truncate md:inline">{name || email}</span>
        <span className="hidden shrink-0 whitespace-nowrap rounded-full bg-uk-surface-3 px-2 py-0.5 text-[10px] font-semibold text-uk-muted lg:inline">{badge}</span>
        <ChevronDown className={cn("hidden h-3.5 w-3.5 shrink-0 transition-transform md:block", open && "rotate-180")} />
      </button>

      {open && (
        <div
          id="admin-user-menu"
          role="menu"
          aria-label="Your account"
          className="absolute right-0 top-11 z-40 w-64 rounded-2xl border border-uk-line bg-uk-card p-2 shadow-xl"
        >
          <div className="flex items-center gap-3 border-b border-uk-line px-2 pb-3 pt-1">
            {avatar("h-10 w-10")}
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-uk-heading">{name || "Add your name"}</p>
              <p className="truncate text-xs text-uk-muted">{email}</p>
            </div>
          </div>
          <div className="pt-2">
            <Link href="/admin/profile" role="menuitem" onClick={() => setOpen(false)} className={item}>
              <UserRound className="h-4 w-4 text-uk-blue" /> My profile
            </Link>
            <Link href="/admin/account" role="menuitem" onClick={() => setOpen(false)} className={item}>
              <UserCog className="h-4 w-4 text-uk-blue" /> Settings
            </Link>
            <form action={logoutAction}>
              <button type="submit" role="menuitem" className={item}>
                <LogOut className="h-4 w-4 text-uk-blue" /> Sign out
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
