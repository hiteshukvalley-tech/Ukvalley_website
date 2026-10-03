"use client";

import { useEffect, useRef, useState } from "react";
import Link from "@/components/site/intent-link";
import { usePathname } from "next/navigation";
import {
  Menu,
  X,
  ChevronDown,
  ArrowRight,
  ArrowUpRight,
  Code,
  Smartphone,
  LayoutDashboard,
  Cloud,
  Megaphone,
  ShieldCheck,
  Blocks,
  Palette,
  Layers,
  Briefcase,
  Building2,
  Newspaper,
  FileBarChart,
  Package,
  Factory,
  Cpu,
  Users,
  UsersRound,
  Workflow,
  Handshake,
  GraduationCap,
  Boxes,
  ShoppingBag,
  CalendarCheck,
  Landmark,
  HeartPulse,
  Truck,
  Utensils,
  Atom,
  Triangle,
  Server,
  Braces,
  Component,
  Database,
  FlaskConical,
  Banknote,
  MapPin,
  Star,
  LifeBuoy,
  HelpCircle,
  Trophy,
  Wrench,
  Headset,
  HeartHandshake,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
  SheetTitle,
} from "@/components/ui/sheet";
import type { NavLink } from "@/lib/site-core";
import { defaultHeader, type HeaderContent } from "@/lib/site-content-schema";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "./theme-toggle";
import { MenuIcon } from "./menu-icon";

/* Icons for the top-level bar items, keyed by menu (not by label, so the
   admin can rename a menu without losing its icon). */
const menuIcon = (m: { id: string; icon?: string }) =>
  (m.icon && <MenuIcon name={m.icon} />) ||
  (m.id === "insights" ? <Newspaper className="h-4 w-4" /> : (topLevelIcons[m.id] ?? <Layers className="h-4 w-4" />));

const topLevelIcons: Record<string, React.ReactNode> = {
  services: <Layers className="h-4 w-4" />,
  solutions: <Boxes className="h-4 w-4" />,
  work: <Briefcase className="h-4 w-4" />,
  company: <Building2 className="h-4 w-4" />,
  hire: <Users className="h-4 w-4" />,
  careers: <GraduationCap className="h-4 w-4" />,
};

/* Dropdown item icons keyed by nav label — used in the desktop dropdowns and
   the mobile sheet so both surfaces mirror the site's content. */
const itemIcons: Record<string, React.ReactNode> = {
  // Services
  "Web & Web App Development": <Code className="h-4 w-4" />,
  "Mobile App Development": <Smartphone className="h-4 w-4" />,
  "Custom Software · CRM · ERP · HRMS": <LayoutDashboard className="h-4 w-4" />,
  "Cloud & DevOps Engineering": <Cloud className="h-4 w-4" />,
  "Digital Marketing": <Megaphone className="h-4 w-4" />,
  "Managed IT · Cloud · Cybersecurity": <ShieldCheck className="h-4 w-4" />,
  "Blockchain & DeFi Development": <Blocks className="h-4 w-4" />,
  "Graphic & Brand Design": <Palette className="h-4 w-4" />,
  // Work
  "Case Studies": <FileBarChart className="h-4 w-4" />,
  "Products": <Package className="h-4 w-4" />,
  "Industries": <Factory className="h-4 w-4" />,
  "Tech Stack": <Cpu className="h-4 w-4" />,
  // Company
  "About Us": <Users className="h-4 w-4" />,
  "Our Team": <UsersRound className="h-4 w-4" />,
  "Our Social Impact": <HeartHandshake className="h-4 w-4" />,
  "Process": <Workflow className="h-4 w-4" />,
  "Engagement Model": <Handshake className="h-4 w-4" />,
  "Careers": <GraduationCap className="h-4 w-4" />,
  "Pricing": <Banknote className="h-4 w-4" />,
  "Locations": <MapPin className="h-4 w-4" />,
  "Why Ukvalley": <Star className="h-4 w-4" />,
  "Support & SLA": <LifeBuoy className="h-4 w-4" />,
  "FAQ": <HelpCircle className="h-4 w-4" />,
  // Work (new)
  "Client Success": <Trophy className="h-4 w-4" />,
  "Project Rescue": <Wrench className="h-4 w-4" />,
  // Solutions
  "All Solutions": <Boxes className="h-4 w-4" />,
  "CRM Systems": <Users className="h-4 w-4" />,
  "ERP Systems": <LayoutDashboard className="h-4 w-4" />,
  "HRMS & Payroll": <Briefcase className="h-4 w-4" />,
  "Learning Management (LMS)": <GraduationCap className="h-4 w-4" />,
  "E-commerce Platforms": <ShoppingBag className="h-4 w-4" />,
  "Booking & Appointments": <CalendarCheck className="h-4 w-4" />,
  "POS Systems": <Landmark className="h-4 w-4" />,
  "Loan Origination": <Landmark className="h-4 w-4" />,
  "Healthcare Platforms": <HeartPulse className="h-4 w-4" />,
  "Logistics & Fleet Tracking": <Truck className="h-4 w-4" />,
  "Real Estate CRM": <Building2 className="h-4 w-4" />,
  "Food Delivery & Restaurants": <Utensils className="h-4 w-4" />,
  // Hire
  "All Developers": <Users className="h-4 w-4" />,
  "Hire React Developers": <Atom className="h-4 w-4" />,
  "Hire Next.js Developers": <Triangle className="h-4 w-4" />,
  "Hire Node.js Developers": <Server className="h-4 w-4" />,
  "Hire Flutter Developers": <Smartphone className="h-4 w-4" />,
  "Hire React Native Developers": <Smartphone className="h-4 w-4" />,
  "Hire Python Developers": <Braces className="h-4 w-4" />,
  "Hire Angular Developers": <Component className="h-4 w-4" />,
  "Hire Laravel / PHP Developers": <Database className="h-4 w-4" />,
  "Hire DevOps Engineers": <Cloud className="h-4 w-4" />,
  "Hire QA Engineers": <FlaskConical className="h-4 w-4" />,
  "Hire UI/UX Designers": <Palette className="h-4 w-4" />,
  "Hire Sales Executives": <Headset className="h-4 w-4" />,
};

