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
