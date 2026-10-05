// Editable parts of the inner pages (About, Pricing, Privacy…): an optional
// replacement for the hero text, plus extra blocks the admin can add, reorder
// and delete. The page's own built-in copy is not touched, so an empty field
// always means "keep the built-in text". Client-safe.
import type { SectionDef, SectionValues } from "@/lib/home-schema";

export const EDITABLE_PAGES = [
  { key: "about", label: "About us", href: "/about" },
  { key: "why-ukvalley", label: "Why Ukvalley", href: "/why-ukvalley" },
  { key: "pricing", label: "Pricing", href: "/pricing" },
  { key: "process", label: "Process", href: "/process" },
  { key: "engagement", label: "Engagement model", href: "/engagement" },
  { key: "support-maintenance", label: "Support & SLA", href: "/support-maintenance" },
  { key: "project-rescue", label: "Project rescue", href: "/project-rescue" },
  { key: "clients", label: "Client success", href: "/clients" },
  { key: "team", label: "Our team", href: "/team" },
  { key: "social-impact", label: "Our social impact", href: "/social-impact" },
  { key: "careers", label: "Careers", href: "/careers" },
  { key: "contact", label: "Contact", href: "/contact" },
  { key: "faq", label: "FAQ", href: "/faq" },
  { key: "tech-stack", label: "Tech stack", href: "/tech-stack" },
  { key: "services", label: "Services (index)", href: "/services" },
  { key: "solutions", label: "Solutions (index)", href: "/solutions" },
  { key: "products", label: "Products (index)", href: "/products" },
  { key: "industries", label: "Industries (index)", href: "/industries" },
  { key: "case-studies", label: "Case studies (index)", href: "/case-studies" },
  { key: "hire", label: "Hire (index)", href: "/hire" },
  { key: "locations", label: "Locations (index)", href: "/locations" },
  { key: "blog", label: "Insights (index)", href: "/blog" },
  { key: "privacy", label: "Privacy policy", href: "/privacy" },
  { key: "terms", label: "Terms of service", href: "/terms" },
  { key: "sitemap", label: "Sitemap", href: "/sitemap" },
] as const;

export type PageKey = (typeof EDITABLE_PAGES)[number]["key"];
export const pageInfo = (key: string) => EDITABLE_PAGES.find((p) => p.key === key);
export const isPageKey = (key: string): key is PageKey => EDITABLE_PAGES.some((p) => p.key === key);

const KEEP = "Leave empty to keep the page's built-in text.";

export const PAGE_DEF: SectionDef = {
  key: "page",
  label: "Page text",
  description: "Replace the hero text and add extra blocks to this page.",
  canHide: false,
  fields: [
    { key: "heroEyebrow", label: "Hero — small label", kind: "text", max: 60, hint: KEEP },
    { key: "heroTitle", label: "Hero — title", kind: "text", max: 160, hint: `${KEEP} Wrap words in *stars* to highlight them.` },
    { key: "heroDescription", label: "Hero — description", kind: "textarea", max: 400, rows: 3, hint: KEEP },
    { key: "seoTitle", label: "SEO — page title (browser tab & Google)", kind: "text", max: 70, hint: `${KEEP} About 50–60 characters; the company name is added after it.` },
    { key: "seoDescription", label: "SEO — description (Google & link previews)", kind: "textarea", max: 200, rows: 2, hint: `${KEEP} About 150–160 characters.` },
    {
      key: "blocks",
      label: "Extra blocks (shown at the end of the page, above the footer)",
      kind: "group",
      itemLabel: "Block",
      minItems: 0,
      maxItems: 12,
      hint: "Add as many as you like; use the arrows to reorder them.",
      fields: [
        { key: "eyebrow", label: "Small label (optional)", kind: "text", max: 60 },
        { key: "title", label: "Title", kind: "text", max: 160, required: true },
        { key: "description", label: "Text", kind: "textarea", max: 1500 },
        { key: "image", label: "Image (optional)", kind: "image", max: 300 },
        { key: "imageAlt", label: "Image description", kind: "text", max: 140 },
        { key: "buttonLabel", label: "Button text (optional)", kind: "text", max: 40 },
        { key: "buttonHref", label: "Button link (needed when there is button text)", kind: "text", max: 200, link: true },
      ],
    },
  ],
};

/** Owner / company block shown on the About page (Admin → Page text → About us). */
const FOUNDER_FIELDS: SectionDef["fields"] = [
  { key: "founderEyebrow", label: "Owner section — small label", kind: "text", max: 60, hint: KEEP },
  { key: "founderName", label: "Owner — name", kind: "text", max: 80, hint: KEEP },
  { key: "founderRole", label: "Owner — role", kind: "text", max: 80, hint: KEEP },
  { key: "founderDescription", label: "Owner — description", kind: "textarea", max: 1500, rows: 6, hint: `${KEEP} Press Enter twice for a new paragraph.` },
  { key: "founderImage", label: "Owner — photo", kind: "image", max: 300, hint: KEEP },
  { key: "founderImageAlt", label: "Owner — photo description", kind: "text", max: 140 },
  { key: "companyDescription", label: "Company — description", kind: "textarea", max: 1500, rows: 6, hint: KEEP },
  { key: "workImage", label: "“Where the work happens” — image", kind: "image", max: 300, hint: KEEP },
  { key: "workImageAlt", label: "“Where the work happens” — image description", kind: "text", max: 140 },
  {
    key: "founderFacts",
    label: "Owner & company details (e.g. Email, Experience, Founded)",
    kind: "group",
    itemLabel: "Detail",
    minItems: 0,
    maxItems: 8,
    hint: "Shown as a small list beside the owner's photo. Leave empty to keep the built-in details.",
    fields: [
      { key: "label", label: "Label", kind: "text", max: 40, required: true },
      { key: "value", label: "Value", kind: "text", max: 120, required: true },
    ],
  },
];

