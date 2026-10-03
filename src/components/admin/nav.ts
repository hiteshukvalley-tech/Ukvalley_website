import {
  LayoutDashboard, House, Settings, Wrench, Newspaper, Trophy, Boxes, Puzzle,
  Building2, UserPlus, MapPin, Users, MessageSquareQuote, Inbox, Image as ImageIcon,
  ShieldCheck, DatabaseZap, Briefcase, HelpCircle, ListOrdered, Layers, Handshake,
  FolderKanban, Landmark, FileUser, PanelTop, PanelBottom, FileText, Menu, type LucideIcon,
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

/** "Pages & text": every page of a website section, edited section by section. */
const pagesLink = (slug: string): AdminNavLink => ({ label: "Pages & text", href: `/admin/texts/${slug}`, icon: FileText });

/**
 * The sidebar. "Website" mirrors the public site's main menu (Services,
 * Solutions, Work, Company, Hire, Insights): each section holds the lists it
 * manages (cards, articles, roles…) and "Pages & text", which lists all of its
 * pages for editing their text, buttons and images. What appears on every
 * page (main menu, header, footer) sits in Overview, beside the Home page.
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
          { label: "All sections & order", href: "/admin/home", exact: true },
          ...HOME_SECTIONS.map((s) => ({ label: s.label, href: `/admin/home/${s.key}` })),
        ],
      },
      { label: "Main menu", href: "/admin/menu", icon: Menu },
      { label: "Header", href: "/admin/site/header", icon: PanelTop },
      { label: "Footer", href: "/admin/site/footer", icon: PanelBottom },
    ],
  },
  {
    group: "Website",
    items: [
      {
        label: "Services",
        href: "/admin/services",
        icon: Wrench,
        children: [{ label: "Service cards", href: "/admin/services", icon: Wrench }, pagesLink("services")],
      },
      {
        label: "Solutions",
        href: "/admin/solutions",
        icon: Puzzle,
        children: [{ label: "Solution cards", href: "/admin/solutions", icon: Puzzle }, pagesLink("solutions")],
      },
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
          pagesLink("work"),
        ],
      },
      {
        label: "Company",
        href: "/admin/team",
        icon: Landmark,
        children: [
          { label: "Team", href: "/admin/team", icon: Users },
          { label: "Careers", href: "/admin/careers", icon: Briefcase },
          { label: "Job applications", href: "/admin/applications", icon: FileUser },
          { label: "Process", href: "/admin/process", icon: ListOrdered },
          { label: "Engagement models", href: "/admin/engagement", icon: Handshake },
          { label: "Locations", href: "/admin/locations", icon: MapPin },
          { label: "FAQs", href: "/admin/faqs", icon: HelpCircle },
          pagesLink("company"),
        ],
      },
      {
        label: "Hire",
        href: "/admin/hire",
        icon: UserPlus,
        children: [{ label: "Hire roles", href: "/admin/hire", icon: UserPlus }, pagesLink("hire")],
      },
      {
        label: "Insights",
        href: "/admin/blog",
        icon: Newspaper,
        children: [{ label: "Articles", href: "/admin/blog", icon: Newspaper }, pagesLink("insights")],
      },
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
  // The admin proxy lowercases addresses (/admin/home/caseStudies -> /casestudies), so compare ignoring case.
  const here = pathname.toLowerCase();
  const href = link.href.toLowerCase();
  return link.exact ? here === href : here === href || here.startsWith(`${href}/`);
}
