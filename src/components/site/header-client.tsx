"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "@/components/site/intent-link";
import { usePathname } from "next/navigation";
import dynamic from "next/dynamic";
import {
  Menu,
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
import type { NavLink } from "@/lib/site-core";
import { defaultHeader, type HeaderContent } from "@/lib/site-content-schema";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "./theme-toggle";
import { MenuIcon } from "./menu-icon";
import { Tx } from "./texts-context";
import { SiteLogo } from "./site-logo";

/* The hamburger menu panel is downloaded on demand (see mobile-menu.tsx). */
const loadMobileMenu = () => import("./mobile-menu");
const MobileMenu = dynamic(() => loadMobileMenu().then((m) => m.MobileMenu), { ssr: false });

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
  // The menu panel mounts (and its code downloads) the first time it is reached for.
  const [menuWanted, setMenuWanted] = useState(false);
  const wantMenu = () => {
    void loadMobileMenu();
    if (!menuWanted) setMenuWanted(true);
  };
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  // The closed dropdowns ship as plain links (crawlable, ~4 elements per item);
  // their icons and hover arrows are added the first time the visitor reaches
  // for the menu. Drawing them up front added ~500 elements and ~120 SVGs to
  // every page's HTML, all hidden, all hydrated on load.
  const [primed, setPrimed] = useState(false);
  const prime = () => {
    if (!primed) setPrimed(true);
  };
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
      {/* data-over-hero: while transparent, the bar takes the dark theme on
          pages with a dark photo hero (globals.css), so the links stay readable */}
      <div
        data-over-hero={scrolled ? undefined : ""}
        className={cn(
          "relative border-b transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
          scrolled
            ? // The blur is redrawn on every scroll frame (Safari most of all): a light one on
              // desktop, none on phones and tablets, where a near-solid bar looks the same.
              "border-uk-line bg-uk-surface/85 shadow-[0_8px_30px_-12px_rgba(15,23,42,0.12)] backdrop-blur-md pointer-coarse:bg-uk-surface/95 pointer-coarse:backdrop-blur-none dark:shadow-[0_8px_30px_-12px_rgba(0,0,0,0.35)]"
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
            "mx-auto flex max-w-7xl items-center justify-between gap-6 pl-[max(1.25rem,env(safe-area-inset-left))] pr-[max(1.25rem,env(safe-area-inset-right))] transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] lg:px-8",
            // min-height (not a fixed height): a logo enlarged in Admin → Header
            // makes the bar taller instead of spilling out of it
            scrolled ? "min-h-14 py-1 lg:min-h-16" : "min-h-16 py-1 lg:min-h-18"
          )}
        >
          {/* Logo */}
          <Link href="/" className="group flex items-center gap-2.5" aria-label={`${c.logoName} ${c.logoSub} home`.trim()}>
            <SiteLogo content={c} text={(s) => <Tx>{s}</Tx>} pulse />
          </Link>

          {/* Desktop nav — one dropdown open at a time; hovering another
              button closes the current one and opens only the new one.
              From xl only: the row needs ~1257px, so between lg and xl
              (iPad Pro portrait, iPads in landscape) the CTA ran off-screen;
              those widths get the hamburger menu instead. */}
          <nav
            ref={navRef}
            className="hidden items-center gap-1 xl:flex"
            aria-label="Primary"
            onPointerEnter={prime}
            onFocus={prime}
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
                  <Tx>{m.label}</Tx>
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
                  decorated={primed}
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
              <Tx>{c.ctaLabel}</Tx>
              <ArrowRight className="ml-1.5 h-4 w-4" />
            </Button>

            {/* Mobile trigger */}
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-uk-line text-uk-heading transition-colors hover:bg-uk-surface-2 xl:hidden"
              aria-label="Open menu"
              aria-haspopup="dialog"
              aria-expanded={open}
              onPointerEnter={wantMenu}
              onTouchStart={wantMenu}
              onFocus={wantMenu}
              onClick={() => {
                wantMenu();
                setOpen(true);
              }}
            >
              <Menu className="h-5 w-5" />
            </button>
            {menuWanted && (
              <MobileMenu
                open={open}
                onOpenChange={setOpen}
                menus={menus}
                icons={icons}
                menuIcon={(m) => (m.type === "link" ? menuIcon(m) : (topLevelIcons[m.id] ?? <Layers className="h-4 w-4" />))}
                content={c}
              />
            )}
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
  decorated = true,
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
  /** false: items render as bare links until the menu is first reached for */
  decorated?: boolean;
  active?: boolean;
  /** Two-column menu for the longer Solutions / Hire lists. */
  wide?: boolean;
  /** Anchor the panel's right edge to the button (menus near the viewport edge). */
  alignRight?: boolean;
  openMenu: string | null;
  setOpenMenu: (key: string | null) => void;
}) {
  const open = openMenu === menuKey;
  // Opening by keyboard/touch without a hover first still gets the icons.
  const decorate = decorated || open;
  const panelId = useId();
  // Hovering opens the menu just before the click lands; that click must not
  // close it again. Only a menu opened by a click is closed by one.
  const openedByHover = useRef(false);
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => {
          const keep = open && openedByHover.current;
          openedByHover.current = false;
          if (!keep) setOpenMenu(open ? null : menuKey);
        }}
        onMouseEnter={() => {
          if (open) return;
          openedByHover.current = true;
          setOpenMenu(menuKey);
        }}
        aria-expanded={open}
        aria-controls={panelId}
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
        <Tx>{label}</Tx>
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
        id={panelId}
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
              {!decorate ? null : icons?.[item.label] ? (
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
                <Tx>{item.label}</Tx>
              </span>
              {decorate && (
                <ArrowUpRight className="h-3.5 w-3.5 flex-none text-uk-blue opacity-0 transition-opacity group-hover/item:opacity-100" />
              )}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
