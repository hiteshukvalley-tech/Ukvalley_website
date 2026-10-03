import {
  Code, Smartphone, LayoutDashboard, Cloud, Megaphone, ShieldCheck, Blocks, Palette, Layers, Briefcase,
  Building2, Newspaper, BookOpen, FileBarChart, Package, Factory, Cpu, Users, UsersRound, Workflow,
  Handshake, HeartHandshake, GraduationCap, Boxes, ShoppingBag, CalendarCheck, Landmark, HeartPulse,
  Truck, Utensils, Banknote, MapPin, Globe, Star, Sparkles, LifeBuoy, HelpCircle, Trophy, Wrench,
  Headset, Mail, Phone, Info, Home, type LucideIcon,
} from "lucide-react";
import type { MenuIconKey } from "@/lib/menu-icon-keys";

const ICONS: Record<MenuIconKey, LucideIcon> = {
  code: Code, smartphone: Smartphone, layoutDashboard: LayoutDashboard, cloud: Cloud, megaphone: Megaphone,
  shieldCheck: ShieldCheck, blocks: Blocks, palette: Palette, layers: Layers, briefcase: Briefcase,
  building2: Building2, newspaper: Newspaper, bookOpen: BookOpen, fileBarChart: FileBarChart, package: Package,
  factory: Factory, cpu: Cpu, users: Users, usersRound: UsersRound, workflow: Workflow, handshake: Handshake,
  heartHandshake: HeartHandshake, graduationCap: GraduationCap, boxes: Boxes, shoppingBag: ShoppingBag,
  calendarCheck: CalendarCheck, landmark: Landmark, heartPulse: HeartPulse, truck: Truck, utensils: Utensils,
  banknote: Banknote, mapPin: MapPin, globe: Globe, star: Star, sparkles: Sparkles, lifeBuoy: LifeBuoy,
  helpCircle: HelpCircle, trophy: Trophy, wrench: Wrench, headset: Headset, mail: Mail, phone: Phone,
  info: Info, home: Home,
};

/** The icon for a saved key; null when the key is empty or unknown. */
export function MenuIcon({ name, className = "h-4 w-4" }: { name?: string; className?: string }) {
  const Icon = name ? ICONS[name as MenuIconKey] : undefined;
  return Icon ? <Icon className={className} /> : null;
}
