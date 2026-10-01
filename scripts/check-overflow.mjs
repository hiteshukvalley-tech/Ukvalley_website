// Responsive check: crawls internal links and, for each page at several
// viewport widths, reports horizontal overflow and the elements causing it.
// usage: node scripts/check-overflow.mjs [baseUrl] [maxPages]
import puppeteer from "puppeteer-core";

const BASE = process.argv[2] || "http://localhost:3000";
const MAX = Number(process.argv[3] || 80);
const WIDTHS = [320, 375, 390, 768, 1024, 1366];

const browser = await puppeteer.launch({
  executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
  headless: "new",
  args: ["--no-sandbox", "--disable-gpu"],
});

const collect = async (page) =>
  page.evaluate(() =>
    [...document.querySelectorAll("a[href^='/']")]
      .map((a) => a.getAttribute("href").split("#")[0].split("?")[0])
      .filter((h) => h && !h.match(/\.(png|jpg|svg|ico|xml|txt)$/))
  );

const seen = new Set(["/"]);
const queue = ["/"];
const routes = [];
const p0 = await browser.newPage();
await p0.setViewport({ width: 1366, height: 900 });
while (queue.length && routes.length < MAX) {
  const r = queue.shift();
  routes.push(r);
  try {
    await p0.goto(BASE + r, { waitUntil: "networkidle2", timeout: 90000 });
    for (const h of await collect(p0)) if (!seen.has(h)) { seen.add(h); queue.push(h); }
  } catch (e) { console.log("CRAWL-FAIL", r, String(e).slice(0, 100)); }
}
await p0.close();
console.log(`checking ${routes.length} routes`);

for (const route of routes) {
  const page = await browser.newPage();
  for (const w of WIDTHS) {
    await page.setViewport({ width: w, height: 800, deviceScaleFactor: 1, isMobile: w < 700, hasTouch: w < 700 });
    try {
      await page.goto(BASE + route, { waitUntil: "networkidle2", timeout: 90000 });
      await new Promise((r) => setTimeout(r, 700));
      const res = await page.evaluate(() => {
        const vw = document.documentElement.clientWidth;
        const sw = document.documentElement.scrollWidth;
        const bad = [];
        if (sw > vw + 1) {
          for (const el of document.querySelectorAll("body *")) {
            const b = el.getBoundingClientRect();
            if (b.width && b.right > vw + 1) {
              // skip if an ancestor clips it
              let p = el.parentElement, clipped = false;
              while (p && p !== document.body) {
                const o = getComputedStyle(p).overflowX;
                if (o === "hidden" || o === "auto" || o === "scroll" || o === "clip") { clipped = true; break; }
                p = p.parentElement;
              }
              if (!clipped) bad.push(`${el.tagName.toLowerCase()}.${String(el.className).slice(0, 70)} right=${Math.round(b.right)}`);
            }
          }
        }
        return { vw, sw, bad: bad.slice(0, 5) };
      });
      if (res.sw > res.vw + 1) console.log(`OVERFLOW ${route} @${w}: scrollWidth ${res.sw} > ${res.vw}\n   ${res.bad.join("\n   ")}`);
    } catch (e) { console.log("FAIL", route, w, String(e).slice(0, 100)); }
  }
  await page.close();
}
console.log("done");
await browser.close();
