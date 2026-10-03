// One-off codemod: routes the visible strings of the public server components
// through ukText() (src/lib/texts.ts) so the admin can override them.
//   node scripts/codemod-texts.mjs            # dry run: prints what it would change
//   node scripts/codemod-texts.mjs --write    # rewrites the files
// It wraps: JSX text, `{expr}` children that may be a string, text-like props
// (title, description, label, alt…), href on links and src on images.
// Idempotent: already-wrapped nodes are skipped. Server components only —
// files with "use client" (and files a client component imports) are left alone.
import ts from "typescript";
import fs from "node:fs";
import path from "node:path";

const WRITE = process.argv.includes("--write");
const root = process.cwd();
const tsconfig = ts.readConfigFile(path.join(root, "tsconfig.json"), ts.sys.readFile);
const parsed = ts.parseJsonConfigFileContent(tsconfig.config, ts.sys, root);

const norm = (p) => path.resolve(p).replace(/\\/g, "/");
const rel = (p) => path.relative(root, p).replace(/\\/g, "/");

// ── which files ────────────────────────────────────────────────────────────
const walk = (dir, out = []) => {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (/\.tsx$/.test(e.name)) out.push(p);
  }
  return out;
};
const isClient = (text) => /^\s*(?:\/\/[^\n]*\n|\/\*[\s\S]*?\*\/\s*)*["']use client["']/.test(text);

const SKIP_COMPONENTS = new Set([
  "container", "section-divider", "aurora-background", "aurora-blobs", "marked", "smart-link", "header",
  "custom-section", "page-extras", "section-heading", "breadcrumbs", "delivery-mesh",
]);
const candidates = [
  ...walk(path.join(root, "src/app")).filter((f) => !/[\\/]admin[\\/]/.test(f) && /(page|not-found)\.tsx$/.test(f)),
  ...fs.readdirSync(path.join(root, "src/components/site"))
    .filter((f) => f.endsWith(".tsx") && !SKIP_COMPONENTS.has(f.replace(/\.tsx$/, "")))
    .map((f) => path.join(root, "src/components/site", f)),
].map(norm);

// Files a client component imports run in the browser too (where the override
// map is empty) — wrapping them would make the server and browser disagree.
const allSrc = walk(path.join(root, "src")).map(norm);
const clientFiles = allSrc.filter((f) => isClient(fs.readFileSync(f, "utf8")));
const importedByClient = new Set();
for (const f of clientFiles) {
  const src = fs.readFileSync(f, "utf8");
  for (const m of src.matchAll(/from\s+["']([^"']+)["']/g)) {
    let spec = m[1];
    let target;
    if (spec.startsWith("@/")) target = norm(path.join(root, "src", spec.slice(2)));
    else if (spec.startsWith(".")) target = norm(path.join(path.dirname(f), spec));
    else continue;
    importedByClient.add(target + ".tsx");
  }
}
const files = candidates.filter((f) => !importedByClient.has(f) && !isClient(fs.readFileSync(f, "utf8")));
const skippedClientImports = candidates.filter((f) => importedByClient.has(f));

const program = ts.createProgram(parsed.fileNames, parsed.options);
const checker = program.getTypeChecker();

// ── helpers ────────────────────────────────────────────────────────────────
const ENT = {
  amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", mdash: "—", ndash: "–", hellip: "…",
  rsquo: "’", lsquo: "‘", ldquo: "“", rdquo: "”", middot: "·", bull: "•", times: "×", laquo: "«", raquo: "»",
  copy: "©", reg: "®", trade: "™", rarr: "→", larr: "←", check: "✓", deg: "°", plusmn: "±", euro: "€", pound: "£",
};
/** HTML entities as JSX decodes them; null when one is unknown (the node is then left alone). */
function decode(s) {
  let ok = true;
  const out = s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e) => {
    if (e[0] === "#") {
      const code = e[1] === "x" || e[1] === "X" ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
      return String.fromCodePoint(code);
    }
    if (e in ENT) return ENT[e];
    ok = false;
    return m;
  });
  return ok ? out : null;
}
/** JSX whitespace rules: what the browser actually receives for a JsxText. */
function cleanJsxText(raw) {
  const lines = raw.split(/\r\n|\n|\r/);
  let lastNonEmpty = 0;
  lines.forEach((l, i) => { if (/[^ \t]/.test(l)) lastNonEmpty = i; });
  let str = "";
  lines.forEach((line, i) => {
    let t = line.replace(/\t/g, " ");
    if (i !== 0) t = t.replace(/^ +/, "");
    if (i !== lines.length - 1) t = t.replace(/ +$/, "");
    if (t) {
      if (i !== lastNonEmpty) t += " ";
      str += t;
    }
  });
  return str;
}
const hasWords = (s) => /[\p{L}\p{N}]/u.test(s);

const TEXT_PROPS = new Set(["title", "alt", "eyebrow", "description", "label", "caption", "badge", "heading", "subtitle", "tagline", "cta", "text", "summary"]);
const LINK_TAGS = new Set(["Link", "SmartLink", "a"]);
const IMG_TAGS = new Set(["Image", "img"]);
const SKIP_TAGS = new Set(["script", "style"]);

function stringLike(type) {
  if (type.flags & (ts.TypeFlags.Any | ts.TypeFlags.Unknown | ts.TypeFlags.Never)) return false;
  if (type.flags & ts.TypeFlags.StringLike) return true;
  if (type.isUnion()) return type.types.some((t) => stringLike(t));
  return false;
}
const containsJsx = (node) => {
  let found = false;
  const v = (n) => {
    if (found) return;
    if (ts.isJsxElement(n) || ts.isJsxSelfClosingElement(n) || ts.isJsxFragment(n)) { found = true; return; }
    ts.forEachChild(n, v);
  };
  v(node);
  return found;
};
const isUkCall = (e) => ts.isCallExpression(e) && ts.isIdentifier(e.expression) && e.expression.text === "ukText";
const tagName = (el) => (ts.isJsxElement(el) ? el.openingElement.tagName : el.tagName).getText();

