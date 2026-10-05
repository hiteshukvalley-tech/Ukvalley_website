// Home page content model: which sections the home page has, which fields
// each one exposes in the admin, and how a submitted section is validated.
// Client-safe (no database code) — the admin editor and sidebar import it.
// The default text lives in home-defaults.ts; reads/writes in home-store.ts.

export type HomeSectionKey =
  | "hero" | "trust" | "explore" | "services" | "why" | "numbers" | "products"
  | "caseStudies" | "industries" | "process" | "engagement" | "tech"
  | "testimonials" | "insights" | "faq" | "cta";

type BaseField = { key: string; label: string; hint?: string; required?: boolean };
/** `images`: several pictures, stored as one image address per line (keeps a card's values plain strings). */
type SubField = BaseField & { kind: "text" | "textarea" | "image" | "images"; max: number; link?: boolean; maxImages?: number };

export type FieldDef =
  | (BaseField & { kind: "text"; max: number; link?: boolean })
  | (BaseField & { kind: "textarea"; max: number; rows?: number })
  /** An image: a /media/<id> path from the library, or a full https:// link. */
  | (BaseField & { kind: "image"; max?: number })
  /** A list of one-line strings (chips, logos, steps…). */
  | (BaseField & { kind: "list"; itemLabel: string; max: number; minItems: number; maxItems: number })
  /** A list of cards, each with the same small set of fields. */
  | (BaseField & { kind: "group"; itemLabel: string; fields: SubField[]; minItems: number; maxItems: number });

export type SectionDef<K extends string = string> = {
  key: K;
  label: string;
  /** what the section is, as the admin sees it */
  description: string;
  /** false = always shown (the hero) */
  canHide: boolean;
  fields: FieldDef[];
  /** cards in this section that are edited in another admin area */
  managedBy?: { label: string; href: string }[];
};

const MARK_HINT = "Wrap words in *stars* to highlight them.";
const eyebrow: FieldDef = { key: "eyebrow", label: "Eyebrow (small label above the title)", kind: "text", max: 60, required: true };
const title = (hint = MARK_HINT): FieldDef => ({ key: "title", label: "Title", kind: "text", max: 160, required: true, hint });
const description: FieldDef = { key: "description", label: "Description", kind: "textarea", max: 400, rows: 3 };
const statFields: SubField[] = [
  { key: "value", label: "Figure", kind: "text", max: 20, required: true },
  { key: "label", label: "Label", kind: "text", max: 60, required: true },
];

