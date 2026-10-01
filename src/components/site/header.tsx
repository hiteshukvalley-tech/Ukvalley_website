import { getServices } from "@/lib/services-store";
import { getSolutions } from "@/lib/solutions-store";
import { getHireRoles } from "@/lib/hire-store";
import { liveLinks } from "@/lib/nav-links";
import { nav } from "@/lib/site-core";
import { HeaderClient } from "./header-client";

/**
 * Server wrapper: the Services menu comes from the admin-managed list; the
 * curated Solutions and Hire menus drop any page that is unpublished or
 * deleted in the admin, so they never link to a 404.
 */
export async function Header() {
  const [services, solutions, hireRoles] = await Promise.all([getServices(), getSolutions(), getHireRoles()]);
  return (
    <HeaderClient
      serviceLinks={services.map((s) => ({ label: s.title, href: s.href, icon: s.icon }))}
      solutionLinks={liveLinks(nav.solutions, "/solutions", solutions)}
      hireLinks={liveLinks(nav.hire, "/hire", hireRoles)}
    />
  );
}
