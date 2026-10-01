// End-to-end check of the admin Hire roles page: import, validation, no-change
// save round trips (public page must be identical — including the optional
// "noun"), create, public pages, edit, drag-and-drop, unpublish, delete.
// Leaves no test data behind and restores the original order.
// Run: node --env-file=.env.local scripts/_hire-test.mjs   (BASE defaults to :3000)
import puppeteer from "puppeteer-core";

const base = process.env.BASE ?? "http://localhost:3000";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const SLUG = "zz-admin-test-role";
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
  // Wait for the background save to start AND finish before anything navigates away.
  await p.waitForFunction(() => document.body.innerText.includes("Saving order"), { timeout: 3000 }).catch(() => {});
  await p.waitForFunction(() => !document.body.innerText.includes("Saving order"), { timeout: 30000 }).catch(() => {});
  await sleep(1500);
}

async function roundTrip(slug) {
  await go("/hire/" + slug);
  const before = await text();
  await go("/admin/hire/" + slug);
  await submit();
  await p.waitForFunction(() => document.body.innerText.includes("Role saved"), { timeout: 20000 }).catch(() => {});
  const saved = (await text()).includes("Role saved");
  await go("/hire/" + slug);
  const after = await text();
  ok(`no-change save on ${slug} succeeds and leaves its public page identical`, saved && before === after);
  if (before !== after) {
    const a = before.split("\n"), c = after.split("\n");
    const i = a.findIndex((l, k) => l !== c[k]);
    console.log("  first difference at line", i, "\n   before:", a[i]?.slice(0, 120), "\n   after: ", c[i]?.slice(0, 120));
  }
}

await go("/admin/login");
await p.type("#email", process.env.ADMIN_EMAIL);
await p.type("#password", process.env.ADMIN_PASSWORD);
await Promise.all([p.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 30000 }).catch(() => {}), p.click("button[type=submit]")]);
await sleep(2500);

// ---- import
await go("/admin/hire");
if ((await text()).includes("No hire roles in the database yet")) {
  for (const bt of await p.$$("button")) {
    if ((await bt.evaluate((n) => n.textContent)).includes("Import current roles")) await bt.click();
  }
  await sleep(6000);
  await go("/admin/hire");
}
const m = (await text()).match(/(\d+) of (\d+) hire roles/);
console.log("listed:", m?.[0]);
ok("imported roles are listed", Boolean(m) && Number(m[2]) >= 12);
const original = await names();
const n = original.length;
ok("rows are draggable, no arrows", (await p.$$eval("ul.divide-y > li", (ls) => ls.every((l) => l.draggable))) && (await p.$$("button[aria-label^='Move']")).length === 0);

// ---- round trips: a normal role, and one with the optional "noun"
await roundTrip("react-developers");
await roundTrip("ui-ux-designers");

// ---- validation
await go("/admin/hire/new");
await submit();
await sleep(1200);
const errText = await text();
ok("empty form shows validation errors", errText.includes("Title is required") && errText.includes("Add at least 1 skill"));

// ---- create
const fill = async (id, v) => { await p.click(id); await p.type(id, v); };
await fill("#f-title", "ZZ Test Roles");
await fill("#f-shortLabel", "ZZ");
await fill("#f-slug", SLUG);
await fill("#f-tagline", "A role made by a test");
await fill("#f-description", "Temporary role created by the automated check.");
await fill("#f-longDescription", "First pitch paragraph.\n\nSecond pitch paragraph.");
await fill("#f-metrics", "48h | Typical time to start");
await fill("#f-skills", "Testing | Runs the tests quickly");
await fill("#f-techs", "Vitest, Playwright");
await fill("#f-engagement", "Full-time | One tester, 160 hrs a month");
await fill("#f-process", "Meet | You interview them directly");
await fill("#f-faqs", "Is it real? | No, it is a test.");
await submit();
await sleep(3000);
console.log("after create url:", p.url());
ok("created and redirected to list", p.url().includes("saved=created"));
let list = await names();
ok("new role goes to the end", list[list.length - 1] === "ZZ Test Roles" && list.length === n + 1);

// ---- public pages
await go("/hire");
ok("public /hire lists it", (await text()).includes("ZZ Test Roles"));
await go("/hire/" + SLUG);
const t = await text();
ok("public detail renders pitch, skill and FAQ", t.includes("Second pitch paragraph.") && /runs the tests quickly/i.test(t) && /is it real/i.test(t));
await go("/");
ok("home page renders", (await text()).length > 500);

// ---- edit
await go("/admin/hire/" + SLUG);
await p.click("#f-description");
await p.keyboard.press("End");
await p.type("#f-description", " EDITED description");
await submit();
await p.waitForFunction(() => document.body.innerText.includes("Role saved"), { timeout: 20000 }).catch(() => {});
ok("edit saved message", (await text()).includes("Role saved"));
await go("/hire/" + SLUG);
ok("public shows edited description", /edited description/i.test(await text()));

// ---- drag and drop
await go("/admin/hire");
list = await names();
await dragRow(list.length - 1, 0, "top");
await go("/admin/hire");
list = await names();
ok("dragged last -> first, saved after reload", list[0] === "ZZ Test Roles");
await go("/admin/hire");
await dragRow(0, list.length - 1, "bottom");
await go("/admin/hire");
list = await names();
ok("dragged first -> last, saved after reload", list[list.length - 1] === "ZZ Test Roles");

// ---- unpublish, then delete
await p.click(`button[aria-label^="Unpublish ZZ Test Roles"]`);
await p.waitForFunction(() => !!document.querySelector('button[aria-label^="Publish ZZ Test Roles"]'), { timeout: 20000 }).catch(() => {});
await sleep(1500);
// A revalidated page can serve one stale copy while it regenerates, so poll briefly.
let gone = false;
for (let i = 0; i < 6 && !gone; i++) {
  await go("/hire/" + SLUG);
  gone = !(await text()).includes("Second pitch paragraph.");
}
ok("unpublished role is not public", gone);
await go("/admin/hire");
await p.click(`button[aria-label^="Delete ZZ Test Roles"]`);
await sleep(3000);
await go("/admin/hire");
list = await names();
ok("deleted, and original order intact", JSON.stringify(list) === JSON.stringify(original));
await b.close();