/** Our team page: the image beside "How the team is built". */
const TEAM_FIELDS: SectionDef["fields"] = [
  { key: "workImage", label: "“How the team is built” — image", kind: "image", max: 300, hint: KEEP },
  { key: "workImageAlt", label: "“How the team is built” — image description", kind: "text", max: 140 },
];

/**
 * Our social impact page: the intro and its photo-gallery sections (tree
 * plantation, sports, celebrations…). The admin edits, reorders, removes and
 * adds gallery sections; the editor opens pre-filled with the built-in ones.
 */
const SOCIAL_FIELDS: SectionDef["fields"] = [
  { key: "introEyebrow", label: "Intro — small label", kind: "text", max: 60, hint: KEEP },
  { key: "introTitle", label: "Intro — title", kind: "text", max: 160, hint: KEEP },
  { key: "introText", label: "Intro — text", kind: "textarea", max: 3000, rows: 8, hint: `${KEEP} Press Enter twice for a new paragraph.` },
  {
    key: "galleries",
    label: "Page sections",
    kind: "group",
    itemLabel: "Section",
    minItems: 0,
    maxItems: 30,
    hint: "Each section is a title, a text and (optionally) a photo carousel. Add as many as you like with “Add section” and use the arrows to reorder them. Remove every section to show the built-in ones again.",
    fields: [
      { key: "title", label: "Title", kind: "text", max: 80, required: true },
      { key: "caption", label: "Badge on the photos (e.g. Tree Plantation)", kind: "text", max: 40 },
      { key: "description", label: "Text", kind: "textarea", max: 1500 },
      { key: "photos", label: "Photos (optional — leave empty for a text-only section)", kind: "images", max: 12000, maxImages: 40 },
    ],
  },
];

const insertBeforeBlocks = (extra: SectionDef["fields"]): SectionDef => {
  const i = PAGE_DEF.fields.findIndex((f) => f.key === "blocks");
  return { ...PAGE_DEF, fields: [...PAGE_DEF.fields.slice(0, i), ...extra, ...PAGE_DEF.fields.slice(i)] };
};

/** The editor definition for one page: some pages get extra fields of their own. */
export function pageDef(key: string): SectionDef {
  if (key === "team") return insertBeforeBlocks(TEAM_FIELDS);
  if (key === "about") return insertBeforeBlocks(FOUNDER_FIELDS);
  if (key === "social-impact") return insertBeforeBlocks(SOCIAL_FIELDS);
  return PAGE_DEF;
}

export type PageBlock = {
  eyebrow: string; title: string; description: string; image: string; imageAlt: string;
  buttonLabel: string; buttonHref: string;
};
export type PageContent = {
  heroEyebrow: string; heroTitle: string; heroDescription: string; blocks: PageBlock[];
  seoTitle: string; seoDescription: string;
  founderEyebrow: string; founderName: string; founderRole: string; founderDescription: string;
  founderImage: string; founderImageAlt: string; companyDescription: string;
  founderFacts: { label: string; value: string }[];
  workImage: string; workImageAlt: string;
  introEyebrow: string; introTitle: string; introText: string;
  /** `photos`: one image address per line */
  galleries: { title: string; caption: string; description: string; photos: string }[];
};

export const emptyPageContent: PageContent = {
  heroEyebrow: "", heroTitle: "", heroDescription: "", blocks: [],
  seoTitle: "", seoDescription: "",
  founderEyebrow: "", founderName: "", founderRole: "", founderDescription: "",
  founderImage: "", founderImageAlt: "", companyDescription: "", founderFacts: [],
  workImage: "", workImageAlt: "",
  introEyebrow: "", introTitle: "", introText: "", galleries: [],
};
export const emptyPageValues = emptyPageContent as unknown as SectionValues;

/** A button needs its text and its link together — checked after the field rules. */
export function checkPagePairs(v: Record<string, unknown>): Record<string, string> {
  const errors: Record<string, string> = {};
  const s = (x: unknown) => (typeof x === "string" ? x : "");
  const blocks = Array.isArray(v.blocks) ? (v.blocks as Record<string, unknown>[]) : [];
  blocks.forEach((b, i) => {
    if (s(b.buttonLabel) && !s(b.buttonHref)) errors[`blocks.${i}.buttonHref`] = "Add the link for this button.";
    if (s(b.buttonHref) && !s(b.buttonLabel)) errors[`blocks.${i}.buttonLabel`] = "Add the text for this button.";
  });
  return errors;
}
