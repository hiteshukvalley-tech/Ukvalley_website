// Reads a rendered public page and lists what the admin can change on it:
// every line of text, button/link label, alt text, link address and image,
// grouped by the page's sections and the cards inside them.
// Pure functions (no database, no fetch of its own) — see scanPage() in the
// admin for the fetching part.

export type ScanKind = "text" | "alt" | "hint" | "link" | "image";
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
  /** the whole sentence / line this piece belongs to, when it is only part of one (text with a styled word inside) */
  context: string;
  /** pieces of the same sentence share this id (0 = the piece is a whole line on its own) */
  blockId: number;
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
      // fromCodePoint throws above U+10FFFF (e.g. "&#99999999;"): keep those as written
      return Number.isFinite(code) && code >= 0 && code <= 0x10ffff ? String.fromCodePoint(code) : m;
    }
    return NAMED[e.toLowerCase()] ?? m;
  });
}

const VOID = new Set(["area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "source", "track", "wbr"]);
/** Tags that stay inside a sentence, so their text belongs to the line around them. */
const INLINE = new Set(["span", "strong", "em", "b", "i", "br", "small", "mark", "time", "code", "sup", "sub", "u", "abbr"]);
const SKIP = new Set(["script", "style", "noscript", "template", "head", "title"]);
const hasWords = (s: string) => /[\p{L}\p{N}]/u.test(s);
const clip = (s: string) => (s.length > 110 ? `${s.slice(0, 107)}…` : s);
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
  // The nearest non-inline element around each piece of text, and all the text it holds.
  const blockStack: number[] = [];
  const blockText = new Map<number, string>();
  let blockCount = 0;
  const curBlock = () => blockStack[blockStack.length - 1] ?? 0;
  const regionNow = (): ScanRegion => (stack.includes("header") ? "Header" : stack.includes("footer") ? "Footer" : "Page");

  // Everything found, in page order. Turned into the list (with repeats merged)
  // after the whole page is read, because whether a piece belongs to a sentence
  // is only known once its line is complete.
  type Occ = { kind: ScanKind; region: ScanRegion; role: string; value: string; sec: number; card: number; block: number };
  const occ: Occ[] = [];
  const add = (kind: ScanKind, region: ScanRegion, role: string, value: string) => {
    const { sec, card } = region === "Page" ? here() : { sec: 0, card: 0 };
    occ.push({ kind, region, role, value, sec, card, block: curBlock() });
  };

  let skipDepth = 0;
  // Inside a headline that is split into one span per word (data-sh-root): the
  // whole headline is one line of text, taken from its aria-label.
  let wholeAt = 0;
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
          if (wholeAt && at < wholeAt) wholeAt = 0;
          stack.length = at;
          meta.length = at;
          blockStack.length = at;
        }
        continue;
      }
      const region = regionNow();
      if (skipDepth === 0 && !wholeAt && attr(attrs, "data-sh-root") !== undefined) {
        const label = attr(attrs, "aria-label");
        if (label && hasWords(label)) add("text", region, "Heading", label);
        if (!VOID.has(name) && !/\/\s*$/.test(attrs)) wholeAt = stack.length + 1;
      }
      if (skipDepth === 0 && !wholeAt) {
        if (name === "input" || name === "textarea") {
          const hint = attr(attrs, "placeholder");
          if (hint && hasWords(hint)) add("hint", region, "Input hint", hint);
        }
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
      blockStack.push(INLINE.has(name) ? curBlock() : ++blockCount);
      if (SKIP.has(name)) skipDepth++;
      continue;
    }
    if (skipDepth > 0 || wholeAt) continue;
    // Drawings: only the words inside <text> are content, not the shapes around them.
    if (stack.includes("svg") && !stack.includes("text")) continue;
    const text = decodeEntities(whole);
    blockText.set(curBlock(), `${blockText.get(curBlock()) ?? ""} ${text}`);
    if (!hasWords(text)) continue;
    add("text", regionNow(), roleOf(stack, stack.includes("a")), text);
  }

  // Lines made of several pieces: a styled word inside a sentence, or a name
  // that comes from other data ("Why" + "Web development" + "goes wrong…").
  const piecesOf = new Map<number, Occ[]>();
  for (const o of occ) if (o.kind === "text" && o.block) piecesOf.set(o.block, [...(piecesOf.get(o.block) ?? []), o]);
  const sentenceOf = new Map<number, string>();
  for (const [blk, pieces] of piecesOf) {
    const whole = (blockText.get(blk) ?? "").replace(/\s+/g, " ").trim();
    const vals = pieces.map((p) => p.value.replace(/\s+/g, " ").trim());
    // A later piece carries on in lower case or with punctuation ("Why" + "goes wrong — and how…"),
    // or an earlier one ends mid-sentence. Side-by-side labels such as "100%" + "Code you own" are not a sentence.
    const sentence =
      vals.slice(1).some((v) => /^[a-z,.;:!?—–)]/.test(v)) || vals.slice(0, -1).some((v) => /[,:;—–]$/.test(v));
    if (!sentence || whole.length > 700 || !vals.every((v) => v && whole.includes(v))) continue;
    // Pieces are joined with a space; none belongs before punctuation.
    sentenceOf.set(blk, whole.replace(/\s+([,.;:!?%)])/g, "$1"));
  }
  // Repeats of the same text are merged — except inside a sentence, where every
  // piece stays in its place so the whole sentence can be read and edited in one card.
  for (const o of occ) {
    const ctx = o.kind === "text" ? sentenceOf.get(o.block) : undefined;
    const key = ctx ? `${o.kind}\u0000${o.value}\u0000${o.block}` : `${o.kind}\u0000${o.value}`;
    const hit = items.get(key);
    if (hit) {
      hit.count++;
      continue;
    }
    items.set(key, {
      kind: o.kind, region: o.region, role: o.role, value: o.value, count: 1,
      sectionId: o.sec, sectionTitle: "", cardId: o.card, cardTitle: "",
      context: ctx ?? "", blockId: ctx ? o.block : 0,
    });
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
