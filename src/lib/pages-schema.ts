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

export type PageBlock = {
  eyebrow: string; title: string; description: string; image: string; imageAlt: string;
  buttonLabel: string; buttonHref: string;
};
export type PageContent = { heroEyebrow: string; heroTitle: string; heroDescription: string; blocks: PageBlock[] };

export const emptyPageContent: PageContent = { heroEyebrow: "", heroTitle: "", heroDescription: "", blocks: [] };
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
