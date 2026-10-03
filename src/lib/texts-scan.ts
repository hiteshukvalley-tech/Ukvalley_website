// Reads a rendered public page and lists what the admin can change on it:
// every line of text, button/link label, alt text, link address and image,
// grouped by the page's sections and the cards inside them.
// Pure functions (no database, no fetch of its own) — see scanPage() in the
// admin for the fetching part.

export type ScanKind = "text" | "alt" | "link" | "image";
export type ScanRegion = "Header" | "Page" | "Footer";

export type ScanItem = {
  kind: ScanKind;
  region: ScanRegion;
  /** what it is on the page: Heading, Button, Link, Text, Image… */
  role: string;
  /** exactly as rendered (text), the path (image) or the address (link) */
  value: string;
  /** how many places on this page show it */
  count: number;
  /** the page section it sits in (0 = outside any section) and that section's title */
  sectionId: number;
  sectionTitle: string;
  /** the card inside the section (0 = not in a card) and its title */
  cardId: number;
  cardTitle: string;
};

const NAMED: Record<string, string> = {
  amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", mdash: "—", ndash: "–", hellip: "…",
  rsquo: "’", lsquo: "‘", ldquo: "“", rdquo: "”", middot: "·", bull: "•", times: "×", rarr: "→", larr: "←",
  copy: "©", reg: "®", trade: "™", laquo: "«", raquo: "»", deg: "°", euro: "€", pound: "£",
};

export function decodeEntities(s: string): string {
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e: string) => {
    if (e[0] === "#") {
      const code = e[1] === "x" || e[1] === "X" ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
      return Number.isFinite(code) ? String.fromCodePoint(code) : m;
    }
    return NAMED[e.toLowerCase()] ?? m;
  });
}

