import {
  LayoutDashboard, Settings, Wrench, Newspaper, Trophy, Boxes, Puzzle,
  Building2, UserPlus, MapPin, Users, MessageSquareQuote, Inbox, Image as ImageIcon,
  ShieldCheck, DatabaseZap, Briefcase, HelpCircle, ListOrdered, Layers, Handshake, type LucideIcon,
} from "lucide-react";

export type AdminNavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  /** false = planned in ADMIN_PANEL_PLAN.md but not built yet */
  ready: boolean;
  /** true = hidden from, and refused to, editors */
  adminOnly?: boolean;
};

export const adminNav: { group: string; items: AdminNavItem[] }[] = [
  {
    group: "Overview",
    items: [
      { label: "Dashboard", href: "/admin", icon: LayoutDashboard, ready: true },
      { label: "Site settings", href: "/admin/settings", icon: Settings, ready: true, adminOnly: true },
    ],
  },
  {
    group: "Content",
    items: [
      { label: "Services", href: "/admin/services", icon: Wrench, ready: true },
      { label: "Blog", href: "/admin/blog", icon: Newspaper, ready: true },
      { label: "Case studies", href: "/admin/case-studies", icon: Trophy, ready: true },
      { label: "Products", href: "/admin/products", icon: Boxes, ready: true },
      { label: "Solutions", href: "/admin/solutions", icon: Puzzle, ready: true },
      { label: "Industries", href: "/admin/industries", icon: Building2, ready: true },
      { label: "Hire roles", href: "/admin/hire", icon: UserPlus, ready: true },
      { label: "Locations", href: "/admin/locations", icon: MapPin, ready: true },
      { label: "Team", href: "/admin/team", icon: Users, ready: true },
      { label: "Careers", href: "/admin/careers", icon: Briefcase, ready: true },
      { label: "Testimonials", href: "/admin/testimonials", icon: MessageSquareQuote, ready: true },
      { label: "FAQs", href: "/admin/faqs", icon: HelpCircle, ready: true },
      { label: "Process", href: "/admin/process", icon: ListOrdered, ready: true },
      { label: "Tech stack", href: "/admin/tech-stack", icon: Layers, ready: true },
      { label: "Engagement", href: "/admin/engagement", icon: Handshake, ready: true },
    ],
  },
  {
    group: "System",
    items: [
      { label: "Leads", href: "/admin/leads", icon: Inbox, ready: true },
      { label: "Media", href: "/admin/media", icon: ImageIcon, ready: true },
      { label: "Users", href: "/admin/users", icon: ShieldCheck, ready: true, adminOnly: true },
      { label: "Migration", href: "/admin/migration", icon: DatabaseZap, ready: true, adminOnly: true },
    ],
  },
];
