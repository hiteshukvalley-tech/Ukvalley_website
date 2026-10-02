import {
  LayoutDashboard, House, Settings, Wrench, Newspaper, Trophy, Boxes, Puzzle,
  Building2, UserPlus, MapPin, Users, MessageSquareQuote, Inbox, Image as ImageIcon,
  ShieldCheck, DatabaseZap, Briefcase, HelpCircle, ListOrdered, Layers, Handshake,
  FolderKanban, Landmark, type LucideIcon,
} from "lucide-react";
import { HOME_SECTIONS } from "@/lib/home-schema";

export type AdminNavLink = {
  label: string;
  href: string;
  icon?: LucideIcon;
  /** true = hidden from, and refused to, editors */
  adminOnly?: boolean;
  /** active only on this exact path (not its sub-pages) */
  exact?: boolean;
};

/** A sidebar entry: a link, or a main section that opens into sub-sections. */
export type AdminNavEntry = AdminNavLink & { icon: LucideIcon; children?: AdminNavLink[] };

/**
 * The sidebar. "Website" mirrors the public site's main menu (Services,
 * Solutions, Work, Company, Hire, Insights); each main section lists the
 * admin areas that edit its pages. A main section with a single area links
 * straight to it.
 */
export const adminNav: { group: string; items: AdminNavEntry[] }[] = [
  {
    group: "Overview",
    items: [
      { label: "Dashboard", href: "/admin", icon: LayoutDashboard, exact: true },
      {
        label: "Home page",
        href: "/admin/home",
        icon: House,
        children: [
          { label: "All sections", href: "/admin/home", exact: true },
          ...HOME_SECTIONS.map((s) => ({ label: s.label, href: `/admin/home/${s.key}` })),
        ],
      },
    ],
  },
  {
    group: "Website",
    items: [
      { label: "Services", href: "/admin/services", icon: Wrench },
      { label: "Solutions", href: "/admin/solutions", icon: Puzzle },
      {
        label: "Work",
        href: "/admin/case-studies",
        icon: FolderKanban,
        children: [
          { label: "Case studies", href: "/admin/case-studies", icon: Trophy },
          { label: "Products", href: "/admin/products", icon: Boxes },
          { label: "Industries", href: "/admin/industries", icon: Building2 },
          { label: "Tech stack", href: "/admin/tech-stack", icon: Layers },
          { label: "Testimonials", href: "/admin/testimonials", icon: MessageSquareQuote },
        ],
      },
      {
        label: "Company",
        href: "/admin/team",
        icon: Landmark,
        children: [
          { label: "Team", href: "/admin/team", icon: Users },
          { label: "Careers", href: "/admin/careers", icon: Briefcase },
          { label: "Process", href: "/admin/process", icon: ListOrdered },
          { label: "Engagement models", href: "/admin/engagement", icon: Handshake },
          { label: "Locations", href: "/admin/locations", icon: MapPin },
          { label: "FAQs", href: "/admin/faqs", icon: HelpCircle },
        ],
      },
      { label: "Hire", href: "/admin/hire", icon: UserPlus },
      { label: "Insights", href: "/admin/blog", icon: Newspaper },
    ],
  },
  {
    group: "System",
    items: [
      { label: "Leads", href: "/admin/leads", icon: Inbox },
      { label: "Media", href: "/admin/media", icon: ImageIcon },
      { label: "Site settings", href: "/admin/settings", icon: Settings, adminOnly: true },
      { label: "Users", href: "/admin/users", icon: ShieldCheck, adminOnly: true },
      { label: "Migration", href: "/admin/migration", icon: DatabaseZap, adminOnly: true },
    ],
  },
];

/** Whether `pathname` is this link's page (or one of its sub-pages). */
export function isActive(link: AdminNavLink, pathname: string): boolean {
  return link.exact ? pathname === link.href : pathname === link.href || pathname.startsWith(`${link.href}/`);
}