/** Every home page section, in the order the page shows them. */
export const HOME_SECTIONS: SectionDef<HomeSectionKey>[] = [
  {
    key: "hero",
    label: "Hero",
    description: "The top of the page: headline, buttons, trust line, showcase captions and the stat strip.",
    canHide: false,
    fields: [
      { key: "badge", label: "Badge", kind: "text", max: 80, required: true },
      { key: "headline", label: "Headline", kind: "text", max: 120, required: true, hint: "Wrap a word in *stars* to give it the yellow marker." },
      { key: "description", label: "Description", kind: "textarea", max: 320, rows: 3, required: true, hint: "Wrap words in *stars* to make them bold." },
      { key: "primaryCta", label: "Main button (opens the scoping form)", kind: "text", max: 40, required: true },
      { key: "secondaryCta", label: "Second button text", kind: "text", max: 40, required: true },
      { key: "secondaryHref", label: "Second button link", kind: "text", max: 200, required: true, link: true, hint: "A page path like /case-studies, or #work for a section on this page." },
      { key: "trustNote", label: "Trust line (shield icon)", kind: "text", max: 80 },
      { key: "ratingNote", label: "Trust line (five stars)", kind: "text", max: 80 },
      { key: "panelTitle", label: "Showcase panel title", kind: "text", max: 60 },
      { key: "chips", label: "Chips under the showcase", kind: "list", itemLabel: "Chip", max: 40, minItems: 0, maxItems: 3 },
      { key: "stats", label: "Stat strip", kind: "group", itemLabel: "Stat", fields: statFields, minItems: 1, maxItems: 4 },
      { key: "meshEyebrow", label: "Delivery map label", kind: "text", max: 60 },
      { key: "meshText", label: "Delivery map caption", kind: "text", max: 160 },
    ],
  },
  {
    key: "trust",
    label: "Trusted-by strip",
    description: "The scrolling row of client and product names under the hero.",
    canHide: true,
    fields: [
      { key: "label", label: "Label", kind: "text", max: 120, required: true },
      { key: "brands", label: "Names", kind: "list", itemLabel: "Name", max: 40, minItems: 1, maxItems: 24 },
    ],
  },
  {
    key: "explore",
    label: "Explore cards",
    description: "Six cards linking to the main areas of the site.",
    canHide: true,
    fields: [
      eyebrow,
      title(),
      description,
      {
        key: "cards",
        label: "Cards",
        kind: "group",
        itemLabel: "Card",
        minItems: 1,
        maxItems: 6,
        hint: "Live counts you can type anywhere on a card: {services}, {solutions}, {caseStudies}, {articles}, {hireRoles}, {foundedYear}.",
        fields: [
          { key: "label", label: "Title", kind: "text", max: 30, required: true },
          { key: "href", label: "Link", kind: "text", max: 200, required: true, link: true },
          { key: "description", label: "Description", kind: "textarea", max: 300, required: true },
          { key: "statValue", label: "Figure", kind: "text", max: 20 },
          { key: "statLabel", label: "Figure label", kind: "text", max: 40 },
          { key: "highlight1", label: "Highlight 1", kind: "text", max: 60 },
          { key: "highlight2", label: "Highlight 2", kind: "text", max: 60 },
          { key: "highlight3", label: "Highlight 3", kind: "text", max: 60 },
          { key: "cta", label: "Link text", kind: "text", max: 40, required: true },
        ],
      },
    ],
  },
  {
    key: "services",
    label: "Services",
    description: "Section heading, the large \"Engineering core\" tile and the closing call-to-action tile.",
    canHide: true,
    managedBy: [{ label: "Service cards", href: "/admin/services" }],
    fields: [
      eyebrow,
      title(`${MARK_HINT} {Count} becomes the number of services in words, {count} in digits.`),
      { ...description, hint: "{Count} / {count} insert the number of services." } as FieldDef,
      { key: "coreBadge", label: "Large tile — badge", kind: "text", max: 40 },
      { key: "coreText", label: "Large tile — extra paragraph", kind: "textarea", max: 300, rows: 3 },
      { key: "workflowLabel", label: "Large tile — workflow label", kind: "text", max: 40 },
      { key: "workflowSteps", label: "Large tile — workflow steps", kind: "list", itemLabel: "Step", max: 20, minItems: 0, maxItems: 6 },
      { key: "chips", label: "Large tile — technology chips", kind: "list", itemLabel: "Chip", max: 30, minItems: 0, maxItems: 8 },
      { key: "proof", label: "Large tile — proof figures", kind: "group", itemLabel: "Figure", fields: statFields, minItems: 0, maxItems: 3 },
      { key: "standardsLabel", label: "Large tile — standards label", kind: "text", max: 60 },
      {
        key: "standards",
        label: "Large tile — standards",
        kind: "group",
        itemLabel: "Standard",
        minItems: 0,
        maxItems: 4,
        fields: [
          { key: "title", label: "Title", kind: "text", max: 30, required: true },
          { key: "sub", label: "Detail", kind: "text", max: 30 },
        ],
      },
      { key: "ctaBadge", label: "Call-to-action tile — badge", kind: "text", max: 40 },
      { key: "ctaTitle", label: "Call-to-action tile — title", kind: "text", max: 60, required: true },
      { key: "ctaText", label: "Call-to-action tile — text", kind: "textarea", max: 200, rows: 2 },
      { key: "ctaPoints", label: "Call-to-action tile — points", kind: "list", itemLabel: "Point", max: 80, minItems: 0, maxItems: 4 },
      { key: "ctaLink", label: "Call-to-action tile — link text", kind: "text", max: 40, required: true },
    ],
  },
  {
    key: "why",
    label: "Why Ukvalley",
    description: "Heading, the four headline stats and the six reasons to choose us.",
    canHide: true,
    fields: [
      eyebrow,
      title(),
      description,
      {
        key: "stats",
        label: "Stats",
        kind: "group",
        itemLabel: "Stat",
        minItems: 1,
        maxItems: 4,
        fields: [...statFields, { key: "sub", label: "Detail", kind: "text", max: 60 }],
      },
      {
        key: "items",
        label: "Reasons",
        kind: "group",
        itemLabel: "Reason",
        minItems: 1,
        maxItems: 6,
        hint: "In a detail line, {products} becomes the live product count and {registration} the CIN from Site settings (or the company name).",
        fields: [
          { key: "title", label: "Title", kind: "text", max: 60, required: true },
          { key: "desc", label: "Text", kind: "textarea", max: 300, required: true },
          { key: "detail", label: "Detail line", kind: "text", max: 80 },
        ],
      },
    ],
  },
  {
    key: "numbers",
    label: "Delivery scoreboard",
    description: "The row of live delivery figures.",
    canHide: true,
    fields: [
      { key: "badge", label: "Badge", kind: "text", max: 40, required: true },
      { key: "title", label: "Title", kind: "text", max: 100, required: true },
      { key: "updated", label: "Updated (e.g. September 2026)", kind: "text", max: 40 },
      { key: "cadence", label: "Update note", kind: "text", max: 100 },
      {
        key: "items",
        label: "Figures",
        kind: "group",
        itemLabel: "Figure",
        minItems: 1,
        maxItems: 8,
        fields: [...statFields, { key: "sub", label: "Detail", kind: "text", max: 60 }],
      },
    ],
  },
  {
    key: "products",
    label: "Products",
    description: "Heading and button of the products section.",
    canHide: true,
    managedBy: [{ label: "Product cards", href: "/admin/products" }],
    fields: [eyebrow, title(), description, { key: "linkLabel", label: "Button text", kind: "text", max: 40, required: true }],
  },
  {
    key: "caseStudies",
    label: "Case studies",
    description: "Heading, link and footnote of the case-study preview.",
    canHide: true,
    managedBy: [{ label: "Case studies", href: "/admin/case-studies" }],
    fields: [
      eyebrow,
      title(),
      description,
      { key: "linkLabel", label: "Link text", kind: "text", max: 60, required: true, hint: "{count} becomes the number of case studies." },
      { key: "footnote", label: "Footnote", kind: "text", max: 160 },
      { key: "challengeLabel", label: "Card label — challenge", kind: "text", max: 30, hint: "Shown before each case study's challenge, e.g. \"Challenge —\"." },
      { key: "outcomeLabel", label: "Card label — outcome", kind: "text", max: 30, hint: "Shown before each case study's result, e.g. \"Outcome —\"." },
    ],
  },
  {
    key: "industries",
    label: "Industries",
    description: "Heading of the industry switchboard.",
    canHide: true,
    managedBy: [{ label: "Industries", href: "/admin/industries" }],
    fields: [
      eyebrow,
      title(),
      description,
      { key: "buttonSuffix", label: "Panel button text", kind: "text", max: 40, hint: "Follows the first word of the industry name, e.g. \"Healthcare products & consulting\"." },
      { key: "slowLabel", label: "Panel heading — challenges", kind: "text", max: 40 },
      { key: "rulesLabel", label: "Panel heading — compliance", kind: "text", max: 40 },
    ],
  },
  {
    key: "process",
    label: "Process",
    description: "Heading and status badge of the delivery pipeline.",
    canHide: true,
    managedBy: [{ label: "Process steps", href: "/admin/process" }],
    fields: [eyebrow, title(), description, { key: "badge", label: "Status badge", kind: "text", max: 100 }],
  },
  {
    key: "engagement",
    label: "Engagement models",
    description: "Heading and button of the engagement models section.",
    canHide: true,
    managedBy: [{ label: "Engagement models", href: "/admin/engagement" }],
    fields: [
      eyebrow,
      title(`${MARK_HINT} {Count} becomes the number of models in words.`),
      description,
      { key: "ctaLabel", label: "Button text", kind: "text", max: 60, required: true },
    ],
  },
  {
    key: "tech",
    label: "Tech stack",
    description: "Heading and closing note of the technology section.",
    canHide: true,
    managedBy: [{ label: "Tech categories", href: "/admin/tech-stack" }],
    fields: [eyebrow, title(), description, { key: "footnote", label: "Closing note", kind: "textarea", max: 300, rows: 2 }],
  },
  {
    key: "testimonials",
    label: "Testimonials",
    description: "Heading of the client quotes.",
    canHide: true,
    managedBy: [{ label: "Testimonials", href: "/admin/testimonials" }],
    fields: [eyebrow, title(), description],
  },
  {
    key: "insights",
    label: "Insights",
    description: "Heading, link and the \"full library\" card of the blog preview.",
    canHide: true,
    managedBy: [{ label: "Blog posts", href: "/admin/blog" }],
    fields: [
      eyebrow,
      title(),
      description,
      { key: "linkLabel", label: "Link text", kind: "text", max: 40, required: true },
      { key: "readLabel", label: "Article link text", kind: "text", max: 40, required: true, hint: "The link at the bottom of each article card." },
      { key: "libraryBadge", label: "Library card — badge", kind: "text", max: 40 },
      { key: "libraryTitle", label: "Library card — title", kind: "text", max: 100, required: true },
      { key: "libraryText", label: "Library card — text", kind: "textarea", max: 300, rows: 2 },
      { key: "libraryCta", label: "Library card — link text", kind: "text", max: 40, required: true },
    ],
  },
  {
    key: "faq",
    label: "FAQ",
    description: "Heading of the questions list.",
    canHide: true,
    managedBy: [{ label: "FAQs", href: "/admin/faqs" }],
    fields: [eyebrow, title(), description],
  },
  {
    key: "cta",
    label: "Closing call-to-action",
    description: "The coloured \"Book a scoping call\" band at the bottom of the home page.",
    canHide: true,
    fields: [
      { key: "badge", label: "Badge", kind: "text", max: 60 },
      { key: "title", label: "Title", kind: "text", max: 140, required: true },
      { key: "description", label: "Text", kind: "textarea", max: 300, rows: 2 },
      { key: "buttonLabel", label: "Button text (opens the scoping form)", kind: "text", max: 40, required: true },
      { key: "note", label: "Note under the button", kind: "text", max: 140 },
    ],
  },
];

