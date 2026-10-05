// Admin top-bar search: find any line or word on any page without opening the
// page, open the hit's editor, and see saved edits show up in later searches.
// Run against a QA database only (see lib.mjs).
import { launch, newPage, go, login, check, section, summary, text, sleep } from "./lib.mjs";

const browser = await launch();
const page = await newPage(browser, { width: 1366, height: 900 });
page.on("dialog", (d) => d.accept());
const has = (body, s) => body.toLowerCase().includes(s.toLowerCase());
const clickButton = (label) =>
  page.evaluate((l) => [...document.querySelectorAll("button")].find((b) => b.textContent.trim().startsWith(l))?.click(), label);
const waitForText = (t, ms = 60000) => page.waitForFunction((x) => document.body.innerText.includes(x), { timeout: ms }, t);

const box = 'input[aria-label="Search any text on any page"]';
const panel = "#admin-search-results";
async function search(term) {
  await page.click(box, { clickCount: 3 });
  await page.keyboard.press("Backspace");
  await page.type(box, term);
  await page.waitForFunction((sel, t) => document.querySelector(sel)?.getAttribute("data-for") === t, { timeout: 180000 }, panel, term);
  return page.$eval(panel, (p) => p.innerText);
}

section("Start clean");
await login(page);
await go(page, "/admin/texts", { timeout: 180000 });
await clickButton("Restore every page");
await waitForText("Every page text is back to the original.");

section("Search box is on every admin screen");
for (const path of ["/admin", "/admin/services", "/admin/home", "/admin/media", "/admin/menu"]) {
  await go(page, path, { timeout: 120000 });
  check(`search box on ${path}`, (await page.$(box)) !== null);
}

section("Find text without opening the page");
await go(page, "/admin", { timeout: 120000 });
await page.focus(box);
let out = await search("what we collect");
check("finds a line on the Privacy page", has(out, "What we collect") && has(out, "Privacy"), out.slice(0, 200));
check("match is highlighted", (await page.$$eval(`${panel} mark`, (m) => m.map((x) => x.textContent.toLowerCase()))).some((t) => t.includes("what we collect")));
check("shows where it is (menu section)", has(out, "Company"));

out = await search("scoping call");
check("a phrase found on several pages lists them", (await page.$$(`${panel} [role=option]`)).length >= 3, String((await page.$$(`${panel} [role=option]`)).length));

out = await search("web & web app");
check("finds a service by name (page result)", has(out, "Web & Web App Development") && has(out, "Services"));

out = await search("zzqqxxnotthere");
check("says when nothing is found", has(out, "Nothing found"));

section("Open a hit");
await search("what we collect");
await page.keyboard.press("ArrowDown");
await page.keyboard.press("Enter");
await page.waitForFunction(() => location.pathname.startsWith("/admin/texts/"), { timeout: 60000 });
const url = page.url();
check("opens the page's editor in its menu section", /\/admin\/texts\/company\?path=%2Fprivacy&q=/.test(url), url);
await page.waitForSelector("main section button");
const body = await text(page);
check("editor shows the page name", (await page.$eval("h1", (h) => h.innerText)) === "Privacy policy");
check("search is pre-filled with the term", (await page.$eval('main input[placeholder^="Search text"]', (i) => i.value)) === "what we collect");
const boxes = 'main textarea[aria-label^="All text of the section"]';
check("only matching sections are listed", await page.evaluate((b) => [...document.querySelectorAll(b)].every((t) => t.value.toLowerCase().includes("what we collect")), boxes));

section("Saved edits are searchable");
await page.evaluate((b) => {
  // a section's text is one box, one line per line on the page
  // texts in a section box are separated by an empty line
  const el = [...document.querySelectorAll(b)].find((e) => e.value.split(/\n\s*\n/).includes("What we collect"));
  const lines = el.value.split(/\n\s*\n/).map((l) => (l === "What we collect" ? "QA zebra stripes" : l));
  Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value").set.call(el, lines.join("\n\n"));
  el.dispatchEvent(new Event("input", { bubbles: true }));
}, boxes);
await clickButton("Save changes");
await waitForText("Checked on the live page");
await go(page, "/admin", { timeout: 120000 });
await page.focus(box);
out = await search("zebra stripes");
check("the edited text is found right after saving", has(out, "QA zebra stripes") && has(out, "Privacy"), out.slice(0, 160));

section("Restore");
await go(page, "/admin/texts");
await clickButton("Restore every page");
await waitForText("Every page text is back to the original.");

check("no console/page errors", page.problems.length === 0, page.problems.slice(0, 5).join(" | "));
await browser.close();
summary();
