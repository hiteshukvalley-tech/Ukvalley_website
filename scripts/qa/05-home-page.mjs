// Admin → Home page: edit, hide, validate and restore home page sections, and
// check the public home page follows. Run against a QA database only (see lib.mjs).
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

section("Start from the original text");
await login(page);
for (const key of ["hero", "trust", "cta"]) {
  await go(page, `/admin/home/${key}`, { timeout: 180000 });
  await clickButton("Restore original text");
  await waitForText("Restored the original text.");
}
check("sections restored", true);

section("Public home page (defaults)");
await go(page, "/", { timeout: 180000 });
let body = await text(page);
for (const s of [
  "Engineering systems in production",
  "Trusted by 150+ businesses",
  "Where would you like to go next",
  "disciplines, one accountable core",
  "Built to be verifiable",
  "How we are performing right now",
  "we build & run our own IP",
  "accountable for",
  "shipped real systems",
  "delivery anxiety",
  "ways to work with us",
  "The tools we reach for",
  "the first sprint",
  "engineers who build",
  "Questions buyers actually ask",
  "Book a scoping call with a software architect",
]) check(`home shows "${s}"`, has(body, s));
check("no {tokens} left on the page", !/\{(count|Count|services|solutions|caseStudies|articles|hireRoles|foundedYear|products|registration)\}/.test(body));
check("no *stars* left on the page", !/\*[A-Za-z]/.test(body));

section("Admin sidebar");
await go(page, "/admin", { timeout: 180000 });
body = await text(page);
for (const s of ["Home page", "Services", "Solutions", "Work", "Company", "Hire", "Insights", "Leads"]) { // Media is hidden from the sidebar for now (nav.ts)
  check(`sidebar has "${s}"`, body.includes(s));
}
check("roadmap box removed", !body.includes("Admin roadmap"));
check("dashboard has Home page panel", body.includes("sections,") && body.includes("edited"));

section("Home page overview");
await go(page, "/admin/home", { timeout: 180000 });
body = await text(page);
check("lists 16 sections", (await page.$$("main ol > li")).length === 16, String((await page.$$("main ol > li")).length));
check("sidebar Home page section is open", (await page.$$("#nav-home-page a")).length === 18); // overview + 16 sections + "All text & images"

section("Edit hero badge + hide trust strip");
await go(page, "/admin/home/hero", { timeout: 180000 });
check("counter under badge", (await text(page)).includes(" / 80"));
await setValue("#h-badge", "QA badge test");
check("unsaved marker shows", (await text(page)).includes("Unsaved changes"));
await clickButton("Save section");
await waitForText("Saved. The home page is updating.");
check("hero saved", true);
await sleep(1500);
check("input keeps saved value", (await page.$eval("#h-badge", (e) => e.value)) === "QA badge test");

await go(page, "/admin/home/trust");
await page.evaluate(() => {
  const box = [...document.querySelectorAll("label")].find((l) => l.textContent.includes("Show this section"))?.querySelector("input");
  if (box?.checked) box.click();
});
await clickButton("Save section");
await waitForText("hidden on the home page");
check("trust hidden + saved", true);

section("Validation");
await go(page, "/admin/home/cta");
await setValue("#h-title", "");
await clickButton("Save section");
await waitForText("Please fix the highlighted fields.");
check("required title error", (await text(page)).includes("Title is required."));

section("Public home page reflects the edits");
await go(page, "/");
body = await text(page);
check("new hero badge shown", has(body, "QA badge test"));
check("trust strip hidden", !has(body, "Trusted by 150+ businesses"));
check("cta unchanged after failed save", has(body, "Book a scoping call with a software architect — not a sales bot."));

section("Restore originals");
for (const key of ["hero", "trust", "cta"]) {
  await go(page, `/admin/home/${key}`);
  await clickButton("Restore original text");
  await waitForText("Restored the original text.");
}
await go(page, "/");
body = await text(page);
check("hero badge back to default", has(body, "Engineering systems in production") && !has(body, "QA badge test"));
check("trust strip back", has(body, "Trusted by 150+ businesses"));

check("no console/page errors", page.problems.length === 0, page.problems.slice(0, 5).join(" | "));
await browser.close();
summary();
