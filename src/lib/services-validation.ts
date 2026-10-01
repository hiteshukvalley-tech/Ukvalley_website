import type { Service } from "./site-data";

export type FieldErrors = Record<string, string>;

/** Icon keys the public Services section knows how to draw. */
export const serviceIcons = [
  "code", "smartphone", "layoutDashboard", "cloud",
  "megaphone", "shieldCheck", "blocks", "palette",
] as const;

export type ServiceIcon = (typeof serviceIcons)[number];

/** Editable fields as the form submits them (all strings). */
export type ServiceValues = {
  title: string;
  slug: string;
  icon: string;
  blurb: string;
  /** one bullet per line */
  bullets: string;
  href: string;
  /** "on" when the Published checkbox is ticked, otherwise "" */
  published: string;
};

export const emptyServiceValues: ServiceValues = {
  title: "", slug: "", icon: "code", blurb: "", bullets: "", href: "", published: "on",
};

/** Stored shape: the public card fields plus admin-only bookkeeping. */
export type ServiceRecord = Service & {
  slug: string;
  published: boolean;
  order: number;
};

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function readServiceValues(formData: FormData): ServiceValues {
  const s = (k: string) => String(formData.get(k) ?? "").trim();
  return {
    title: s("title"),
    slug: s("slug").toLowerCase(),
    icon: s("icon"),
    blurb: s("blurb"),
    bullets: String(formData.get("bullets") ?? ""),
    href: s("href"),
    published: formData.get("published") ? "on" : "",
  };
}

export function toServiceValues(r: ServiceRecord): ServiceValues {
  return {
    title: r.title, slug: r.slug, icon: r.icon, blurb: r.blurb,
    bullets: r.bullets.join("\n"), href: r.href, published: r.published ? "on" : "",
  };
}

export function splitBullets(raw: string): string[] {
  return raw.split(/\r?\n/).map((b) => b.trim()).filter(Boolean);
}

export function validateService(
  v: ServiceValues,
  { requireSlug }: { requireSlug: boolean }
):
  | { ok: true; value: Omit<ServiceRecord, "order"> }
  | { ok: false; errors: FieldErrors } {
  const e: FieldErrors = {};

  if (!v.title) e.title = "Title is required.";
  else if (v.title.length > 80) e.title = "Title must be 80 characters or fewer.";

  if (requireSlug) {
    if (!v.slug) e.slug = "Slug is required.";
    else if (v.slug.length > 60) e.slug = "Slug must be 60 characters or fewer.";
    else if (!SLUG.test(v.slug)) e.slug = "Use lowercase letters, numbers and single hyphens only.";
  }

  if (!(serviceIcons as readonly string[]).includes(v.icon)) e.icon = "Choose one of the listed icons.";

  if (!v.blurb) e.blurb = "Description is required.";
  else if (v.blurb.length > 300) e.blurb = "Description must be 300 characters or fewer.";

  const bullets = splitBullets(v.bullets);
  if (bullets.length === 0) e.bullets = "Add at least one bullet.";
  else if (bullets.length > 12) e.bullets = "Use 12 bullets or fewer.";
  else if (bullets.some((b) => b.length > 60)) e.bullets = "Each bullet must be 60 characters or fewer.";

  const href = v.href || (v.slug ? `/services/${v.slug}` : "");
  if (!href) e.href = "Link is required.";
  else if (!/^\/(?!\/)/.test(href) && !/^https?:\/\//.test(href)) {
    e.href = "Start with / (a page on this site) or https://";
  }

  if (Object.keys(e).length) return { ok: false, errors: e };
  return {
    ok: true,
    value: {
      slug: v.slug, title: v.title, icon: v.icon, blurb: v.blurb,
      bullets, href, published: v.published === "on",
    },
  };
}

const WORDS = ["zero","one","two","three","four","five","six","seven","eight","nine","ten","eleven","twelve"];
/** 8 -> "eight" (falls back to digits above twelve) for headings like "Eight service lines". */
export const countWord = (n: number) => WORDS[n] ?? String(n);
export const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
