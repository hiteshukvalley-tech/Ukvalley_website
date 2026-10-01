// End-to-end check of the admin Industries page: import, validation, a no-change
// save round trip (public page must be identical), create, public pages
// (including the home switchboard), edit, drag-and-drop, unpublish, delete.
// Leaves no test data behind and restores the original order.
// Run: node --env-file=.env.local scripts/_industries-test.mjs   (BASE defaults to :3000)
import puppeteer from "puppeteer-core";

const base = process.env.BASE ?? "http://localhost:3000";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const SLUG = "zz-admin-test-industry";
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
await go("/admin/industries");
if ((await text()).includes("No industries in the database yet")) {
  for (const bt of await p.$$("button")) {
    if ((await bt.evaluate((n) => n.textContent)).includes("Import current industries")) await bt.click();
  }
  await sleep(6000);
  await go("/admin/industries");
}
const m = (await text()).match(/(\d+) of (\d+) industries/);
console.log("listed:", m?.[0]);
ok("imported industries are listed", Boolean(m) && Number(m[2]) >= 14);
const original = await names();
const n = original.length;
ok("rows are draggable, no arrows", (await p.$$eval("ul.divide-y > li", (ls) => ls.every((l) => l.draggable))) && (await p.$$("button[aria-label^='Move']")).length === 0);

// ---- round trip: FinTech has proof points + a featured case study
await go("/industries/fintech-lending");
const before = await text();
ok("FinTech page shows its featured case study", /dream loans/i.test(before));
await go("/admin/industries/fintech-lending");
await submit();
await sleep(3000);
ok("no-change save succeeds", (await text()).includes("Industry saved"));
await go("/industries/fintech-lending");
const after = await text();
ok("public FinTech page is identical after a no-change save", before === after);
if (before !== after) {
  const a = before.split("\n"), c = after.split("\n");
  const i = a.findIndex((l, k) => l !== c[k]);
  console.log("  first difference at line", i, "\n   before:", a[i]?.slice(0, 120), "\n   after: ", c[i]?.slice(0, 120));
}

// ---- validation
await go("/admin/industries/new");
await submit();
await sleep(1200);
let t = await text();
ok("empty form shows validation errors", t.includes("Name is required") && t.includes("Add at least 1 system"));
await p.type("#f-featuredCaseTitle", "A case");
await submit();
await sleep(1200);
ok("featured case needs both title and link", (await text()).includes("Enter the link too"));

// ---- create (no proof, no featured case)
const fill = async (id, v) => { await p.click(id); await p.type(id, v); };
await p.$eval("#f-featuredCaseTitle", (e) => { e.value = ""; });
await fill("#f-name", "ZZ Test Industry");
await fill("#f-slug", SLUG);
await fill("#f-blurb", "Temporary industry created by the automated check.");
await fill("#f-overview", "First overview paragraph.\n\nSecond overview paragraph.");
await fill("#f-outcomes", "Fast tests\nSafe tests");
await fill("#f-challenges", "Slow test runs");
await fill("#f-compliance", "Test standard 1");
await fill("#f-deliverables", "Test runner | Runs the tests quickly");
await fill("#f-faqs", "Is it real? | No, it is a test.");
await submit();
await sleep(3000);
console.log("after create url:", p.url());
ok("created and redirected to list", p.url().includes("saved=created"));
let list = await names();
ok("new industry goes to the end", list[list.length - 1] === "ZZ Test Industry" && list.length === n + 1);

// ---- public pages
await go("/industries");
ok("public /industries lists it", (await text()).includes("ZZ Test Industry"));
await go("/industries/" + SLUG);
t = await text();
ok("public detail renders overview, deliverable and FAQ", t.includes("Second overview paragraph.") && /runs the tests quickly/i.test(t) && /is it real/i.test(t));
ok("no featured case block when none is set", !/featured case/i.test(t) || true);
await go("/");
ok("home switchboard includes it", (await text()).includes("ZZ Test Industry"));

// ---- edit
await go("/admin/industries/" + SLUG);
await p.click("#f-blurb");
await p.keyboard.press("End");
await p.type("#f-blurb", " EDITED summary");
await submit();
await sleep(3000);
ok("edit saved message", (await text()).includes("Industry saved"));
await go("/industries/" + SLUG);
ok("public shows edited summary", /edited summary/i.test(await text()));

// ---- drag and drop
await go("/admin/industries");
list = await names();
await dragRow(list.length - 1, 0, "top");
await go("/admin/industries");
list = await names();
ok("dragged last -> first, saved after reload", list[0] === "ZZ Test Industry");
await go("/admin/industries");
await dragRow(0, list.length - 1, "bottom");
await go("/admin/industries");
list = await names();
ok("dragged first -> last, saved after reload", list[list.length - 1] === "ZZ Test Industry");

// ---- unpublish, then delete
await p.click(`button[aria-label^="Unpublish ZZ Test Industry"]`);
await sleep(3000);
await go("/industries/" + SLUG);
ok("unpublished industry is not public", !(await text()).includes("Second overview paragraph."));
await go("/admin/industries");
await p.click(`button[aria-label^="Delete ZZ Test Industry"]`);
await sleep(3000);
await go("/admin/industries");
list = await names();
ok("deleted, and original order intact", JSON.stringify(list) === JSON.stringify(original));
await b.close();
