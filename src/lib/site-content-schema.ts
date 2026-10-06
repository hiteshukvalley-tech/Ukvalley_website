// Editable content for the parts of the site that are not a fixed home-page
// section: custom home sections the admin adds, and the header and footer
// (which appear on every page). Client-safe — the admin editor imports it.
// Field definitions use the same shape as HOME_SECTIONS in home-schema.ts.
import type { FieldDef, SectionDef } from "@/lib/home-schema";

const link = (key: string, label: string): FieldDef => ({
  key, label, kind: "text", max: 200, required: true, link: true,
  hint: "A page path like /contact, or a full https:// link.",
});

/* ── Custom home sections ─────────────────────────────────────────── */

export const CUSTOM_PREFIX = "custom-";
export const isCustomKey = (key: string) => /^custom-[a-z0-9]{6,20}$/.test(key);

export const CUSTOM_SECTION_DEF: SectionDef = {
  key: "custom",
  label: "Custom section",
  description: "A section you added: heading, text, image, cards and a button.",
  canHide: true,
  fields: [
    { key: "adminName", label: "Name in the admin (not shown on the website)", kind: "text", max: 60, required: true },
    { key: "eyebrow", label: "Eyebrow (small label above the title)", kind: "text", max: 60 },
    { key: "title", label: "Title", kind: "text", max: 160, required: true, hint: "Wrap words in *stars* to highlight them." },
    { key: "description", label: "Description", kind: "textarea", max: 600, rows: 4 },
    { key: "image", label: "Main image (optional)", kind: "image", hint: "Shown beside the text. Leave empty for a text-only section." },
    { key: "imageAlt", label: "Image description (for screen readers and search)", kind: "text", max: 140 },
    {
      key: "cards",
      label: "Cards",
      kind: "group",
      itemLabel: "Card",
      minItems: 0,
      maxItems: 12,
      fields: [
        { key: "image", label: "Image (optional)", kind: "image", max: 300, aspect: "16/10" },
        { key: "title", label: "Title", kind: "text", max: 80, required: true },
        { key: "text", label: "Text", kind: "textarea", max: 400 },
        { key: "linkLabel", label: "Link text (optional)", kind: "text", max: 40 },
        { key: "href", label: "Link (needed when there is link text)", kind: "text", max: 200, link: true },
      ],
    },
    { key: "buttonLabel", label: "Button text (optional)", kind: "text", max: 40 },
    { key: "buttonHref", label: "Button link (needed when there is button text)", kind: "text", max: 200, link: true },
  ],
};

export type CustomSectionContent = {
  adminName: string; eyebrow: string; title: string; description: string;
  image: string; imageAlt: string;
  cards: { image: string; title: string; text: string; linkLabel: string; href: string }[];
  buttonLabel: string; buttonHref: string;
};

export const newCustomSection = (adminName: string): CustomSectionContent => ({
  adminName,
  eyebrow: "New section",
  title: adminName,
  description: "Write a short introduction here.",
  image: "", imageAlt: "",
  cards: [],
  buttonLabel: "", buttonHref: "",
});

/** A link needs its text and vice versa — checked after the field rules. */
export function checkCustomPairs(v: Record<string, unknown>): Record<string, string> {
  const errors: Record<string, string> = {};
  const s = (x: unknown) => (typeof x === "string" ? x : "");
  if (s(v.buttonLabel) && !s(v.buttonHref)) errors.buttonHref = "Add the link for this button.";
  if (s(v.buttonHref) && !s(v.buttonLabel)) errors.buttonLabel = "Add the text for this button.";
  const cards = Array.isArray(v.cards) ? (v.cards as Record<string, unknown>[]) : [];
  cards.forEach((c, i) => {
    if (s(c.linkLabel) && !s(c.href)) errors[`cards.${i}.href`] = "Add the link for this card.";
    if (s(c.href) && !s(c.linkLabel)) errors[`cards.${i}.linkLabel`] = "Add the link text for this card.";
  });
  return errors;
}

