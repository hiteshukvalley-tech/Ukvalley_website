// End-to-end check of the admin Products page: import, validate, create, public
// pages, edit, drag-and-drop (flagship stays TeleValley), unpublishing the
// flagship, delete. Restores order/visibility and leaves no test data behind.
// Run: node --env-file=.env.local scripts/_products-test.mjs   (BASE defaults to :3000)
import puppeteer from "puppeteer-core";

const base = process.env.BASE ?? "http://localhost:3000";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const SLUG = "zz-admin-test-product";
// The admin header also has a submit button (Sign out), so target the form itself.
const SAVE = "form[novalidate] button[type=submit]";
const b = await puppeteer.launch({
  executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
  headless: true,
});
const p = await b.newPage();
await p.setViewport({ width: 1366, height: 900 });
p.on("pageerror", (e) => console.log("pageerror:", e.message.slice(0, 200)));
p.on("dialog", (d) => d.accept());
const go = async (path) => {
  const r = await p.goto(base + path, { waitUntil: "domcontentloaded", timeout: 60000 });
  await sleep(2500);
  return r?.status();
};
const text = () => p.evaluate(() => document.body.innerText);
const ok = (label, cond) => console.log(cond ? "PASS" : "FAIL", "-", label);
const submit = () => Promise.all([p.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 8000 }).catch(() => {}), p.click(SAVE)]);
const names = () => p.$$eval("ul.divide-y > li", (ls) => ls.map((l) => l.querySelector("a")?.textContent));

async function dragRow(from, to, where) {
  await p.evaluate((from) => {
    const src = [...document.querySelectorAll("ul.divide-y > li")][from];
    window.__dt = new DataTransfer();
    src.dispatchEvent(new DragEvent("dragstart", { bubbles: true, cancelable: true, dataTransfer: window.__dt }));
  }, from);
  await sleep(150);
  await p.evaluate((to, where) => {
    const dst = [...document.querySelectorAll("ul.divide-y > li")][to];
    const r = dst.getBoundingClientRect();
    const y = where === "top" ? r.top + 2 : r.bottom - 2;
    dst.dispatchEvent(new DragEvent("dragover", { bubbles: true, cancelable: true, dataTransfer: window.__dt, clientX: r.left + 50, clientY: y }));
  }, to, where);
  await sleep(150);
  await p.evaluate((to, from) => {
    const lis = [...document.querySelectorAll("ul.divide-y > li")];
    lis[to].dispatchEvent(new DragEvent("drop", { bubbles: true, cancelable: true, dataTransfer: window.__dt }));
    lis[from].dispatchEvent(new DragEvent("dragend", { bubbles: true, cancelable: true, dataTransfer: window.__dt }));
  }, to, from);
  await p.waitForFunction(() => !document.body.innerText.includes("Saving order"), { timeout: 15000 }).catch(() => {});
  await sleep(1500);
}

await go("/admin/login");
await p.type("#email", process.env.ADMIN_EMAIL);
await p.type("#password", process.env.ADMIN_PASSWORD);
await Promise.all([p.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 30000 }).catch(() => {}), p.click("button[type=submit]")]);
await sleep(2500);

// ---- import
await go("/admin/products");
if ((await text()).includes("No products in the database yet")) {
  for (const bt of await p.$$("button")) {
    if ((await bt.evaluate((n) => n.textContent)).includes("Import current products")) await bt.click();
  }
  await sleep(6000);
  await go("/admin/products");
}
const m = (await text()).match(/(\d+) of (\d+) products/);
console.log("listed:", m?.[0]);
ok("imported products are listed", Boolean(m) && Number(m[2]) >= 5);
const original = await names();
const n = original.length;
ok("TeleValley is marked as the flagship card", (await text()).includes("Flagship card"));
ok("rows are draggable, no arrows", (await p.$$eval("ul.divide-y > li", (ls) => ls.every((l) => l.draggable))) && (await p.$$("button[aria-label^='Move']")).length === 0);