let totalWrapped = 0;
const report = [];

for (const file of files) {
  const sf = program.getSourceFile(file);
  if (!sf) continue;
  const edits = []; // { pos, end, text, order }
  let count = 0;

  const wrapRange = (node, openOrder = 0) => {
    edits.push({ pos: node.getStart(sf), end: node.getStart(sf), text: "ukText(", order: openOrder });
    edits.push({ pos: node.getEnd(), end: node.getEnd(), text: ")", order: 1 });
    count++;
  };

  const visit = (node) => {
    // JSX text children
    if (ts.isJsxText(node)) {
      const parent = node.parent;
      const ptag = ts.isJsxElement(parent) ? tagName(parent) : "";
      if (!SKIP_TAGS.has(ptag) && !node.containsOnlyTriviaWhiteSpaces) {
        const cleaned = cleanJsxText(node.getText(sf));
        const decoded = cleaned && decode(cleaned);
        if (decoded && hasWords(decoded) && !/[{}]/.test(decoded)) {
          edits.push({ pos: node.pos, end: node.end, text: `{ukText(${JSON.stringify(decoded)})}`, order: 0, replace: true });
          count++;
        }
      }
      return;
    }
    // {expr} children
    if (ts.isJsxExpression(node) && node.expression && (ts.isJsxElement(node.parent) || ts.isJsxFragment(node.parent))) {
      const e = node.expression;
      const ptag = ts.isJsxElement(node.parent) ? tagName(node.parent) : "";
      if (!SKIP_TAGS.has(ptag) && !isUkCall(e) && !containsJsx(e) && !(ts.isIdentifier(e) && e.text === "children") &&
          !(ts.isPropertyAccessExpression(e) && e.name.text === "children")) {
        const isWsLiteral = ts.isStringLiteralLike(e) && !hasWords(e.text);
        if (!isWsLiteral && stringLike(checker.getTypeAtLocation(e))) wrapRange(e);
      }
    }
    // text-like props, href on links, src on images
    if (ts.isJsxAttribute(node) && node.initializer) {
      const name = node.name.getText(sf);
      const el = node.parent.parent; // JsxOpeningElement / JsxSelfClosingElement
      const tag = el.tagName.getText(sf);
      const wanted = TEXT_PROPS.has(name) || (name === "href" && LINK_TAGS.has(tag)) || (name === "src" && IMG_TAGS.has(tag));
      if (wanted) {
        const init = node.initializer;
        if (ts.isStringLiteral(init)) {
          const val = decode(init.text);
          if (val !== null && (hasWords(val) || val.startsWith("/"))) {
            edits.push({ pos: init.getStart(sf), end: init.getEnd(), text: `{ukText(${JSON.stringify(val)})}`, order: 0, replace: true });
            count++;
          }
        } else if (ts.isJsxExpression(init) && init.expression && !isUkCall(init.expression) && !containsJsx(init.expression)) {
          if (stringLike(checker.getTypeAtLocation(init.expression))) wrapRange(init.expression);
        }
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);

  if (count === 0) continue;

  // Page files: re-render at least once a minute, so a page built before the
  // overrides loaded (or on another instance) catches up. Skip pages that set
  // their own rendering mode.
  const text = sf.getFullText();
  const isPage = /(?:^|\/)page\.tsx$/.test(rel(file));
  const needsRevalidate = isPage && !/export const (revalidate|dynamic)\b/.test(text);

  // apply edits, last first
  edits.sort((a, b) => b.pos - a.pos || b.order - a.order);
  let out = text;
  for (const e of edits) out = out.slice(0, e.pos) + e.text + out.slice(e.end);

  // import after the last import declaration
  const imports = sf.statements.filter(ts.isImportDeclaration);
  const alreadyImported = /from ["']@\/lib\/texts["']/.test(out);
  if (!alreadyImported) {
    const lastEnd = imports.length ? imports[imports.length - 1].getEnd() : 0;
    // positions shifted by earlier edits: recompute on the new text
    const m = [...out.matchAll(/^import[\s\S]*?from\s+["'][^"']+["'];?[ \t]*$/gm)].pop();
    const at = m ? m.index + m[0].length : lastEnd;
    out = out.slice(0, at) + '\nimport { ukText } from "@/lib/texts";' + out.slice(at);
  }
  if (needsRevalidate) {
    const m = [...out.matchAll(/^import[\s\S]*?from\s+["'][^"']+["'];?[ \t]*$/gm)].pop();
    const at = m.index + m[0].length;
    out = out.slice(0, at) + "\n\n// Re-render at least once a minute so admin text overrides always show up.\nexport const revalidate = 60;" + out.slice(at);
  }
  report.push(`${String(count).padStart(4)}  ${rel(file)}${needsRevalidate ? "  (+revalidate)" : ""}`);
  totalWrapped += count;
  if (WRITE) fs.writeFileSync(file, out, "utf8");
}

console.log(report.join("\n"));
console.log(`\n${totalWrapped} strings in ${report.length} files ${WRITE ? "rewritten" : "(dry run — pass --write to apply)"}`);
if (skippedClientImports.length) console.log("left alone (imported by a client component):", skippedClientImports.map(rel).join(", "));
