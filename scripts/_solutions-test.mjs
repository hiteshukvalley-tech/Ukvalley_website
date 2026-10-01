// End-to-end check of the admin Solutions page: import, validation, a no-change
// save round trip (public page must be identical), create with related
// pages, public pages, edit, drag-and-drop, unpublish, delete. Leaves no test
// data behind and restores the original order.
// Run: node --env-file=.env.local scripts/_solutions-test.mjs   (BASE defaults to :3000)
import puppeteer from "puppeteer-core";

const base = process.env.BASE ?? "http://localhost:3000";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const SLUG = "zz-admin-test-solution";
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
await go("/admin/solutions");
if ((await text()).includes("No solutions in the database yet")) {
  for (const bt of await p.$$("button")) {
    if ((await bt.evaluate((n) => n.textContent)).includes("Import current solutions")) await bt.click();
  }
  await sleep(6000);
  await go("/admin/solutions");
}
const m = (await text()).match(/(\d+) of (\d+) solutions/);
console.log("listed:", m?.[0]);
ok("imported solutions are listed", Boolean(m) && Number(m[2]) >= 12);
const original = await names();
const n = original.length;
ok("rows are draggable, no arrows", (await p.$$eval("ul.divide-y > li", (ls) => ls.every((l) => l.draggable))) && (await p.$$("button[aria-label^='Move']")).length === 0);

// ---- round trip: saving an untouched imported solution must not change its public page
await go("/solutions/crm");
const crmBefore = await text();
await go("/admin/solutions/crm");
await submit();
await sleep(3000);
ok("no-change save succeeds", (await text()).includes("Solution saved"));
await go("/solutions/crm");
const crmAfter = await text();
ok("public CRM page is identical after a no-change save", crmBefore === crmAfter);
if (crmBefore !== crmAfter) {
  const a = crmBefore.split("\n"), c = crmAfter.split("\n");
  const i = a.findIndex((l, k) => l !== c[k]);
  console.log("  first difference at line", i, "\n   before:", a[i]?.slice(0, 120), "\n   after: ", c[i]?.slice(0, 120));
}

// ---- validation
await go("/admin/solutions/new");
await submit();
await sleep(1200);
let t = await text();
ok("empty form shows validation errors", t.includes("Name is required") && t.includes("Add at least 1 feature"));

// ---- create
const fill = async (id, v) => { await p.click(id); await p.type(id, v); };
await fill("#f-name", "ZZ Test Solution");
await fill("#f-slug", SLUG);
await fill("#f-category", "Testing");
await fill("#f-tagline", "A solution made by a test");
await fill("#f-description", "Temporary solution created by the automated check.");
await fill("#f-longDescription", "First long paragraph.\n\nSecond long paragraph.");
await fill("#f-painPoints", "Slow tests | They take too long");
await fill("#f-metrics", "2x | Faster");
await fill("#f-outcomes", "Tests finish twice as fast.");
await fill("#f-features", "Speed | Makes things fast\nSafety | Keeps things safe");
await fill("#f-modules", "Runner\nReporter");
await fill("#f-bestFor", "Test teams");
await fill("#f-workflow", "Plan | We plan the work");
await fill("#f-timeSavings", "Run suite | 40 min | 20 min");
await fill("#f-quickFacts", "Timeline | 2 weeks | Fast start\nTeam | 2 people");
await fill("#f-youProvide", "A test plan");
await fill("#f-faqs", "Is it real? | No, it is a test.");
await p.click('input[name="relatedServices"][value="web-development"]');
await p.click('input[name="relatedIndustries"][value="fintech-lending"]');
await submit();
await sleep(3000);
console.log("after create url:", p.url());
ok("created and redirected to list", p.url().includes("saved=created"));
let list = await names();
ok("new solution goes to the end", list[list.length - 1] === "ZZ Test Solution" && list.length === n + 1);

// ---- public pages
await go("/solutions");
ok("public /solutions lists it", (await text()).includes("ZZ Test Solution"));
await go("/solutions/" + SLUG);
t = await text();
ok("public detail renders story, features and FAQ", t.includes("Second long paragraph.") && /makes things fast/i.test(t) && /is it real/i.test(t));
ok("related service shown", /web (&|and)? ?web app development|web development/i.test(t));
await go("/");
ok("home Explore card still renders", (await text()).length > 500);

// ---- edit: change the description; untick the related service
await go("/admin/solutions/" + SLUG);
ok("edit form remembers ticked service", await p.$eval('input[name="relatedServices"][value="web-development"]', (e) => e.checked));
await p.click("#f-description");
await p.keyboard.press("End");
await p.type("#f-description", " EDITED description");
await submit();
await sleep(3000);
ok("edit saved message", (await text()).includes("Solution saved"));
await go("/solutions/" + SLUG);
ok("public shows edited description", /edited description/i.test(await text()));

// ---- drag and drop
await go("/admin/solutions");
list = await names();
await dragRow(list.length - 1, 0, "top");
await go("/admin/solutions");
list = await names();
ok("dragged last -> first, saved after reload", list[0] === "ZZ Test Solution");
await go("/admin/solutions");
await dragRow(0, list.length - 1, "bottom");
await go("/admin/solutions");
list = await names();
ok("dragged first -> last, saved after reload", list[list.length - 1] === "ZZ Test Solution");

// ---- unpublish, then delete
await p.click(`button[aria-label^="Unpublish ZZ Test Solution"]`);
await sleep(3000);
await go("/solutions/" + SLUG);
ok("unpublished solution is not public", !(await text()).includes("Second long paragraph."));
await go("/admin/solutions");
await p.click(`button[aria-label^="Delete ZZ Test Solution"]`);
await sleep(3000);
await go("/admin/solutions");
list = await names();
ok("deleted, and original order intact", JSON.stringify(list) === JSON.stringify(original));
await b.close();
