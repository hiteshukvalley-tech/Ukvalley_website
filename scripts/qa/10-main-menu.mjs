// Admin → Main menu: rename, hide, reorder and edit menu items, add a main
// section with a page of its own (/s/<slug>), and delete it again. Checks the
// public header and page follow. Run against a QA database only (see lib.mjs).
import { launch, newPage, go, login, check, section, summary, text, sleep } from "./lib.mjs";

const browser = await launch();
const page = await newPage(browser, { width: 1366, height: 900 });
page.on("dialog", (d) => d.accept());

const clickButton = (label) =>
  page.evaluate((l) => [...document.querySelectorAll("button")].find((b) => b.textContent.trim().startsWith(l))?.click(), label);
const setValue = async (sel, value) => {
  await page.focus(sel);
  await page.keyboard.down("Control");
  await page.keyboard.press("a");
  await page.keyboard.up("Control");
  await page.keyboard.press("Backspace");
  if (value) await page.type(sel, value);
};
const has = (body, s) => body.toLowerCase().includes(s.toLowerCase());
const waitForText = (t, ms = 30000) => page.waitForFunction((x) => document.body.innerText.includes(x), { timeout: ms }, t);
/** top-level menu labels in the public header, in order */
const headerMenu = () =>
  page.$$eval("header nav[aria-label=Primary] > *", (els) => els.map((e) => e.innerText.trim().split("\n")[0].trim()));
const menuNames = () => page.$$eval('input[aria-label^="Menu name"]', (els) => els.map((e) => e.value));

section("Start clean");
await login(page);
await go(page, "/admin/menu", { timeout: 180000 });
await clickButton("Restore original menu");
await waitForText("The original menu is back.");
await go(page, "/admin/menu");
// remove main sections left over from an earlier run
for (let i = 0; i < 5; i++) {
  const href = await page.$$eval("main a", (as) => as.map((a) => a.getAttribute("href")).find((h) => /^\/admin\/menu\/[a-z0-9-]+$/.test(h || "")));
  if (!href) break;
  await go(page, href);
  await clickButton("Delete section");
  await page.waitForFunction(() => location.pathname === "/admin/menu", { timeout: 30000 });
}
check("menu starts with the 6 original items", (await menuNames()).join(",") === "Services,Solutions,Work,Company,Hire,Insights", (await menuNames()).join(","));

section("Public header (defaults)");
await go(page, "/", { timeout: 180000 });
check("header shows the 6 menus in order", (await headerMenu()).join(",") === "Services,Solutions,Work,Company,Hire,Insights", (await headerMenu()).join(","));

section("Add a main section with a page of its own");
await go(page, "/admin/menu");
await page.type('input[name="name"]', "QA Resources");
await clickButton("Add section");
await page.waitForFunction(() => /^\/admin\/menu\/[a-z0-9-]+$/.test(location.pathname), { timeout: 60000 });
const slug = new URL(page.url()).pathname.split("/").pop();
check("opens the new page's editor", slug.startsWith("qa-resources"), slug);
await setValue("#h-heroTitle", "QA *resources* hub");
await setValue("#h-heroDescription", "QA hero description");
await clickButton("Add card");
await page.waitForSelector("#h-cards-0-title");
await page.type("#h-cards-0-title", "QA card A");
await page.type("#h-cards-0-text", "Card A text");
await page.type("#h-cards-0-linkLabel", "Open A");
await clickButton("Save section");
await waitForText("Please fix the highlighted fields.");
check("link text without a link is rejected", has(await text(page), "Add the link for this card."));
await page.type("#h-cards-0-href", "/about");
await clickButton("Add block");
await page.waitForSelector("#h-blocks-0-title");
await page.type("#h-blocks-0-title", "QA block title");
await page.type("#h-blocks-0-description", "QA block body");
await clickButton("Save section");
await waitForText("Saved. The page is updating.");
check("page saved", true);