export const homeSectionDef = (key: string) => HOME_SECTIONS.find((s) => s.key === key);
export const isHomeSectionKey = (key: string): key is HomeSectionKey => HOME_SECTIONS.some((s) => s.key === key);

/**
 * The real section key for an address segment. The admin proxy lowercases every
 * URL, so "/admin/home/caseStudies" arrives as "casestudies"; matching ignores case.
 */
export const canonicalSectionKey = (raw: string): string =>
  HOME_SECTIONS.find((s) => s.key.toLowerCase() === raw.toLowerCase())?.key ?? raw;

/** One section's editable values, in the shape the editor and database use. */
export type SectionValues = Record<string, string | string[] | Record<string, string>[]>;

/* ── Rendering helpers ─────────────────────────────────────────────── */

const WORDS = ["Zero", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve"];

/** Replaces {name} tokens; unknown tokens are left as typed. */
export function fill(text: string, vars: Record<string, string | number>): string {
  return text.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? String(vars[k]) : m));
}

/** {count} → 8, {Count} → "Eight" (digits above twelve). */
export function countVars(n: number) {
  return { count: n, Count: WORDS[n] ?? String(n) };
}

/** Splits "*marked*" runs out of a string: [{ text, marked }]. */
export function splitMarks(text: string): { text: string; marked: boolean }[] {
  return text
    .split(/(\*[^*]+\*)/)
    .filter(Boolean)
    .map((part) =>
      part.length > 2 && part.startsWith("*") && part.endsWith("*")
        ? { text: part.slice(1, -1), marked: true }
        : { text: part, marked: false }
    );
}

