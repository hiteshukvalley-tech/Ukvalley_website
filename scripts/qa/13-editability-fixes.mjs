// QA: fixes from the October 2026 editability pass. Run against the scratch
// database server (see lib.mjs). Leaves no test data behind.
//   - SEO title/description fields (Admin → Page text) change <title> and the share preview
//   - every inner page has its own share preview (not the home page's)
//   - text overrides also stick in client components after hydration
//   - deep links (#section) are not reset to the top on first load
//   - the header's Solutions / Hire dropdowns follow the admin lists
import { readFileSync } from "node:fs";
import { MongoClient } from "mongodb";
import { BASE, check, go, launch, login, newPage, section, sleep, summary, text } from "./lib.mjs";

const QA_DB = process.env.QA_DB || "ukvalley_qa";
if (!QA_DB.endsWith("_qa")) throw new Error(`Refusing to run against "${QA_DB}" — use a scratch *_qa database.`);
const uri = readFileSync(".env.local", "utf8").match(/^MONGODB_URI=(.*)$/m)?.[1]?.trim();
const client = await new MongoClient(uri).connect();
const db = client.db(QA_DB);

const browser = await launch();
const page = await newPage(browser);
const meta = (p, sel) => p.$eval(sel, (e) => e.getAttribute("content")).catch(() => null);
const waitForText = (p, t, ms = 30000) => p.waitForFunction((x) => document.body.innerText.includes(x), { timeout: ms }, t);
const clickButton = (p, re) =>
  p.evaluate((src) => [...document.querySelectorAll("button")].find((b) => new RegExp(src, "i").test(b.textContent))?.click(), re.source);

try {
  section("Share preview per page");
  await go(page, "/pricing");
  const ogTitle = await meta(page, 'meta[property="og:title"]');
  const ogUrl = await meta(page, 'meta[property="og:url"]');
  check("/pricing has its own og:title", !!ogTitle && /Pricing/i.test(ogTitle), String(ogTitle));
  check("/pricing og:url is its own address", ogUrl === "https://ukvalley.com/pricing", String(ogUrl));
  await go(page, "/blog");
  check("/blog og:title differs from home", !/Custom Software, CRM, ERP & Mobile Apps/.test((await meta(page, 'meta[property="og:title"]')) ?? ""));

  section("SEO fields in Admin → Page text");
  await login(page);
  await go(page, "/admin/pages/about");
  const SEO_TITLE = `QA SEO About ${Date.now()}`;
  const SEO_DESC = "QA description for the about page, set from the admin panel SEO fields.";
  check("SEO title field present", !!(await page.$("#h-seoTitle")));
  await page.type("#h-seoTitle", SEO_TITLE);
  await page.type("#h-seoDescription", SEO_DESC);
  await clickButton(page, /Save section/);
  await waitForText(page, "Saved").catch(() => {});
  await sleep(1500);
  const site = await newPage(browser);
  await go(site, "/about");
  check("<title> uses the SEO title", (await site.title()).startsWith(SEO_TITLE), await site.title());
  check("meta description uses the SEO description", (await meta(site, 'meta[name="description"]')) === SEO_DESC);
  check("og:title uses the SEO title", (await meta(site, 'meta[property="og:title"]')) === SEO_TITLE);
  await go(page, "/admin/pages/about");
  await clickButton(page, /Restore original text/);
  await waitForText(page, "Restored").catch(() => {});
  await sleep(1500);
  await go(site, "/about");
  check("restore brings the original title back", !(await site.title()).includes("QA SEO"), await site.title());

  section("Text overrides survive hydration (client components)");
  const ORIGINAL = "How we work";
  const REPLACED = `QA eyebrow ${Date.now()}`;
  const before = (await db.collection("texts").findOne({ _id: "overrides" }))?.items ?? [];
  await db.collection("texts").updateOne(
    { _id: "overrides" },
    { $set: { items: [...before.filter((i) => i.o !== ORIGINAL), { o: ORIGINAL, r: REPLACED }], updatedAt: new Date() } },
    { upsert: true }
  );
  // the server reloads overrides every 30 s, and /process re-renders at most once a minute
  console.log("  … waiting ~75 s for the override to load and /process to re-render");
  await sleep(40000);
  await fetch(`${BASE}/process`, { cache: "no-store" });
  await sleep(35000);
  await fetch(`${BASE}/process`, { cache: "no-store" });
  await sleep(3000);
  const html = await (await fetch(`${BASE}/process`, { cache: "no-store" })).text();
  check("server HTML has the replacement", html.includes(REPLACED));
  const p2 = await newPage(browser);
  await go(p2, "/process");
  await sleep(2500);
  const shown = await text(p2);
  check("after hydration the replacement is still shown", shown.includes(REPLACED));
  check("no hydration errors", !p2.problems.some((x) => /hydrat/i.test(x)), p2.problems.join(" | "));
  await db.collection("texts").updateOne({ _id: "overrides" }, { $set: { items: before, updatedAt: new Date() } }, { upsert: true });

  section("Deep links keep their position");
  const p3 = await newPage(browser);
  await go(p3, "/careers#open-roles");
  await sleep(2500);
  const y = await p3.evaluate(() => window.scrollY);
  const top = await p3.evaluate(() => document.getElementById("open-roles")?.getBoundingClientRect().top ?? 9999);
  check("/careers#open-roles opens at the jobs section", y > 200 && Math.abs(top) < 300, `scrollY=${y} sectionTop=${Math.round(top)}`);

  section("Header dropdowns follow the admin lists");
  const solutions = await db.collection("solutions").find({ published: true }).sort({ order: 1 }).toArray();
  const hire = await db.collection("hireRoles").find({ published: true }).sort({ order: 1 }).toArray().catch(() => []);
  await go(p3, "/");
  const headerHrefs = await p3.$$eval("header a[href]", (as) => as.map((a) => a.getAttribute("href")));
  if (solutions.length) {
    const want = solutions.map((s) => `/solutions/${s._id}`);
    check("every published solution is in the header", want.every((h) => headerHrefs.includes(h)), want.filter((h) => !headerHrefs.includes(h)).join(", "));
  } else check("solutions collection read", false, "no published solutions in the scratch DB");
  if (hire.length) {
    const want = hire.map((r) => `/hire/${r._id}`);
    check("every published hire role is in the header", want.every((h) => headerHrefs.includes(h)), want.filter((h) => !headerHrefs.includes(h)).join(", "));
  }
} finally {
  await browser.close();
  await client.close();
  summary();
}
