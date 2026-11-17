import type { ComponentProps } from "react";
import Link from "@/components/site/intent-link";

// Addresses that run code instead of opening a page. Browsers ignore tabs,
// newlines and leading spaces in a URL, so those are removed before checking.
const UNSAFE = /^(?:javascript|data|vbscript):/i;

/**
 * A link whose address is typed in the admin: site paths use client-side
 * navigation, "#section" anchors and files (.xml) are plain anchors, and full
 * https:// (or protocol-relative //host) addresses open in a new tab.
 * javascript:, data: and vbscript: addresses are never linked.
 */
export function SmartLink({ href, children, ...rest }: Omit<ComponentProps<"a">, "href"> & { href: string }) {
  const clean = href.replace(/[\u0000- ]+/g, "");
  if (UNSAFE.test(clean)) return <a {...rest}>{children}</a>;
  // "//host" and "/\host" are other sites, not paths on this one.
  const protocolRelative = /^[/\\]{2}/.test(clean);
  if (href.startsWith("/") && !protocolRelative && !/\.\w{2,5}$/.test(href)) {
    return <Link href={href} {...rest}>{children}</Link>;
  }
  const external = protocolRelative || /^https?:\/\//i.test(href);
  return (
    <a href={href} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})} {...rest}>
      {children}
    </a>
  );
}