/* ── Header ───────────────────────────────────────────────────────── */

const navLinkFields: Extract<FieldDef, { kind: "group" }>["fields"] = [
  { key: "label", label: "Text", kind: "text", max: 60, required: true },
  { key: "href", label: "Link", kind: "text", max: 200, required: true, link: true },
];

export const HEADER_DEF: SectionDef = {
  key: "header",
  label: "Header",
  description: "The bar at the top of every page: the logo and the button. The logo also shows in the footer. The menu items themselves are in Main menu.",
  canHide: false,
  fields: [
    {
      key: "logoImage", label: "Logo image", kind: "image", max: 300,
      hint: "Shown in the header and footer. Upload a new logo (PNG, WebP or JPG; a wide logo with a transparent background works best) to replace it. Left empty, the official Ukvalley logo is used.",
    },
    {
      key: "logoImageDark", label: "Logo image for dark mode (optional)", kind: "image", max: 300,
      hint: "A light-coloured version for the dark theme. Leave empty to use the logo above in both themes.",
    },
    { key: "logoMark", label: "Logo letter (only used if the logo image can't load)", kind: "text", max: 2, required: true },
    { key: "logoName", label: "Company name (the logo's description for screen readers)", kind: "text", max: 30, required: true },
    { key: "logoSub", label: "Company name — second part", kind: "text", max: 30 },
    { key: "ctaLabel", label: "Button text", kind: "text", max: 40, required: true },
    link("ctaHref", "Button link"),
    { key: "menuTitle", label: "Phone menu title", kind: "text", max: 20, required: true },
  ],
};

export type NavItem = { label: string; href: string; /** optional menu icon key */ icon?: string };

export type HeaderContent = {
  logoMark: string; logoName: string; logoSub: string;
  /** optional logo pictures (/media/<id> or https://); when set they replace the text logo */
  logoImage: string; logoImageDark: string;
  ctaLabel: string; ctaHref: string; menuTitle: string;
};

/** The built-in Work / Company dropdown links (defaults of Admin → Main menu). */
export const defaultWorkLinks: NavItem[] = [
  { label: "Case Studies", href: "/case-studies" },
  { label: "Products", href: "/products" },
  { label: "Industries", href: "/industries" },
  { label: "Tech Stack", href: "/tech-stack" },
  { label: "Client Success", href: "/clients" },
  { label: "Project Rescue", href: "/project-rescue" },
];
export const defaultCompanyLinks: NavItem[] = [
  { label: "About Us", href: "/about" },
  { label: "Our Team", href: "/team" },
  { label: "Our Social Impact", href: "/social-impact" },
  { label: "Process", href: "/process" },
  { label: "Engagement Model", href: "/engagement" },
  { label: "Pricing", href: "/pricing" },
  { label: "Why Ukvalley", href: "/why-ukvalley" },
  { label: "Support & SLA", href: "/support-maintenance" },
  { label: "Locations", href: "/locations" },
  { label: "FAQ", href: "/faq" },
];

/** The official Ukvalley logo (built by scripts/build-brand-assets.mjs). */
export const OFFICIAL_LOGO = "/brand/ukvalley-logo.png";

export const defaultHeader: HeaderContent = {
  logoMark: "U", logoName: "Ukvalley", logoSub: "Technologies",
  logoImage: OFFICIAL_LOGO, logoImageDark: "",
  ctaLabel: "Book a scoping call", ctaHref: "/contact", menuTitle: "Menu",
};

/* ── Footer ───────────────────────────────────────────────────────── */

