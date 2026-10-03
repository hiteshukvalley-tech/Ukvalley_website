// Admin → Page text: replace an inner page's hero text, add / reorder / remove
// extra blocks, and check the public page follows. Run against a QA database
// only (see lib.mjs).
import { launch, newPage, go, login, check, section, summary, text, sleep } from "./lib.mjs";

const browser = await launch();
const page = await newPage(browser, { width: 1366, height: 900 });
page.on("dialog", (d) => d.accept());

const clickButton = (label) =>
  page.evaluate((l) => [...document.querySelectorAll("button")].find((b) => b.textContent.trim().startsWith(l))?.click(), label);
const has = (body, s) => body.toLowerCase().includes(s.toLowerCase());
const waitForText = (t, ms = 30000) => page.waitForFunction((x) => document.body.innerText.includes(x), { timeout: ms }, t);

section("Start clean");
await login(page);
await go(page, "/admin/pages/pricing", { timeout: 180000 });
await clickButton("Restore original text");
await waitForText("Restored the page");
await go(page, "/pricing", { timeout: 120000 });
const original = await page.$eval("h1", (h) => h.innerText);
check("pricing has its built-in hero title", original.length > 3, original);

section("List and sidebar");
await go(page, "/admin/pages");
let body = await text(page);
check("lists inner pages", has(body, "About us") && has(body, "Privacy policy") && has(body, "Pricing"));

section("Edit hero + add two blocks");
await go(page, "/admin/pages/pricing");
await page.type("#h-heroTitle", "QA *pricing* headline");
await page.type("#h-heroEyebrow", "QA eyebrow");
await clickButton("Add block");
await page.waitForSelector("#h-blocks-0-title");
await page.type("#h-blocks-0-title", "QA first block");
await page.type("#h-blocks-0-description", "First block body");
await clickButton("Add block");
await page.waitForSelector("#h-blocks-1-title");
await page.type("#h-blocks-1-title", "QA second block");
await page.type("#h-blocks-1-buttonLabel", "Go there");
await clickButton("Save section");
await waitForText("Please fix the highlighted fields.");
check("button text without a link is rejected", has(await text(page), "Add the link for this button."));
await page.type("#h-blocks-1-buttonHref", "/contact");
await clickButton("Save section");
await waitForText("Saved. The page is updating.");
check("saved", true);

section("Public page follows");
await go(page, "/pricing", { timeout: 120000 });
body = await text(page);
const h1 = await page.$eval("h1", (h) => h.innerText);
check("hero title replaced, stars removed", has(h1, "QA pricing headline") && !h1.includes("*"), h1);
check("hero eyebrow replaced", has(body, "QA eyebrow"));
check("blocks shown", has(body, "QA first block") && has(body, "First block body") && has(body, "QA second block") && has(body, "Go there"));
check("first block before second", body.indexOf("QA first block") < body.indexOf("QA second block"));
check("blocks sit above the footer", body.indexOf("QA second block") < body.lastIndexOf("All rights reserved"));
check("other pages untouched", !has(await (async () => { await go(page, "/about"); return text(page); })(), "QA first block"));

section("Move block, then restore");
await go(page, "/admin/pages/pricing");
await page.evaluate(() => document.querySelector('button[aria-label="Move block 1 down"]')?.click());
await clickButton("Save section");
await waitForText("Saved. The page is updating.");
await go(page, "/pricing", { timeout: 120000 });
body = await text(page);
check("order changed on the page", body.indexOf("QA second block") < body.indexOf("QA first block"));

await go(page, "/admin/pages/pricing");
await clickButton("Restore original text");
await waitForText("Restored the page");
await go(page, "/pricing", { timeout: 120000 });
body = await text(page);
check("blocks gone after restore", !has(body, "QA first block") && !has(body, "QA second block"));
check("hero title back to built-in", (await page.$eval("h1", (h) => h.innerText)) === original);

const real = page.problems.filter((p) => !p.includes("ERR_NAME_NOT_RESOLVED"));
check("no console/page errors", real.length === 0, real.slice(0, 5).join(" | "));
await browser.close();
summary();
