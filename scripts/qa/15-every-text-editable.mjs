// Every text on every public page can be changed in Admin → Pages & text.
// Reads each page in the sitemap the way the admin's editor does (scanHtml),
// saves an override for every text, image description and input hint at once
// (a marker in front of the original), waits for the pages to refresh, then
// reads them again: anything still showing without the marker can't be edited
// there. Restores the saved overrides at the end. QA database only:
//   node scripts/qa/15-every-text-editable.mjs
// (Node 22.6+ runs the TypeScript scanner directly.)
import { MongoClient } from "mongodb";
import { BASE, ENV_TEXT, check, section, sleep, summary } from "./lib.mjs";
import { scanHtml } from "../../src/lib/texts-scan.ts";

const MARK = "Ⓠ";
const DB = process.env.MONGODB_DB || "ukvalley_qa";
if (!/_qa$/.test(DB)) throw new Error(`Refusing to write overrides to "${DB}": use a *_qa database.`);
const uri = ENV_TEXT.match(/^MONGODB_URI=(.*)$/m)?.[1]?.trim();
const client = new MongoClient(uri);
const col = client.db(DB).collection("texts");

// Same rule as the admin's save: an original that looks like an address may be
// an href or src somewhere, so it only takes another address.
const ADDRESS_LIKE = /^(\/|https?:\/\/|mailto:|tel:)/i;
const EDITABLE = new Set(["text", "alt", "hint"]);

// The "Page not found" screen is edited at /404 (see NOT_FOUND_PATH in the admin's scan.ts).
const NOT_FOUND = "/404";
const fetchHtml = async (path) => {
  const r = await fetch(BASE + path, { cache: "no-store", redirect: "manual" });
  const ok = r.status === (path === NOT_FOUND ? 404 : 200);
  return { status: r.status, ok, html: ok ? await r.text() : "" };
};

section("Pages");
const xml = (await fetchHtml("/sitemap.xml")).html;
const paths = ["/", NOT_FOUND, ...[...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname)]
  .filter((p, i, a) => a.indexOf(p) === i);
check("sitemap lists pages", paths.length > 50, String(paths.length));

const before = new Map();
for (const p of paths) {
  const { status, ok, html } = await fetchHtml(p);
  if (!ok) {
    check(`${p} opens`, false, String(status));
    continue;
  }
  before.set(p, scanHtml(html).filter((i) => EDITABLE.has(i.kind) && !ADDRESS_LIKE.test(i.value)));
}
const originals = [...new Set([...before.values()].flat().map((i) => i.value))];
console.log(`  ${before.size} pages, ${originals.length} distinct texts`);

section("Override every text");
const saved = await col.findOne({ _id: "overrides" });
try {
  await col.updateOne(
    { _id: "overrides" },
    { $set: { items: originals.map((o) => ({ o, r: MARK + o })), updatedAt: new Date() }, $inc: { version: 1 } },
    { upsert: true }
  );
  // The server reloads overrides every 30 s and pages re-render after 60 s:
  // wait past both, then ask twice (the first visit starts the re-render).
  console.log("  waiting for the pages to refresh…");
  await sleep(70_000);
  for (const p of before.keys()) await fetch(BASE + p, { cache: "no-store" }).catch(() => {});
  await sleep(10_000);

  section("Texts that did not change");
  const stuck = new Map();
  for (const [p, items] of before) {
    const html = (await fetchHtml(p)).html;
    const now = new Set(scanHtml(html).map((i) => `${i.kind}\u0000${i.value}`));
    const left = items.filter((i) => now.has(`${i.kind}\u0000${i.value}`) && !i.value.startsWith(MARK));
    for (const i of left) {
      const k = `${i.kind}\u0000${i.value}`;
      if (!stuck.has(k)) stuck.set(k, { ...i, pages: [] });
      stuck.get(k).pages.push(p);
    }
  }
  for (const s of stuck.values()) {
    check(`editable: [${s.kind}/${s.role}] "${s.value.slice(0, 80)}"`, false, `${s.pages.length} page(s), e.g. ${s.pages.slice(0, 3).join(" ")}`);
  }
  check("every text on every page is editable", stuck.size === 0, `${stuck.size} not editable`);
} finally {
  // Put back what was there before the test.
  if (saved) await col.replaceOne({ _id: "overrides" }, saved);
  else await col.deleteOne({ _id: "overrides" });
  await client.close();
}
summary();