// ---- validation
await go("/admin/products/new");
await submit();
await sleep(1200);
let t = await text();
ok("empty form shows validation errors", t.includes("Name is required") && t.includes("Add at least one feature"));
await p.type("#f-metricValue", "60%");
await submit();
await sleep(1200);
ok("metric needs both value and label", (await text()).includes("Enter the label too"));

// ---- create
const fill = async (id, v) => { await p.click(id); await p.type(id, v); };
await fill("#f-name", "ZZ Test Product");
await fill("#f-slug", SLUG);
await fill("#f-tagline", "A product made by a test");
await fill("#f-description", "Temporary product created by the automated check.");
await fill("#f-platform", "Web");
await fill("#f-audience", "Testers");
await fill("#f-highlights", "Fast\nSafe");
await fill("#f-metricLabel", "Faster pages");
await fill("#f-problem", "First paragraph of the problem.\n\nSecond paragraph.");
await fill("#f-features", "Speed | Makes things fast\nSafety | Keeps things safe");
await fill("#f-outcomes", "Pages load twice as fast.");
await fill("#f-useCases", "Test teams");
await fill("#f-stack", "Next.js, MongoDB");
await fill("#f-faqs", "Is it real? | No, it is a test.");
await submit();
await sleep(3000);
console.log("after create url:", p.url());
ok("created and redirected to list", p.url().includes("saved=created"));
let list = await names();
ok("new product goes to the end", list[list.length - 1] === "ZZ Test Product" && list.length === n + 1);

// ---- public pages
await go("/products");
t = await text();
ok("public /products lists it", t.includes("ZZ Test Product"));
ok("flagship card is TeleValley", /flagship product/i.test(t));
await go("/products/" + SLUG);
t = await text();
ok("public detail renders", t.includes("Second paragraph.") && /makes things fast/i.test(t) && t.includes("Faster pages"));
await go("/");
ok("home Products section shows it", (await text()).includes("ZZ Test Product"));

// ---- edit
await go("/admin/products/" + SLUG);
await p.click("#f-tagline", { clickCount: 3 });
await p.type("#f-tagline", "EDITED tagline");
await submit();
await sleep(3000);
ok("edit saved message", (await text()).includes("Product saved"));
await go("/products/" + SLUG);
ok("public shows edited tagline", /edited tagline/i.test(await text()));

// ---- drag: test product to the very top; the flagship must stay TeleValley
await go("/admin/products");
list = await names();
await dragRow(list.length - 1, 0, "top");
await go("/admin/products");
list = await names();
ok("dragged last -> first, saved after reload", list[0] === "ZZ Test Product");
await go("/products");
t = await text();
ok("TeleValley still the flagship after reorder", /flagship product/i.test(t) && t.indexOf("ZZ Test Product") > -1);
await go("/admin/products");
await dragRow(0, list.length - 1, "bottom");
await go("/admin/products");
list = await names();
ok("dragged first -> last, saved after reload", list[list.length - 1] === "ZZ Test Product");

// ---- the flagship product unpublished: pages must still render
await p.click(`button[aria-label="Unpublish TeleValley"]`);
await sleep(3000);
const status = await go("/products");
t = await text();
ok("no flagship: /products still renders every other product", status === 200 && t.includes("ZZ Test Product") && !/flagship product/i.test(t));
await go("/");
ok("no flagship: home page still renders", (await text()).includes("ZZ Test Product"));
await go("/admin/products");
await p.click(`button[aria-label="Publish TeleValley"]`);
await sleep(3000);
await go("/products");
ok("republished: flagship card is back", /flagship product/i.test(await text()));

// ---- unpublish + delete the test product
await go("/admin/products");
await p.click(`button[aria-label^="Unpublish ZZ Test Product"]`);
await sleep(3000);
await go("/products/" + SLUG);
ok("unpublished product is not public", !(await text()).includes("Second paragraph."));
await go("/admin/products");
await p.click(`button[aria-label^="Delete ZZ Test Product"]`);
await sleep(3000);
await go("/admin/products");
list = await names();
ok("deleted, and original order intact", JSON.stringify(list) === JSON.stringify(original));
await b.close();
