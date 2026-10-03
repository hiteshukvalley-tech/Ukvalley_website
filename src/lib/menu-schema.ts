// The main menu (Services, Solutions, Work, Company, Hire, Careers, Insights + any
// section the admin adds): which items exist, their order, labels and links.
// Client-safe — the admin editor imports it. Reads/writes are in menu-store.ts.
import { defaultCompanyLinks, defaultWorkLinks, type NavItem } from "@/lib/site-content-schema";
import type { SectionDef } from "@/lib/home-schema";
import { isMenuIcon } from "@/lib/menu-icon-keys";

/**
 * services / solutions / hire: a dropdown filled from that admin section.
 * dropdown: a dropdown of links typed here.  link: one link.
 */
export type MenuType = "services" | "solutions" | "hire" | "dropdown" | "link";

export type MenuItem = {
  id: string;
  label: string;
  type: MenuType;
  /** link items only */
  href: string;
  /** dropdown items only */
  links: NavItem[];
  visible: boolean;
  /** optional icon key (menu-icon-keys.ts) shown beside the name; empty = default */
  icon?: string;
};

export const BUILT_IN_MENU_IDS = ["services", "solutions", "work", "company", "hire", "careers", "insights"] as const;
export const isBuiltInMenuId = (id: string) => (BUILT_IN_MENU_IDS as readonly string[]).includes(id);
export const isCustomMenuId = (id: string) => /^m-[a-z0-9]{6,20}$/.test(id);

export const MAX_MENU_ITEMS = 12;
export const MAX_DROPDOWN_LINKS = 20;

export const defaultMenu: MenuItem[] = [
  { id: "services", label: "Services", type: "services", href: "", links: [], visible: true },
  { id: "solutions", label: "Solutions", type: "solutions", href: "", links: [], visible: true },
  { id: "work", label: "Work", type: "dropdown", href: "", links: defaultWorkLinks, visible: true },
  { id: "company", label: "Company", type: "dropdown", href: "", links: defaultCompanyLinks, visible: true },
  { id: "careers", label: "Careers", type: "link", href: "/careers", visible: true, links: [] },
  { id: "hire", label: "Hire", type: "hire", href: "", links: [], visible: true },
  { id: "insights", label: "Insights", type: "link", href: "/blog", visible: true, links: [] },
];

/** "Label | /path | icon" per line (icon optional)  ⇄  NavItem[] */
export const linksToText = (links: NavItem[]) =>
  links.map((l) => `${l.label} | ${l.href}${l.icon ? ` | ${l.icon}` : ""}`).join("\n");

export function parseLinks(text: string): { links: NavItem[]; error?: string } {
  const links: NavItem[] = [];
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  for (const [i, line] of lines.entries()) {
    const parts = line.split("|").map((p) => p.trim());
    const icon = parts.length > 2 && isMenuIcon(parts[parts.length - 1]) ? (parts.pop() as string) : "";
    const href = parts.length < 2 ? "" : (parts.pop() as string);
    const label = parts.join("|").trim();
    if (!label || !href) return { links, error: `Line ${i + 1}: write it as  Label | /link` };
    if (label.length > 60) return { links, error: `Line ${i + 1}: the label is longer than 60 characters.` };
    if (!LINK.test(href)) return { links, error: `Line ${i + 1}: the link must start with / or https://` };
    links.push(icon ? { label, href, icon } : { label, href });
  }
  return { links };
}

const LINK = /^(\/[^\s]*|https?:\/\/[^\s]+)$/;

/**
 * Checks a submitted menu. Built-in items keep their type (and cannot be
 * removed — only hidden); unknown or duplicate ids are dropped.
 * Errors are keyed "<id>.<field>".
 */
