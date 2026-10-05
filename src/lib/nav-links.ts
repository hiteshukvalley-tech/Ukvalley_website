import type { NavLink } from "@/lib/site-core";

/**
 * Keeps the links under `base` whose detail page is live (its slug is in
 * `items`), plus the index link itself. Hard-coded menus use this so an item
 * unpublished or deleted in the admin disappears instead of becoming a 404.
 */
export function liveLinks(links: NavLink[], base: string, items: { slug: string }[]): NavLink[] {
  const live = new Set(items.map((i) => `${base}/${i.slug}`));
  return links.filter((l) => l.href === base || live.has(l.href));
}

/**
 * A dropdown that follows an admin-managed list: the index link from `curated`
 * first, then every live item in the admin's order. Items keep their curated
 * menu label when they have one ("Hire React Developers"); items added in the
 * admin use `label(item)`. Unpublished or deleted items drop out.
 */
export function adminLinks<T extends { slug: string }>(
  curated: NavLink[], base: string, items: T[], label: (item: T) => string
): NavLink[] {
  const named = new Map(curated.map((l) => [l.href, l.label]));
  const index = curated.find((l) => l.href === base);
  return [
    ...(index ? [index] : []),
    ...items.map((i) => {
      const href = `${base}/${i.slug}`;
      return { label: named.get(href) ?? label(i), href };
    }),
  ];
}
