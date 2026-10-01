// Crawls every public URL in the sitemap on desktop + phone widths and checks
// status, console/page errors, broken images, horizontal overflow, SEO basics
// and that every internal link resolves.
import { BASE, check, go, launch, newPage, section, summary } from "./lib.mjs";

const browser = await launch();
const sm = await (await fetch(BASE + "/sitemap.xml")).text();
const urls = [...sm.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname);
const paths = [...new Set(urls)];
console.log(`sitemap: ${paths.length} URLs`);

const internal = new Map(); // href -> first page it was seen on

for (const [label, width, height] of [["desktop", 1366, 900], ["phone", 390, 844]]) {
  section(`Public pages — ${label}`);
  const page = await newPage(browser, { width, height });
  await page.setCacheEnabled(false); // avoid 304s from the previous pass
  for (const path of paths) {
    page.problems.length = 0;
    const issues = [];
    let res;
    try {
      res = await go(page, path);
    } catch (e) {
      check(path, false, "navigation failed: " + e.message.slice(0, 80));
      continue;
    }
    if (res.status() !== 200 && res.status() !== 304) issues.push("status " + res.status());
    const info = await page.evaluate(() => {
      const imgs = [...document.images].filter((i) => i.complete && i.naturalWidth === 0 && i.currentSrc).map((i) => i.currentSrc.slice(-60));
      const h1 = document.querySelectorAll("h1").length;
      const desc = document.querySelector('meta[name="description"]')?.content || "";
      const links = [...document.querySelectorAll("a[href]")].map((a) => a.getAttribute("href"));
      const body = document.body.innerText;
      return {
        imgs, h1, desc, title: document.title, links,
        overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        bad: /Application error|\[object Object\]|NaN|undefined|null\b/.test(body) ? (body.match(/.{0,30}(Application error|\[object Object\]|NaN|undefined|null\b).{0,30}/) || [""])[0] : "",
      };
    });
    if (info.imgs.length) issues.push("broken images: " + info.imgs.join(", "));
    if (info.h1 !== 1) issues.push(`h1 count ${info.h1}`);
    if (!info.title || info.title.length < 10) issues.push("weak <title>");
    if (!info.desc && path !== "/") issues.push("no meta description");
    if (info.overflow > 1) issues.push(`horizontal overflow ${info.overflow}px`);
    if (info.bad) issues.push("suspicious text: " + info.bad.replace(/\s+/g, " "));
    if (page.problems.length) issues.push([...new Set(page.problems)].slice(0, 3).join(" | "));
    check(`${path}`, issues.length === 0, issues.join("; "));
    if (label === "desktop") for (const h of info.links) if (h.startsWith("/") && !h.startsWith("//")) if (!internal.has(h)) internal.set(h, path);
  }
  await page.close();
}

section("Internal links");
const bad = [];
for (const [href, from] of internal) {
  const clean = href.split("#")[0];
  if (!clean) continue;
  const r = await fetch(BASE + clean, { redirect: "manual" });
  if (r.status >= 400) bad.push(`${href} (on ${from}) → ${r.status}`);
}
check(`${internal.size} unique internal links resolve`, bad.length === 0, bad.join("; "));

section("Misc endpoints");
check("robots.txt", (await fetch(BASE + "/robots.txt")).status === 200);
const nf = await fetch(BASE + "/definitely-not-a-page");
check("unknown URL → 404", nf.status === 404, String(nf.status));
check("404 page has a way home", /href="\/"/.test(await nf.text()));

await browser.close();
summary();
