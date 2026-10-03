"use client";

import { useState } from "react";
import Link from "@/components/site/intent-link";
import { usePathname } from "next/navigation";
import { ChevronDown, LogOut, Menu, X, ExternalLink, UserRound } from "lucide-react";
import { ThemeToggle } from "@/components/site/theme-toggle";
import { logoutAction } from "@/app/admin/actions";
import { GlobalSearch } from "./global-search";
import { adminNav, isActive, type AdminNavEntry, type AdminNavLink } from "./nav";
import { Toaster } from "./toast";
import { ConfirmHost } from "./confirm-dialog";
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

const linkBase = "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors";
const linkActive = "bg-uk-blue text-uk-white shadow-glow-blue-sm";
const linkIdle = "text-uk-body hover:bg-uk-surface-2 hover:text-uk-heading";

/** A main section that opens into its sub-sections. */
function NavSection({
  entry, pathname, open, onToggle, onNavigate,
}: {
  entry: AdminNavEntry & { children: AdminNavLink[] };
  pathname: string;
  /** whether this section's dropdown is open (only one is, at a time) */
  open: boolean;
  onToggle: () => void;
  onNavigate?: () => void;
}) {
  const holdsActive = entry.children.some((c) => isActive(c, pathname));
  const Icon = entry.icon;
  const listId = `nav-${entry.label.toLowerCase().replace(/\s+/g, "-")}`;
  return (
    <li>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={listId}
        className={cn(linkBase, "w-full", holdsActive ? "text-uk-heading" : linkIdle)}
      >
        <Icon className={cn("h-4 w-4", holdsActive && "text-uk-blue")} />
        <span className="flex-1 text-left">{entry.label}</span>
        <ChevronDown className={cn("h-4 w-4 text-uk-muted transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <ul id={listId} className="mb-1 ml-5 mt-0.5 space-y-0.5 border-l border-uk-line pl-2">
          {entry.children.map((child) => {
            const active = isActive(child, pathname);
            const ChildIcon = child.icon;
            return (
              <li key={child.href + child.label}>
                <Link
                  href={child.href}
                  onClick={onNavigate}
                  aria-current={active ? "page" : undefined}
                  className={cn(linkBase, "py-1.5 text-[13px]", active ? linkActive : linkIdle)}
                >
                  {ChildIcon && <ChildIcon className="h-3.5 w-3.5" />}
                  {child.label}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </li>
  );
}

function NavList({ role, onNavigate }: { role: AdminRole; onNavigate?: () => void }) {
  const pathname = usePathname();
  // Which section's dropdown is open: one at a time. Opening another section,
  // or going to any other tab, closes the previous one.
  const sectionHolding = (path: string) =>
    adminNav.flatMap((g) => g.items).find((i) => i.children?.some((c) => isActive(c, path)))?.label ?? null;
  const [openSection, setOpenSection] = useState<string | null>(() => sectionHolding(pathname));
  const [seenPath, setSeenPath] = useState(pathname);
  if (pathname !== seenPath) {
    // Navigated: show the section the new page belongs to (none for a plain tab).
    setSeenPath(pathname);
    setOpenSection(sectionHolding(pathname));
  }
  // Editors never see admin-only pages (the pages themselves refuse them too).
  const allowed = (l: AdminNavLink) => !l.adminOnly || role === "admin";
  const groups = adminNav
    .map((g) => ({
      ...g,
      items: g.items
        .filter(allowed)
        .map((i) => (i.children ? { ...i, children: i.children.filter(allowed) } : i)),
    }))
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
              if (item.children?.length) {
                return (
                  <NavSection
                    key={item.label}
                    entry={{ ...item, children: item.children }}
                    pathname={pathname}
                    open={openSection === item.label}
                    onToggle={() => setOpenSection(openSection === item.label ? null : item.label)}
                    onNavigate={onNavigate}
                  />
                );
              }
              const active = isActive(item, pathname);
              const Icon = item.icon;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => {
                      setOpenSection(null);
                      onNavigate?.();
                    }}
                    aria-current={active ? "page" : undefined}
                    className={cn(linkBase, active ? linkActive : linkIdle)}
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
          <GlobalSearch />
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
      <Toaster />
      <ConfirmHost />
    </div>
  );
}
