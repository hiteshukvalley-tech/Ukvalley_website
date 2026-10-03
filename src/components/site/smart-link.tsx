import type { ComponentProps } from "react";
import Link from "@/components/site/intent-link";

/**
 * A link whose address is typed in the admin: site paths use client-side
 * navigation, "#section" anchors and files (.xml) are plain anchors, and full
 * https:// addresses open in a new tab.
 */
export function SmartLink({ href, children, ...rest }: Omit<ComponentProps<"a">, "href"> & { href: string }) {
  if (href.startsWith("/") && !/\.\w{2,5}$/.test(href)) {
    return <Link href={href} {...rest}>{children}</Link>;
  }
  const external = /^https?:\/\//i.test(href);
  return (
    <a href={href} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})} {...rest}>
      {children}
    </a>
  );
}
