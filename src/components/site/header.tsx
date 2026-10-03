import { getServices } from "@/lib/services-store";
import { getSolutions } from "@/lib/solutions-store";
import { getHireRoles } from "@/lib/hire-store";
import { getMenu } from "@/lib/menu-store";
import { liveLinks } from "@/lib/nav-links";
import { nav } from "@/lib/site-core";
import { getChrome } from "@/lib/home-store";
import { HeaderClient, type ResolvedMenu } from "./header-client";

/**
 * Server wrapper: the menu (order, names, items) comes from Admin → Main
 * menu. Services come from the admin-managed list; the curated Solutions and
 * Hire menus drop any page that is unpublished or deleted in the admin, so
 * they never link to a 404.
 */
export async function Header() {
  const [services, solutions, hireRoles, { header }, menu] = await Promise.all([
    getServices(), getSolutions(), getHireRoles(), getChrome(), getMenu(),
  ]);
  const menus: ResolvedMenu[] = menu
    .filter((m) => m.visible)
    .map((m): ResolvedMenu => {
      const base = { id: m.id, label: m.label, href: m.href, wide: false, icon: m.icon };
      switch (m.type) {
        case "services":
          return { ...base, type: "dropdown", items: services.map((s) => ({ label: s.title, href: s.href, icon: s.icon })) };
        case "solutions":
          return { ...base, type: "dropdown", wide: true, items: liveLinks(nav.solutions, "/solutions", solutions) };
        case "hire":
          return { ...base, type: "dropdown", wide: true, items: liveLinks(nav.hire, "/hire", hireRoles) };
        case "dropdown":
          return { ...base, type: "dropdown", wide: m.links.length > 9, items: m.links };
        default:
          return { ...base, type: "link", items: [] };
      }
    });
  return <HeaderClient content={header} menus={menus} />;
}