/** For word-by-word headings: the plain text and the indexes of marked words. */
export function markedWords(text: string): { text: string; highlight: number[] } {
  const highlight: number[] = [];
  let inside = false;
  const plain = text.trim().split(/\s+/).map((word, i) => {
    let w = word;
    if (w.startsWith("*")) {
      inside = true;
      w = w.slice(1);
    }
    if (inside) highlight.push(i);
    if (w.endsWith("*")) {
      inside = false;
      w = w.slice(0, -1);
    }
    return w;
  });
  return { text: plain.join(" "), highlight };
}

/* ── Validation ────────────────────────────────────────────────────── */

// "/path" (but not "//host" or "/\host", which browsers treat as another site), "#id" or http(s)://
const LINK = /^(\/(?![/\\])[^\s]*|#[\w-]+|https?:\/\/[^\s]+)$/;

/**
 * Checks a submitted section against its definition. Unknown keys are
 * dropped, strings trimmed, empty list rows removed. Errors are keyed by
 * path: "title", "chips.2", "cards.0.label".
 */
export function validateSection(
  def: SectionDef,
  raw: unknown
): { ok: true; value: SectionValues } | { ok: false; errors: Record<string, string> } {
  const input = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const errors: Record<string, string> = {};
  const value: SectionValues = {};
  const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");

  const checkText = (path: string, v: string, f: { label: string; max: number; required?: boolean; link?: boolean }) => {
    if (!v) {
      if (f.required) errors[path] = `${f.label} is required.`;
    } else if (v.length > f.max) errors[path] = `Use ${f.max} characters or fewer.`;
    else if (f.link && !LINK.test(v)) errors[path] = "Use a path like /services, an anchor like #work, or a full https:// link.";
  };

  for (const f of def.fields) {
    const v = input[f.key];
    if (f.kind === "text" || f.kind === "textarea" || f.kind === "image") {
      const s = str(v);
      checkText(f.key, s, f.kind === "image" ? { ...f, max: f.max ?? 300, link: true } : f);
      value[f.key] = s;
    } else if (f.kind === "list") {
      const items = (Array.isArray(v) ? v : []).map(str).filter(Boolean);
      if (items.length > f.maxItems) errors[f.key] = `Add at most ${f.maxItems}.`;
      else if (items.length < f.minItems) errors[f.key] = `Add at least ${f.minItems}.`;
      items.forEach((s, i) => checkText(`${f.key}.${i}`, s, { label: f.itemLabel, max: f.max }));
      value[f.key] = items;
    } else {
      const rows = (Array.isArray(v) ? v : [])
        .map((row) => {
          const r = (row && typeof row === "object" ? row : {}) as Record<string, unknown>;
          return Object.fromEntries(f.fields.map((sf) => [sf.key, str(r[sf.key])]));
        })
        .filter((r) => Object.values(r).some(Boolean));
      if (rows.length > f.maxItems) errors[f.key] = `Add at most ${f.maxItems}.`;
      else if (rows.length < f.minItems) errors[f.key] = `Add at least ${f.minItems}.`;
      rows.forEach((r, i) =>
        f.fields.forEach((sf) => {
          const path = `${f.key}.${i}.${sf.key}`;
          if (sf.kind !== "images") return checkText(path, r[sf.key], sf.kind === "image" ? { ...sf, link: true } : sf);
          // one address per line; blank lines dropped
          const lines = r[sf.key].split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
          r[sf.key] = lines.join("\n");
          if (!lines.length) {
            if (sf.required) errors[path] = `${sf.label} is required.`;
          } else if (sf.maxImages && lines.length > sf.maxImages) errors[path] = `Add at most ${sf.maxImages} pictures.`;
          else if (r[sf.key].length > sf.max) errors[path] = "Too many pictures — remove a few.";
          else if (lines.some((s) => !LINK.test(s) || s.startsWith("#"))) errors[path] = "Each picture needs a /media/… path or a full https:// link.";
        })
      );
      value[f.key] = rows;
    }
  }
  return Object.keys(errors).length ? { ok: false, errors } : { ok: true, value };
}
