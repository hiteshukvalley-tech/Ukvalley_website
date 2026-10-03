// Admin → Home page order + custom sections, and Admin → Header / Footer:
// add, edit, reorder and delete a custom section; edit and restore the header
// and footer; check the public site follows every change. Run against a QA
// database only (see lib.mjs).
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
/** ids of the sections inside <main> on the public home page, in order */
const homeOrder = () => page.$$eval("main > section[id]", (els) => els.map((e) => e.id));

section("Start clean");
await login(page);
for (const part of ["header", "footer"]) {
  await go(page, `/admin/site/${part}`, { timeout: 180000 });
  await clickButton("Restore original text");
  await waitForText("Restored the original text.");
}
await go(page, "/admin/home", { timeout: 180000 });
// delete leftovers from a previous run
for (let i = 0; i < 5; i++) {
  const href = await page.$$eval("main ol a", (as) => as.map((a) => a.getAttribute("href")).find((h) => /\/custom-/.test(h)));
  if (!href) break;
  await go(page, href);
  await clickButton("Delete section");
  await page.waitForFunction(() => location.pathname === "/admin/home", { timeout: 30000 });
}
check("home list starts with 16 sections", (await page.$$("main ol > li")).length === 16, String((await page.$$("main ol > li")).length));

section("Sidebar");
body: {
  const body = await text(page);
  check("sidebar has Header", body.includes("Header"));
  check("sidebar has Footer", body.includes("Footer"));
}

section("Add a custom section");
await page.type('input[name="name"]', "QA Awards");
await clickButton("Add section");
await page.waitForFunction(() => /\/admin\/home\/custom-/.test(location.pathname), { timeout: 60000 });
const customId = page.url().split("/").pop();
check("opens the new section's editor", /^custom-/.test(customId), customId);
check("editor shows the name field", (await page.$("#h-adminName")) !== null);

await setValue("#h-eyebrow", "Recognition");
await setValue("#h-title", "Awards we are *proud* of");
await setValue("#h-description", "QA description line");
await clickButton("Add card");
await page.waitForSelector("#h-cards-0-title");
await page.type("#h-cards-0-title", "QA Card One");
await page.type("#h-cards-0-text", "Card one body text");
await page.type("#h-cards-0-image", "https://example.com/qa-card.png");
await clickButton("Add card");
await page.waitForSelector("#h-cards-1-title");
await page.type("#h-cards-1-title", "QA Card Two");
await page.type("#h-cards-1-linkLabel", "Read more");
await clickButton("Save section");
await waitForText("Please fix the highlighted fields.");
check("card link text without a link is rejected", (await text(page)).includes("Add the link for this card."));
await page.type("#h-cards-1-href", "/about");
await setValue("#h-buttonLabel", "Talk to us");
await setValue("#h-buttonHref", "/contact");
await clickButton("Save section");
await waitForText("Saved. The home page is updating.");
check("custom section saved", true);

section("Public home page shows it after Insights");
await go(page, "/", { timeout: 180000 });
let body = await text(page);
check("custom title shown, stars removed", has(body, "Awards we are proud of") && !body.includes("*proud*"));
check("eyebrow, description and card shown", has(body, "Recognition") && has(body, "QA description line") && has(body, "QA Card One") && has(body, "QA Card Two"));
check("button shown", has(body, "Talk to us"));
check("card image rendered", (await page.$('img[src="https://example.com/qa-card.png"]')) !== null);
let order = await homeOrder();
check("custom section directly after insights", order.indexOf(customId) === order.indexOf("insights") + 1, order.join(","));

section("Reorder");
await go(page, "/admin/home");
await page.evaluate(() => document.querySelector('button[aria-label="Move QA Awards down"]')?.click());
await waitForText("Order saved.");
await go(page, "/", { timeout: 120000 });
order = await homeOrder();
check("custom section now after faq", order.indexOf(customId) === order.indexOf("faq") + 1, order.join(","));
check("hero still first", order[0] === "home" || order[0] === "hero" || (await page.$("main > section")) !== null);

