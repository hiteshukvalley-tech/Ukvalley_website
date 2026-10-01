"use client";

import NextLink from "next/link";
import { useState, type ComponentProps } from "react";

/**
 * Drop-in replacement for next/link that prefetches on intent (hover, focus,
 * touch) instead of as soon as the link scrolls into view.
 *
 * With the default behaviour every visible link prefetched its whole page:
 * the home page alone fired ~90 background requests (40–130 KB each) for the
 * header menus, footer and cards, which competed with the page the visitor
 * actually clicked and made navigation feel slow. A hover gives the
 * prefetch a head start of a few hundred ms, which is plenty for these
 * pre-rendered pages. Pass `prefetch` explicitly to opt back in.
 * See node_modules/next/dist/docs/01-app/02-guides/prefetching.md.
 */
export default function Link({ prefetch, onMouseEnter, onFocus, onTouchStart, ...props }: ComponentProps<typeof NextLink>) {
  const [active, setActive] = useState(false);
  return (
    <NextLink
      {...props}
      prefetch={prefetch !== undefined ? prefetch : active ? null : false}
      onMouseEnter={(e) => {
        setActive(true);
        onMouseEnter?.(e);
      }}
      onFocus={(e) => {
        setActive(true);
        onFocus?.(e);
      }}
      onTouchStart={(e) => {
        setActive(true);
        onTouchStart?.(e);
      }}
    />
  );
}