export function validateMenu(
  raw: unknown
): { ok: true; items: MenuItem[] } | { ok: false; errors: Record<string, string>; message: string } {
  const errors: Record<string, string> = {};
  const list = Array.isArray(raw) ? raw : [];
  const seen = new Set<string>();
  const items: MenuItem[] = [];
  const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");

  for (const r of list) {
    const row = (r && typeof r === "object" ? r : {}) as Record<string, unknown>;
    const id = str(row.id);
    if (seen.has(id) || !(isBuiltInMenuId(id) || isCustomMenuId(id))) continue;
    seen.add(id);
    const builtIn = defaultMenu.find((d) => d.id === id);
    const type = (builtIn ? builtIn.type : str(row.type)) as MenuType;
    if (!["services", "solutions", "hire", "dropdown", "link"].includes(type)) continue;

    const label = str(row.label);
    if (!label) errors[`${id}.label`] = "Give this menu item a name.";
    else if (label.length > 24) errors[`${id}.label`] = "Use 24 characters or fewer.";

    let href = "";
    if (type === "link") {
      href = str(row.href);
      if (!href) errors[`${id}.href`] = "Add the link.";
      else if (!LINK.test(href)) errors[`${id}.href`] = "Start with / (a page on this site) or https://";
    }
    let links: NavItem[] = [];
    if (type === "dropdown") {
      const parsed = parseLinks(typeof row.linksText === "string" ? row.linksText : "");
      if (parsed.error) errors[`${id}.links`] = parsed.error;
      else if (parsed.links.length > MAX_DROPDOWN_LINKS) errors[`${id}.links`] = `Use ${MAX_DROPDOWN_LINKS} links or fewer.`;
      else if (parsed.links.length === 0) errors[`${id}.links`] = "Add at least one link, or hide this item.";
      links = parsed.links;
    }
    const icon = isMenuIcon(row.icon) ? row.icon : "";
    items.push({ id, label, type, href, links, visible: row.visible !== false, ...(icon && { icon }) });
  }

  // Built-in items missing from the submission come back (hidden items stay in the list).
  for (const d of defaultMenu) if (!seen.has(d.id)) items.push({ ...d, visible: false });

  if (items.length > MAX_MENU_ITEMS) return { ok: false, errors, message: `Use ${MAX_MENU_ITEMS} menu items or fewer.` };
  if (!items.some((i) => i.visible)) return { ok: false, errors, message: "Keep at least one menu item visible." };
  if (Object.keys(errors).length) return { ok: false, errors, message: "Please fix the highlighted fields." };
  return { ok: true, items };
}

/* ── Custom main sections (a page of their own at /s/<slug>) ─────── */

export const isMainPageSlug = (s: string) => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(s) && s.length <= 40;

export const MAIN_PAGE_DEF: SectionDef = {
  key: "mainpage",
  label: "Main section page",
  description: "The page behind a main-menu section you added: hero, a grid of cards and extra blocks.",
  canHide: false,
  fields: [
    { key: "adminName", label: "Name in the admin (not shown on the website)", kind: "text", max: 60, required: true },
    { key: "heroEyebrow", label: "Hero — small label", kind: "text", max: 60 },
    { key: "heroTitle", label: "Hero — title", kind: "text", max: 160, required: true, hint: "Wrap words in *stars* to highlight them." },
    { key: "heroDescription", label: "Hero — description", kind: "textarea", max: 400, rows: 3 },
    { key: "cardsTitle", label: "Cards — heading (optional)", kind: "text", max: 120 },
    {
      key: "cards",
      label: "Cards",
      kind: "group",
      itemLabel: "Card",
      minItems: 0,
      maxItems: 24,
      fields: [
        { key: "image", label: "Image (optional)", kind: "image", max: 300 },
        { key: "title", label: "Title", kind: "text", max: 80, required: true },
        { key: "text", label: "Text", kind: "textarea", max: 400 },
        { key: "linkLabel", label: "Link text (optional)", kind: "text", max: 40 },
        { key: "href", label: "Link (needed when there is link text)", kind: "text", max: 200, link: true },
      ],
    },
    {
      key: "blocks",
      label: "Extra blocks (below the cards)",
      kind: "group",
      itemLabel: "Block",
      minItems: 0,
      maxItems: 12,
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

export type MainPageCard = { image: string; title: string; text: string; linkLabel: string; href: string };
export type MainPageBlock = {
  eyebrow: string; title: string; description: string; image: string; imageAlt: string;
  buttonLabel: string; buttonHref: string;
};
export type MainPageContent = {
  adminName: string; heroEyebrow: string; heroTitle: string; heroDescription: string;
  cardsTitle: string; cards: MainPageCard[]; blocks: MainPageBlock[];
};

export const newMainPage = (name: string): MainPageContent => ({
  adminName: name, heroEyebrow: name, heroTitle: name, heroDescription: "Write a short introduction here.",
  cardsTitle: "", cards: [], blocks: [],
});

/** Button / link text and address must come together. */
export function checkMainPagePairs(v: Record<string, unknown>): Record<string, string> {
  const errors: Record<string, string> = {};
  const s = (x: unknown) => (typeof x === "string" ? x : "");
  (Array.isArray(v.cards) ? (v.cards as Record<string, unknown>[]) : []).forEach((c, i) => {
    if (s(c.linkLabel) && !s(c.href)) errors[`cards.${i}.href`] = "Add the link for this card.";
    if (s(c.href) && !s(c.linkLabel)) errors[`cards.${i}.linkLabel`] = "Add the link text for this card.";
  });
  (Array.isArray(v.blocks) ? (v.blocks as Record<string, unknown>[]) : []).forEach((b, i) => {
    if (s(b.buttonLabel) && !s(b.buttonHref)) errors[`blocks.${i}.buttonHref`] = "Add the link for this button.";
    if (s(b.buttonHref) && !s(b.buttonLabel)) errors[`blocks.${i}.buttonLabel`] = "Add the text for this button.";
  });
  return errors;
}
