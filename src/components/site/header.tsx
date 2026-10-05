import { getServices } from "@/lib/services-store";
import { getSolutions } from "@/lib/solutions-store";
import { getHireRoles } from "@/lib/hire-store";
import { getMenu } from "@/lib/menu-store";
import { adminLinks } from "@/lib/nav-links";
import { nav } from "@/lib/site-core";
import { getChrome } from "@/lib/home-store";
import { HeaderClient, type ResolvedMenu } from "./header-client";

/**
 * Server wrapper: the menu (order, names, items) comes from Admin → Main
 * menu. Services, Solutions and Hire follow their admin-managed lists, so an
 * item added there shows up, and one unpublished or deleted never links to a 404.
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
        // Follow Admin → Solutions / Hire roles: their order, new items included.
        case "solutions":
          return { ...base, type: "dropdown", wide: true, items: adminLinks(nav.solutions, "/solutions", solutions, (s) => s.name) };
        case "hire":
          return { ...base, type: "dropdown", wide: true, items: adminLinks(nav.hire, "/hire", hireRoles, (r) => `Hire ${r.title}`) };
        case "dropdown":
          return { ...base, type: "dropdown", wide: m.links.length > 9, items: m.links };
        default:
          return { ...base, type: "link", items: [] };
      }
    });
  return <HeaderClient content={header} menus={menus} />;
}
