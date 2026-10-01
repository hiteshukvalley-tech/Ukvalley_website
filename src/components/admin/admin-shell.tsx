"use client";

import { useState } from "react";
import Link from "@/components/site/intent-link";
import { usePathname } from "next/navigation";
import { LogOut, Menu, X, ExternalLink, UserRound } from "lucide-react";
import { ThemeToggle } from "@/components/site/theme-toggle";
import { logoutAction } from "@/app/admin/actions";
import { adminNav } from "./nav";
import type { AdminRole } from "@/lib/admin-auth";
import { cn } from "@/lib/utils";

function Brand() {
  return (
    <Link href="/admin" className="flex items-center gap-3">
      <span className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-uk-blue to-uk-blue-bright shadow-glow-blue-sm">
        <span className="font-heading text-lg font-bold text-uk-white">U</span>
        <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-uk-yellow" />
      </span>
      <span className="flex flex-col leading-tight">
        <span className="font-heading text-sm font-bold uppercase tracking-[0.22em] text-uk-heading">
          Ukvalley
        </span>
        <span className="text-[11px] font-medium text-uk-muted">Admin panel</span>
      </span>
    </Link>
  );
}

function NavList({ role, onNavigate }: { role: AdminRole; onNavigate?: () => void }) {
  const pathname = usePathname();
  // Editors never see admin-only pages (the pages themselves refuse them too).
  const groups = adminNav
    .map((g) => ({ ...g, items: g.items.filter((i) => !i.adminOnly || role === "admin") }))
    .filter((g) => g.items.length > 0);
  return (
    <nav aria-label="Admin" className="flex-1 space-y-6 overflow-y-auto px-3 py-4">
      {groups.map((g) => (
        <div key={g.group}>
          <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-uk-muted">
            {g.group}
          </p>
          <ul className="space-y-0.5">
            {g.items.map((item) => {
              const active =
                item.href === "/admin"
                  ? pathname === "/admin"
                  : pathname.startsWith(item.href);
              const Icon = item.icon;
              const base =
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors";
              if (!item.ready) {
                return (
                  <li key={item.href}>
                    <span
                      aria-disabled
                      className={cn(base, "cursor-not-allowed text-uk-muted/60")}
                    >
                      <Icon className="h-4 w-4" />
                      <span className="flex-1">{item.label}</span>
                      <span className="rounded-full bg-uk-surface-3 px-2 py-0.5 text-[10px] font-semibold text-uk-muted">
                        Soon
                      </span>
                    </span>
                  </li>
                );
              }
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      base,
                      active
                        ? "bg-uk-blue text-uk-white shadow-glow-blue-sm"
                        : "text-uk-body hover:bg-uk-surface-2 hover:text-uk-heading"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

export function AdminShell({
  children,
  user,
}: {
  children: React.ReactNode;
  user: { email: string; role: AdminRole };
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-uk-surface text-uk-body">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-uk-line bg-uk-card lg:flex">
        <div className="border-b border-uk-line px-5 py-4">
          <Brand />
        </div>
        <NavList role={user.role} />
      </aside>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            aria-label="Close menu"
            className="absolute inset-0 bg-black/50"
            onClick={() => setOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col border-r border-uk-line bg-uk-card">
            <div className="flex items-center justify-between border-b border-uk-line px-5 py-4">
              <Brand />
              <button
                aria-label="Close menu"
                onClick={() => setOpen(false)}
                className="rounded-lg p-1.5 text-uk-muted hover:bg-uk-surface-2"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <NavList role={user.role} onNavigate={() => setOpen(false)} />
          </aside>
        </div>
      )}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-uk-line bg-uk-card/90 px-4 backdrop-blur sm:px-6">
          <button
            aria-label="Open menu"
            onClick={() => setOpen(true)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-uk-line text-uk-muted hover:bg-uk-surface-2 lg:hidden"
          >
            <Menu className="h-4 w-4" />
          </button>
          <div className="flex-1" />
          <Link
            href="/"
            target="_blank"
            className="hidden items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-uk-muted hover:bg-uk-surface-2 hover:text-uk-heading sm:inline-flex"
          >
            View site <ExternalLink className="h-3.5 w-3.5" />
          </Link>
          <ThemeToggle />
          <Link
            href="/admin/account"
            title="Your account"
            className="hidden h-9 max-w-56 items-center gap-2 rounded-lg px-3 text-sm font-medium text-uk-muted transition-colors hover:bg-uk-surface-2 hover:text-uk-heading md:inline-flex"
          >
            <UserRound className="h-4 w-4 shrink-0" />
            <span className="truncate">{user.email}</span>
            <span className="rounded-full bg-uk-surface-3 px-2 py-0.5 text-[10px] font-semibold capitalize text-uk-muted">{user.role}</span>
          </Link>
          <form action={logoutAction}>
            <button
              type="submit"
              className="inline-flex h-9 items-center gap-2 rounded-lg border border-uk-line px-3 text-sm font-medium text-uk-body transition-colors hover:bg-uk-surface-2 hover:text-uk-heading"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </form>
        </header>
        <main id="main" className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
          {children}
        </main>
      </div>
    </div>
  );
}