export const FOOTER_DEF: SectionDef = {
  key: "footer",
  label: "Footer",
  description: "The bottom of every page: about text, link columns, contact box, copyright line and legal links.",
  canHide: false,
  fields: [
    { key: "brandText", label: "About text under the logo", kind: "textarea", max: 240, rows: 3, hint: "The logo itself is edited in Header. Social icons come from Site settings." },
    { key: "servicesTitle", label: "Column title — Services", kind: "text", max: 30, required: true, hint: "Lists the first five services from Admin → Services." },
    { key: "solutionsTitle", label: "Column title — Solutions", kind: "text", max: 30, required: true },
    { key: "solutionLinks", label: "Solutions column links", kind: "group", itemLabel: "Link", fields: navLinkFields, minItems: 0, maxItems: 8, hint: "A link to a solution that is unpublished or deleted is left out automatically." },
    { key: "companyTitle", label: "Column title — Company", kind: "text", max: 30, required: true },
    { key: "companyLinks", label: "Company column links", kind: "group", itemLabel: "Link", fields: navLinkFields, minItems: 0, maxItems: 10 },
    { key: "contactTitle", label: "Contact box — title", kind: "text", max: 30, required: true },
    { key: "contactText", label: "Contact box — text", kind: "textarea", max: 240, rows: 3 },
    { key: "contactLinkLabel", label: "Contact box — link text", kind: "text", max: 60 },
    link("contactLinkHref", "Contact box — link"),
    { key: "buttonLabel", label: "Contact box — button text", kind: "text", max: 40, required: true },
    link("buttonHref", "Contact box — button link"),
    { key: "copyright", label: "Copyright line", kind: "text", max: 160, required: true, hint: "{year} becomes the current year and {name} the company name from Site settings." },
    { key: "bottomLinks", label: "Legal links (bottom right)", kind: "group", itemLabel: "Link", fields: navLinkFields, minItems: 0, maxItems: 6 },
  ],
};

export type FooterContent = {
  brandText: string;
  servicesTitle: string; solutionsTitle: string; solutionLinks: NavItem[];
  companyTitle: string; companyLinks: NavItem[];
  contactTitle: string; contactText: string; contactLinkLabel: string; contactLinkHref: string;
  buttonLabel: string; buttonHref: string;
  copyright: string; bottomLinks: NavItem[];
};

export const defaultFooter: FooterContent = {
  brandText: "Custom software for Indian SMEs and global startups. Engineered to scale, supported for years.",
  servicesTitle: "Services", solutionsTitle: "Solutions",
  solutionLinks: [
    { label: "All Solutions", href: "/solutions" },
    { label: "CRM Systems", href: "/solutions/crm" },
    { label: "ERP Systems", href: "/solutions/erp" },
    { label: "HRMS & Payroll", href: "/solutions/hrms" },
    { label: "E-commerce Platforms", href: "/solutions/ecommerce" },
    { label: "POS Systems", href: "/solutions/pos" },
  ],
  companyTitle: "Company",
  companyLinks: [
    { label: "About Us", href: "/about" },
    { label: "Our Team", href: "/team" },
    { label: "Our Social Impact", href: "/social-impact" },
    { label: "Pricing", href: "/pricing" },
    { label: "Case Studies", href: "/case-studies" },
    { label: "Client Success", href: "/clients" },
    { label: "Process", href: "/process" },
    { label: "Careers", href: "/careers" },
    { label: "Contact", href: "/contact" },
  ],
  contactTitle: "Get in touch",
  contactText: "Talk to a software architect — not a sales bot. Reply within 1 business hour.",
  contactLinkLabel: "Phone, email & office address", contactLinkHref: "/contact",
  buttonLabel: "Start a project", buttonHref: "/contact",
  copyright: "© {year} {name}. All rights reserved.",
  bottomLinks: [
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Terms of Service", href: "/terms" },
    { label: "Sitemap", href: "/sitemap" },
  ],
};

/** Header and footer, by the key used in the database and the admin URL. */
export const CHROME_DEFS = { header: HEADER_DEF, footer: FOOTER_DEF } as const;
export type ChromeKey = keyof typeof CHROME_DEFS;
export const isChromeKey = (k: string): k is ChromeKey => k === "header" || k === "footer";
