"use client";

import { useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";

/** Typing-friendly clean-up: lowercase, spaces and symbols become single hyphens. */
export const cleanSlug = (v: string) =>
  v
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-+/, "");

/** A finished slug has no hyphen at either end. */
const trimSlug = (v: string) => cleanSlug(v).replace(/-+$/, "");

/**
 * The slug box. Capitals, spaces and symbols are corrected as you type (no
 * warning needed), and while the box has not been edited by hand it follows
 * the name / title field named by `slugFrom` in the same form.
 */
export function SlugInput({
  slugFrom,
  ...props
}: Omit<React.ComponentProps<typeof Input>, "onChange" | "onInput"> & { slugFrom: string }) {
  const ref = useRef<HTMLInputElement>(null);
  // Typed by hand (or restored after a failed save): stop following the title.
  const manual = useRef(Boolean(props.defaultValue));
  const own = useRef(false);

  const write = (value: string) => {
    const el = ref.current;
    if (!el || el.value === value) return;
    el.value = value;
    // Lets the character counter and any listener see the new value.
    own.current = true;
    el.dispatchEvent(new Event("input", { bubbles: true }));
    own.current = false;
  };

  useEffect(() => {
    const el = ref.current;
    const source = el?.form?.elements.namedItem(slugFrom);
    if (!(source instanceof HTMLInputElement)) return;
    const follow = () => {
      if (!manual.current) write(trimSlug(source.value));
    };
    source.addEventListener("input", follow);
    return () => source.removeEventListener("input", follow);
  }, [slugFrom]);

  return (
    <Input
      ref={ref}
      {...props}
      autoCapitalize="none"
      spellCheck={false}
      onInput={(e) => {
        if (own.current) return;
        const el = e.currentTarget;
        const fixed = cleanSlug(el.value);
        if (fixed !== el.value) el.value = fixed;
        // Emptying the box hands control back to the title.
        manual.current = fixed !== "";
      }}
      onBlur={(e) => {
        const fixed = trimSlug(e.currentTarget.value);
        if (fixed !== e.currentTarget.value) write(fixed);
      }}
    />
  );
}