const VOID = new Set(["area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "source", "track", "wbr"]);
const SKIP = new Set(["script", "style", "noscript", "template", "svg", "head", "title"]);
const hasWords = (s: string) => /[\p{L}\p{N}]/u.test(s);
const clip = (s: string) => (s.length > 70 ? `${s.slice(0, 67)}…` : s);
const isCardClass = (cls: string) => cls.split(/\s+/).some((t) => t === "card" || t.startsWith("card-"));

function attr(attrs: string, name: string): string | undefined {
  const m = new RegExp(`(?:^|\\s)${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)')`, "i").exec(attrs);
  return m ? decodeEntities(m[1] ?? m[2] ?? "") : undefined;
}

/** The real image path behind a next/image URL (/_next/image?url=%2Fx.jpg&w=…). */
function imagePath(src: string): string | null {
  let s = src;
  if (s.startsWith("/_next/image")) {
    const m = /[?&]url=([^&]+)/.exec(s);
    if (!m) return null;
    try {
      s = decodeURIComponent(m[1]);
    } catch {
      return null;
    }
  }
  return s.startsWith("/") && !s.startsWith("//") ? s : null;
}

const roleOf = (stack: string[], inAnchor: boolean): string => {
  for (let i = stack.length - 1; i >= 0; i--) {
    const t = stack[i];
    if (/^h[1-6]$/.test(t)) return "Heading";
    if (t === "button") return "Button";
    if (t === "a") return inAnchor ? "Link / button" : "Link";
    if (t === "label") return "Label";
    if (t === "li") return "List item";
    if (t === "p") return "Paragraph";
    if (t === "th" || t === "td") return "Table";
    if (t === "option") return "Option";
  }
  return "Text";
};

export function scanHtml(html: string): ScanItem[] {
  const bodyAt = html.search(/<body[\s>]/i);
  const body = bodyAt >= 0 ? html.slice(bodyAt) : html;
  const items = new Map<string, ScanItem>();

  // Section / card markers, parallel to the tag stack.
  const stack: string[] = [];
  const meta: ({ sec?: number; card?: number } | null)[] = [];
  let secCount = 0;
  let cardCount = 0;
  const here = () => {
    let sec = 0;
    let card = 0;
    for (let i = meta.length - 1; i >= 0; i--) {
      const m = meta[i];
      if (m?.card && !card) card = m.card;
      if (m?.sec) {
        sec = m.sec;
        break;
      }
    }
    return { sec, card };
  };
  const regionNow = (): ScanRegion => (stack.includes("header") ? "Header" : stack.includes("footer") ? "Footer" : "Page");

  const add = (kind: ScanKind, region: ScanRegion, role: string, value: string) => {
    const key = `${kind}\u0000${value}`;
    const hit = items.get(key);
    if (hit) {
      hit.count++;
      return;
    }
    const { sec, card } = region === "Page" ? here() : { sec: 0, card: 0 };
    items.set(key, { kind, region, role, value, count: 1, sectionId: sec, sectionTitle: "", cardId: card, cardTitle: "" });
  };

  let skipDepth = 0;
  const re = /<!--[\s\S]*?-->|<(\/?)([a-zA-Z][\w:-]*)((?:"[^"]*"|'[^']*'|[^'">])*)>|[^<]+/g;
  for (const m of body.matchAll(re)) {
    const [whole, closing, rawName, attrs = ""] = m;
    if (whole.startsWith("<!--")) continue;
    if (rawName) {
      const name = rawName.toLowerCase();
      if (closing) {
        const at = stack.lastIndexOf(name);
        if (at >= 0) {
          for (let i = stack.length - 1; i >= at; i--) if (SKIP.has(stack[i])) skipDepth--;
          stack.length = at;
          meta.length = at;
        }
        continue;
      }
      const region = regionNow();
      if (skipDepth === 0) {
        if (name === "img") {
          const p = imagePath(attr(attrs, "src") ?? "");
          if (p) add("image", region, "Image", p);
          const alt = attr(attrs, "alt");
          if (alt && hasWords(alt)) add("alt", region, "Image description", alt);
        }
      }
      if (VOID.has(name) || /\/\s*$/.test(attrs)) continue;
      let mark: { sec?: number; card?: number } | null = null;
      if (region === "Page" && skipDepth === 0) {
        if (name === "section") mark = { sec: ++secCount };
        else if (name === "article" || isCardClass(attr(attrs, "class") ?? "")) mark = { card: ++cardCount };
      }
      meta.push(mark);
      stack.push(name);
      if (SKIP.has(name)) skipDepth++;
      continue;
    }
    if (skipDepth > 0) continue;
    const text = decodeEntities(whole);
    if (!hasWords(text)) continue;
    add("text", regionNow(), roleOf(stack, stack.includes("a")), text);
  }

  // Titles: the first heading (else the first text) of each section and card.
  const list = [...items.values()];
  const firstTitle = (pick: (i: ScanItem) => boolean) => {
    const texts = list.filter((i) => pick(i) && i.kind === "text");
    const real = (v: string) => /[\p{L}]{3,}/u.test(v);
    // A heading is often split into several pieces ("Why" + "Web development"): join the first few.
    const headings = texts.filter((i) => i.role === "Heading" && real(i.value)).map((i) => i.value.trim());
    // Only join the next piece when the first is a short lead-in ("Why" + "goes wrong…"); otherwise a card's heading would leak in.
    const heading = headings.length > 1 && headings[0].length < 20 ? headings.slice(0, 2) : headings.slice(0, 1);
    const t = heading.length ? heading.join(" ") : (texts.find((i) => i.value.trim().length >= 8 && real(i.value)) ?? texts[0])?.value.trim() ?? "";
    return clip(t);
  };
  const secTitle = new Map<number, string>();
  const cardTitle = new Map<number, string>();
  for (const i of list) {
    if (i.region === "Page" && !secTitle.has(i.sectionId)) secTitle.set(i.sectionId, firstTitle((x) => x.region === "Page" && x.sectionId === i.sectionId));
    if (i.cardId && !cardTitle.has(i.cardId)) cardTitle.set(i.cardId, firstTitle((x) => x.cardId === i.cardId));
  }
  for (const i of list) {
    i.sectionTitle =
      i.region === "Header" ? "Header (menu bar)"
      : i.region === "Footer" ? "Footer"
      : i.sectionId ? secTitle.get(i.sectionId) || `Section ${i.sectionId}` : "Top of the page";
    i.cardTitle = i.cardId ? cardTitle.get(i.cardId) || `Card ${i.cardId}` : "";
  }
  return list;
}