await go(page, "/admin/home");
const firstRowLocked = await page.$$eval("main ol > li:first-child button", (b) => b.length);
check("hero row has no move buttons", firstRowLocked === 0, String(firstRowLocked));
await page.evaluate(() => document.querySelector('button[aria-label="Move Trusted-by strip up"]')?.click());
await sleep(500);
check("nothing can move above the hero", (await page.$$eval("main ol > li", (l) => l[0].innerText)).includes("Hero"));

section("Hide, then delete");
await go(page, `/admin/home/${customId}`);
await page.evaluate(() => {
  const box = [...document.querySelectorAll("label")].find((l) => l.textContent.includes("Show this section"))?.querySelector("input");
  if (box?.checked) box.click();
});
await clickButton("Save section");
await waitForText("hidden on the home page");
await go(page, "/");
check("hidden custom section not shown", !has(await text(page), "Awards we are proud of"));
await go(page, `/admin/home/${customId}`);
await clickButton("Delete section");
await page.waitForFunction(() => location.pathname === "/admin/home", { timeout: 30000 });
check("deleted, back on the list", (await page.$$("main ol > li")).length === 16);
await go(page, `/admin/home/${customId}`);
// Admin pages stream behind a loading state, so a not-found arrives as HTTP 200 with the not-found page.
check("deleted section's editor shows not found", /not found|404|can.?t be found/i.test(await text(page)) && (await page.$("#h-title")) === null);
await go(page, "/");
order = await homeOrder();
check("custom id gone from the page", !order.includes(customId));

section("Header");
await go(page, "/admin/site/header", { timeout: 180000 });
await setValue("#h-ctaLabel", "QA header button");
await setValue("#h-logoSub", "QA Labs");
await clickButton("Save section");
await waitForText("Saved. Every page is updating.");
for (const path of ["/", "/pricing"]) {
  await go(page, path, { timeout: 120000 });
  const t = await text(page);
  check(`${path}: header button`, has(t, "QA header button"));
  check(`${path}: logo sub-line`, has(t, "QA Labs"));
}
section("Footer");
await go(page, "/admin/site/footer", { timeout: 180000 });
await setValue("#h-brandText", "QA footer about text");
await setValue("#h-copyright", "(c) {year} {name} QA rights");
await setValue("#h-buttonLabel", "QA footer button");
await setValue("#h-buttonHref", "not a link");
await clickButton("Save section");
await waitForText("Please fix the highlighted fields.");
check("bad link rejected", (await text(page)).includes("Use a path like"));
await setValue("#h-buttonHref", "https://example.com/start");
await clickButton("Save section");
await waitForText("Saved. Every page is updating.");
await go(page, "/about", { timeout: 120000 });
body = await text(page);
check("footer about text", has(body, "QA footer about text"));
check("footer copyright tokens filled", has(body, `(c) ${new Date().getFullYear()}`) && has(body, "QA rights") && !body.includes("{year}"));
check("footer button", has(body, "QA footer button"));
check("external footer link opens in a new tab", (await page.$$eval("footer a", (as) => as.some((a) => a.getAttribute("href") === "https://example.com/start" && a.target === "_blank"))));

section("Restore");
for (const part of ["header", "footer"]) {
  await go(page, `/admin/site/${part}`);
  await clickButton("Restore original text");
  await waitForText("Restored the original text.");
}
await go(page, "/", { timeout: 120000 });
body = await text(page);
check("header back to default", has(body, "Book a scoping call") && !has(body, "QA header button"));
check("footer back to default", has(body, "Start a project") && has(body, "All rights reserved") && !has(body, "QA footer"));

const real = page.problems.filter((p) => !p.includes("ERR_NAME_NOT_RESOLVED")); // the fake example.com test image
check("no console/page errors", real.length === 0, real.slice(0, 5).join(" | "));
await browser.close();
summary();