export type ServiceNavLink = NavLink & { icon: string };

/** One top-level menu entry, already resolved on the server (Admin → Main menu). */
export type ResolvedMenu = {
  id: string;
  label: string;
  type: "dropdown" | "link";
  href: string;
  /** icon key picked in Admin → Main menu */
  icon?: string;
  items: (NavLink & { icon?: string })[];
  /** two-column dropdown for long lists */
  wide: boolean;
};

export function HeaderClient({
  menus,
  content: c = defaultHeader,
}: {
  /** text and button from Admin → Header */
  content?: HeaderContent;
  menus: ResolvedMenu[];
}) {
  const pathname = usePathname();
  // Services come from the database, so their icons are keyed by label at render time.
  const icons: Record<string, React.ReactNode> = { ...itemIcons };
  for (const m of menus) for (const it of m.items) if (it.icon) icons[it.label] = <MenuIcon name={it.icon} /> ;
  // The last dropdown opens leftwards so it never runs off the screen.
  const lastDropdown = [...menus].reverse().find((m) => m.type === "dropdown")?.id;
  const i_isLast = (id: string) => id === lastDropdown;
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [open, setOpen] = useState(false);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [lastPath, setLastPath] = useState(pathname);
  const lastY = useRef(0);
  const navRef = useRef<HTMLElement>(null);

  // Close the open dropdown whenever the route changes — adjusting state
  // during render is React's recommended alternative to an effect here.
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setOpenMenu(null);
  }

  const isActive = (href: string, exact = false) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 24);
      // Hide on scroll-down past 240px, reveal on scroll-up.
      setHidden(y > 240 && y > lastY.current);
      lastY.current = y;
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close the open dropdown on outside click or Escape.
  useEffect(() => {
    const onPointerDown = (e: PointerEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setOpenMenu(null);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenMenu(null);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
        hidden && "-translate-y-full"
      )}
    >
      {/* ── Main bar — glass + hairline once scrolled, shrinks a step ── */}
      <div
        className={cn(
          "relative border-b transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
          scrolled
            ? "border-uk-line bg-uk-surface/85 shadow-[0_8px_30px_-12px_rgba(15,23,42,0.12)] backdrop-blur-xl dark:shadow-[0_8px_30px_-12px_rgba(0,0,0,0.35)]"
            : "border-transparent bg-transparent"
        )}
      >
        {/* Gradient hairline — a blue→violet light line that fades in
            along the bar's bottom edge once the header turns to glass */}
        <div
          aria-hidden
          className={cn(
            "pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-uk-blue/50 to-transparent transition-opacity duration-500",
            scrolled ? "opacity-100" : "opacity-0"
          )}
        />
        <div
          className={cn(
            "mx-auto flex max-w-7xl items-center justify-between gap-6 px-5 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] lg:px-8",
            scrolled ? "h-14 lg:h-16" : "h-16 lg:h-18"
          )}
        >
          {/* Logo */}
          <Link href="/" className="group flex items-center gap-2.5" aria-label={`${c.logoName} ${c.logoSub} home`.trim()}>
            <span className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-uk-blue to-uk-blue-bright shadow-glow-blue-sm transition-transform duration-300 group-hover:scale-105">
              <span className="font-heading text-lg font-bold text-uk-white">{c.logoMark}</span>
              <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-uk-yellow shadow-glow-yellow animate-pulse" />
            </span>
            <span className="flex flex-col leading-none">
              <span className="font-heading text-base font-bold tracking-tight text-uk-heading transition-colors">
                {c.logoName}
              </span>
              {c.logoSub && (
                <span className="text-[0.62rem] font-medium uppercase tracking-[0.28em] text-uk-muted transition-colors">
                  {c.logoSub}
                </span>
              )}
            </span>
          </Link>

          {/* Desktop nav — one dropdown open at a time; hovering another
              button closes the current one and opens only the new one */}
          <nav
            ref={navRef}
            className="hidden items-center gap-1 lg:flex"
            aria-label="Primary"
            onMouseLeave={() => setOpenMenu(null)}
          >
            {menus.map((m) =>
              m.type === "link" ? (
                <Link
                  key={m.id}
                  href={m.href}
                  className={cn(
                    "group relative flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                    isActive(m.href) ? "font-semibold text-uk-blue" : "text-uk-body hover:text-uk-heading"
                  )}
                >
                  <span
                    className={cn(
                      "flex h-5 w-5 flex-none items-center justify-center transition-colors",
                      isActive(m.href) ? "text-uk-blue" : "text-uk-muted group-hover:text-uk-blue"
                    )}
                    aria-hidden
                  >
                    {menuIcon(m)}
                  </span>
                  {m.label}
                  <span
                    className={cn(
                      "pointer-events-none absolute inset-x-3 -bottom-0.5 h-0.5 origin-left rounded-full transition-transform duration-300",
                      isActive(m.href) || "scale-x-0 group-hover:scale-x-100",
                      isActive(m.href) ? "scale-x-100 bg-uk-yellow" : "bg-gradient-to-r from-uk-blue to-uk-yellow"
                    )}
                  />
                </Link>
              ) : (
                <NavDropdown
                  key={m.id}
                  menuKey={m.id}
                  label={m.label}
                  items={m.items}
                  icons={icons}
                  wide={m.wide}
                  alignRight={i_isLast(m.id)}
                  active={m.items.some((i) => isActive(i.href))}
                  openMenu={openMenu}
                  setOpenMenu={setOpenMenu}
                />
              )
            )}
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Button
              size="sm"
              nativeButton={false}
              className="hidden h-10 px-5 text-sm font-semibold btn-sheen bg-uk-blue text-white shadow-glow-blue-sm transition-all hover:bg-uk-blue-bright sm:inline-flex"
              render={<Link href={c.ctaHref} />}
            >
              {c.ctaLabel}
              <ArrowRight className="ml-1.5 h-4 w-4" />
            </Button>

            {/* Mobile trigger */}
            {/* modal="trap-focus": keyboard focus stays inside the menu (for
                accessibility) but the page is NOT scroll-locked, so the site
                stays scrollable while the hamburger menu is open. */}
            <Sheet open={open} onOpenChange={setOpen} modal="trap-focus">
              <SheetTrigger
                render={
                  <button
                    className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-uk-line text-uk-heading transition-colors hover:bg-uk-surface-2 lg:hidden"
                    aria-label="Open menu"
                  >
                    <Menu className="h-5 w-5" />
                  </button>
                }
              />
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
                    {c.menuTitle}
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
                        onClick={() => setOpen(false)}
                        className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-uk-body hover:bg-uk-surface-2 hover:text-uk-heading"
                      >
                        <span className="flex h-6 w-6 flex-none items-center justify-center rounded-md bg-uk-blue/12 text-uk-blue" aria-hidden>
                          {menuIcon(m)}
                        </span>
                        {m.label}
                      </Link>
                    ) : (
                      <MobileGroup key={m.id} menuKey={m.id} label={m.label} items={m.items} icons={icons} onClose={() => setOpen(false)} />
                    )
                  )}
                  <div className="mt-3 flex flex-col gap-3 px-2">
                    <Button
                      nativeButton={false}
                      className="bg-uk-blue text-white hover:bg-uk-blue-bright"
                      render={<Link href={c.ctaHref} onClick={() => setOpen(false)} />}
                    >
                      {c.ctaLabel}
                      <ArrowRight className="ml-1.5 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}

