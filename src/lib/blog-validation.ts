import type { Insight } from "./site-data";

export type FieldErrors = Record<string, string>;

/** Editable fields as the form submits them (all strings). */
export type BlogValues = {
  title: string;
  slug: string;
  category: string;
  excerpt: string;
  /** whole minutes, e.g. "6" */
  readMinutes: string;
  /** YYYY-MM-DD */
  date: string;
  /** paragraphs separated by a blank line */
  body: string;
  /** "on" when the Published checkbox is ticked, otherwise "" */
  published: string;
};

const today = () => new Date().toISOString().slice(0, 10);

export const emptyBlogValues = (): BlogValues => ({
  title: "", slug: "", category: "", excerpt: "", readMinutes: "5",
  date: today(), body: "", published: "on",
});

/** Stored shape: the public post fields plus a draft flag. */
export type BlogRecord = Insight & { published: boolean; order: number };

/** What the form produces: `order` is assigned by the store. */
export type BlogInput = Omit<BlogRecord, "order">;

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;

export function readBlogValues(formData: FormData): BlogValues {
  const s = (k: string) => String(formData.get(k) ?? "").trim();
  return {
    title: s("title"),
    slug: s("slug").toLowerCase(),
    category: s("category"),
    excerpt: s("excerpt"),
    readMinutes: s("readMinutes"),
    date: s("date"),
    body: String(formData.get("body") ?? ""),
    published: formData.get("published") ? "on" : "",
  };
}

export function toBlogValues(r: BlogRecord): BlogValues {
  return {
    title: r.title, slug: r.slug, category: r.category, excerpt: r.excerpt,
    readMinutes: String(parseInt(r.readTime, 10) || 5),
    date: r.date, body: r.body.join("\n\n"), published: r.published ? "on" : "",
  };
}

export function splitParagraphs(raw: string): string[] {
  return raw.split(/\r?\n\s*\r?\n/).map((p) => p.replace(/\s*\r?\n\s*/g, " ").trim()).filter(Boolean);
}

/** Rough reading time: ~200 words per minute, at least 1. */
export const estimateMinutes = (paragraphs: string[]) =>
  Math.max(1, Math.round(paragraphs.join(" ").split(/\s+/).filter(Boolean).length / 200));

export function validateBlog(
  v: BlogValues,
  { requireSlug }: { requireSlug: boolean }
): { ok: true; value: BlogInput } | { ok: false; errors: FieldErrors } {
  const e: FieldErrors = {};

  if (!v.title) e.title = "Title is required.";
  else if (v.title.length > 140) e.title = "Title must be 140 characters or fewer.";

  if (requireSlug) {
    if (!v.slug) e.slug = "Slug is required.";
    else if (v.slug.length > 80) e.slug = "Slug must be 80 characters or fewer.";
    else if (!SLUG.test(v.slug)) e.slug = "Use lowercase letters, numbers and single hyphens only.";
  }

  if (!v.category) e.category = "Category is required.";
  else if (v.category.length > 40) e.category = "Category must be 40 characters or fewer.";

  if (!v.excerpt) e.excerpt = "Summary is required.";
  else if (v.excerpt.length > 300) e.excerpt = "Summary must be 300 characters or fewer.";

  const minutes = Number(v.readMinutes);
  if (!/^\d{1,2}$/.test(v.readMinutes) || minutes < 1 || minutes > 60) {
    e.readMinutes = "Enter whole minutes between 1 and 60.";
  }

  if (!DATE.test(v.date) || Number.isNaN(new Date(v.date).getTime())) {
    e.date = "Enter a valid date.";
  }

  const body = splitParagraphs(v.body);
  if (body.length === 0) e.body = "Write at least one paragraph.";
  else if (body.length > 60) e.body = "Use 60 paragraphs or fewer.";
  else if (body.some((p) => p.length > 4000)) e.body = "Each paragraph must be 4000 characters or fewer.";

  if (Object.keys(e).length) return { ok: false, errors: e };
  return {
    ok: true,
    value: {
      slug: v.slug, title: v.title, category: v.category, excerpt: v.excerpt,
      readTime: `${minutes} min read`, date: v.date, body, published: v.published === "on",
    },
  };
}
