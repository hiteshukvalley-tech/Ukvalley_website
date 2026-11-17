"use client";

import { useState } from "react";
import Link from "@/components/site/intent-link";
import { ArrowRight, ChevronDown, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetClose, SheetTitle } from "@/components/ui/sheet";
import type { NavLink } from "@/lib/site-core";
import type { HeaderContent } from "@/lib/site-content-schema";
import { cn } from "@/lib/utils";
import { Tx } from "./texts-context";
import type { ResolvedMenu } from "./header-client";

/**
 * The hamburger menu's slide-in panel (phones, tablets, and anything below
 * xl). Split out of header-client.tsx and downloaded on demand: the dialog
 * library behind <Sheet> was in every page's first-load JavaScript, though
 * most visitors never open the menu.
 */
export function MobileMenu({
  open,
  onOpenChange,
  menus,
  icons,
  menuIcon,
  content: c,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  menus: ResolvedMenu[];
  icons: Record<string, React.ReactNode>;
  /** the icon beside a top-level entry */
  menuIcon: (m: ResolvedMenu) => React.ReactNode;
  content: HeaderContent;
}) {
  const close = () => onOpenChange(false);
  return (
    // modal="trap-focus": keyboard focus stays inside the menu (for
    // accessibility) but the page is NOT scroll-locked, so the site
    // stays scrollable while the hamburger menu is open.
    <Sheet open={open} onOpenChange={onOpenChange} modal="trap-focus">
      <SheetContent
        side="right"
        // The header row below renders its own close (X) button, so
        // turn off SheetContent's built-in one to avoid two X icons.
        showCloseButton={false}
        // The dimmed overlay must receive taps: tapping beside the
        // menu is how phone users expect to close it. (It used to be
        // pointer-events-none, which made outside taps do nothing.)
        className="w-[88vw] max-w-sm border-l border-uk-line bg-uk-surface p-0 backdrop-blur-xl"
      >
        <div className="flex items-center justify-between border-b border-uk-line px-5 py-4">
          <SheetTitle className="font-heading text-lg font-bold text-uk-heading">
            <Tx>{c.menuTitle}</Tx>
          </SheetTitle>
          <SheetClose
            render={
              <button
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-uk-muted hover:text-uk-heading"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            }
          />
        </div>
        {/* data-lenis-prevent: let the wheel scroll the menu's own
            list instead of being captured by the page smooth-scroll */}
        <div className="flex flex-col gap-1 overflow-y-auto overscroll-contain px-3 py-4" data-lenis-prevent>
          {menus.map((m) =>
            m.type === "link" ? (
              <Link
                key={m.id}
                href={m.href}
                onClick={close}
                className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-uk-body hover:bg-uk-surface-2 hover:text-uk-heading"
              >
                <span className="flex h-6 w-6 flex-none items-center justify-center rounded-md bg-uk-blue/12 text-uk-blue" aria-hidden>
                  {menuIcon(m)}
                </span>
                <Tx>{m.label}</Tx>
              </Link>
            ) : (
              <MobileGroup key={m.id} label={m.label} icon={menuIcon(m)} items={m.items} icons={icons} onClose={close} />
            )
          )}
          <div className="mt-3 flex flex-col gap-3 px-2">
            <Button
              nativeButton={false}
              className="bg-uk-blue text-white hover:bg-uk-blue-bright"
              render={<Link href={c.ctaHref} onClick={close} />}
            >
              <Tx>{c.ctaLabel}</Tx>
              <ArrowRight className="ml-1.5 h-4 w-4" />
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function MobileGroup({
  label,
  icon,
  items,
  icons,
  onClose,
}: {
  label: string;
  icon: React.ReactNode;
  items: NavLink[];
  icons?: Record<string, React.ReactNode>;
  onClose: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="border-b border-uk-line">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-between px-3 py-3 text-sm font-semibold text-uk-heading"
        aria-expanded={expanded}
      >
        <span className="flex items-center gap-2.5">
          <span
            className="flex h-6 w-6 flex-none items-center justify-center rounded-md bg-uk-blue/12 text-uk-blue"
            aria-hidden
          >
            {icon}
          </span>
          <Tx>{label}</Tx>
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 text-uk-muted transition-transform",
            expanded && "rotate-180"
          )}
        />
      </button>
      {expanded && (
        <div className="flex flex-col gap-0.5 pb-2">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className="flex items-center gap-3 rounded-lg px-3 py-2 pl-6 text-sm text-uk-muted hover:bg-uk-surface-2 hover:text-uk-heading"
            >
              {icons?.[item.label] && (
                <span className="flex h-6 w-6 flex-none items-center justify-center rounded-md bg-uk-blue/12 text-uk-blue">
                  {icons[item.label]}
                </span>
              )}
              <Tx>{item.label}</Tx>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