/* ────────────────────────────────────────────────────────────
   Services / Work / Company dropdowns — name-only lists, one
   controlled by shared state so only one can be open at a time.
   Click a button to toggle its menu; moving the cursor to
   another button closes the old menu and opens the new one.
   Clicking an item navigates to that page, where the full
   information lives.
   ──────────────────────────────────────────────────────────── */
function NavDropdown({
  menuKey,
  label,
  items,
  icons,
  active = false,
  wide = false,
  alignRight = false,
  openMenu,
  setOpenMenu,
}: {
  menuKey: string;
  label: string;
  items: NavLink[];
  icons?: Record<string, React.ReactNode>;
  active?: boolean;
  /** Two-column menu for the longer Solutions / Hire lists. */
  wide?: boolean;
  /** Anchor the panel's right edge to the button (menus near the viewport edge). */
  alignRight?: boolean;
  openMenu: string | null;
  setOpenMenu: (key: string | null) => void;
}) {
  const open = openMenu === menuKey;
  return (
    <div className="relative">
      <button
        onClick={() => setOpenMenu(open ? null : menuKey)}
        onMouseEnter={() => setOpenMenu(menuKey)}
        aria-expanded={open}
        aria-haspopup="true"
        className={cn(
          "group/btn relative flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm transition-colors",
          active || open
            ? "font-semibold text-uk-blue"
            : "font-medium text-uk-body hover:text-uk-heading"
        )}
      >
        <span
          className={cn(
            "flex h-5 w-5 flex-none items-center justify-center transition-colors",
            active || open ? "text-uk-blue" : "text-uk-muted group-hover/btn:text-uk-blue"
          )}
          aria-hidden
        >
          {topLevelIcons[menuKey] ?? <Layers className="h-4 w-4" />}
        </span>
        {label}
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 transition-transform duration-300",
            open && "rotate-180"
          )}
        />
        <span
          className={cn(
            "pointer-events-none absolute inset-x-3 -bottom-0.5 h-0.5 origin-left rounded-full transition-transform duration-300",
            active || open
              ? "scale-x-100 bg-uk-yellow"
              : "scale-x-0 bg-gradient-to-r from-uk-blue to-uk-yellow group-hover/btn:scale-x-100"
          )}
        />
      </button>
      <div
        className={cn(
          "absolute top-full pt-3 transition-all duration-300",
          alignRight ? "right-0" : "left-0",
          open ? "visible opacity-100" : "invisible opacity-0"
        )}
      >
        <div
          className={cn(
            "overflow-hidden rounded-2xl border border-uk-line bg-uk-surface/95 p-2 shadow-premium backdrop-blur-xl",
            wide ? "grid w-[34rem] grid-cols-2 gap-x-1" : "min-w-64"
          )}
        >
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpenMenu(null)}
              className="group/item flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-uk-surface-2"
            >
              {icons?.[item.label] ? (
                <span
                  className="flex h-7 w-7 flex-none items-center justify-center rounded-lg bg-uk-blue/10 text-uk-blue transition-all duration-200 group-hover/item:bg-uk-blue group-hover/item:text-uk-white"
                  aria-hidden
                >
                  {icons[item.label]}
                </span>
              ) : (
                <span className="h-1.5 w-1.5 flex-none rounded-full bg-uk-yellow opacity-0 transition-opacity group-hover/item:opacity-100" aria-hidden />
              )}
              <span className="flex-1 text-sm font-medium leading-snug text-uk-body transition-colors group-hover/item:text-uk-heading">
                {item.label}
              </span>
              <ArrowUpRight className="h-3.5 w-3.5 flex-none text-uk-blue opacity-0 transition-opacity group-hover/item:opacity-100" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

function MobileGroup({
  menuKey,
  label,
  items,
  icons,
  onClose,
}: {
  menuKey: string;
  label: string;
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
            {topLevelIcons[menuKey] ?? <Layers className="h-4 w-4" />}
          </span>
          {label}
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
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}