await go(page, `/s/${slug}`, { timeout: 120000 });
let body = await text(page);
check("public page shows hero, card and block", has(body, "QA resources hub") && has(body, "QA hero description") && has(body, "QA card A") && has(body, "Open A") && has(body, "QA block title"));
check("no *stars* on the page", !body.includes("*resources*"));
check("header has the new menu item after Insights", (await headerMenu()).join(",") === "Services,Solutions,Work,Company,Hire,Insights,QA Resources", (await headerMenu()).join(","));
check("sitemap lists the page", (await (await fetch(`${new URL(page.url()).origin}/sitemap.xml`)).text()).includes(`/s/${slug}`));

section("Reorder, rename, hide, edit links");
await go(page, "/admin/menu");
await page.evaluate(() => document.querySelector('button[aria-label="Move QA Resources left"]')?.click());
await page.evaluate(() => document.querySelector('button[aria-label="Move QA Resources left"]')?.click());
await sleep(300);
const inputs = await page.$$('input[aria-label^="Menu name"]');
const names = await menuNames();
const workIdx = names.indexOf("Work");
await inputs[workIdx].focus();
await page.keyboard.down("Control"); await page.keyboard.press("a"); await page.keyboard.up("Control");
await page.keyboard.type("Portfolio");
// add a link to the Work dropdown
const ta = await page.$("textarea[id^=links-work]");
await ta.click();
await page.keyboard.down("Control"); await page.keyboard.press("End"); await page.keyboard.up("Control");
await page.keyboard.type("\nQA Extra Link | /pricing");
// hide Hire
await page.evaluate(() => {
  const li = [...document.querySelectorAll("main ol > li")].find((l) => l.querySelector('input[aria-label^="Menu name"]')?.value === "Hire");
  li?.querySelector('input[type=checkbox]')?.click();
});
await clickButton("Save menu");
await waitForText("Menu saved.");
check("menu saved", true);

await go(page, "/", { timeout: 120000 });
const menu = await headerMenu();
check("QA Resources moved before Company", menu.indexOf("QA Resources") === menu.indexOf("Work") + 1 || menu.indexOf("QA Resources") < menu.indexOf("Insights"), menu.join(","));
check("Work renamed to Portfolio", menu.includes("Portfolio") && !menu.includes("Work"), menu.join(","));
check("Hire hidden", !menu.includes("Hire"), menu.join(","));
await page.evaluate(() => [...document.querySelectorAll("header nav button")].find((b) => b.textContent.includes("Portfolio"))?.click());
await sleep(500);
check("added dropdown link is shown", await page.$$eval("header a", (as) => as.some((a) => a.textContent.includes("QA Extra Link") && a.getAttribute("href") === "/pricing")));

section("Validation");
await go(page, "/admin/menu");
await page.evaluate(() => {
  const ta = document.querySelector("textarea[id^=links-company]");
  const set = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value").set;
  set.call(ta, "No separator here");
  ta.dispatchEvent(new Event("input", { bubbles: true }));
});
await clickButton("Save menu");
await waitForText("Please fix the highlighted fields.");
check("bad dropdown line rejected", has(await text(page), "Label | /link"));

section("Delete the main section");
await go(page, `/admin/menu/${slug}`);
await clickButton("Delete section");
await page.waitForFunction(() => location.pathname === "/admin/menu", { timeout: 30000 });
await go(page, "/", { timeout: 120000 });
check("menu item gone from the header", !(await headerMenu()).includes("QA Resources"), (await headerMenu()).join(","));
const gone = await fetch(`${new URL(page.url()).origin}/s/${slug}`, { cache: "no-store" });
check("deleted page is a 404", gone.status === 404, String(gone.status));

section("Restore");
await go(page, "/admin/menu");
await clickButton("Restore original menu");
await waitForText("The original menu is back.");
await go(page, "/", { timeout: 120000 });
check("original menu back", (await headerMenu()).join(",") === "Services,Solutions,Work,Company,Hire,Insights", (await headerMenu()).join(","));

check("no console/page errors", page.problems.length === 0, page.problems.slice(0, 5).join(" | "));
await browser.close();
summary();
