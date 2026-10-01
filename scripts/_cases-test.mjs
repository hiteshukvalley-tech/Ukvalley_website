// End-to-end check of the admin Case studies page: import, create, validate,
// public pages, edit, unpublish, drag-and-drop ordering, delete. Restores the
// original order and leaves no test data behind.
// Run: node --env-file=.env.local scripts/_cases-test.mjs   (BASE defaults to :3000)
import puppeteer from "puppeteer-core";

const base = process.env.BASE ?? "http://localhost:3000";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const SLUG = "zz-admin-test-case";
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
const go = async (path) => { await p.goto(base + path, { waitUntil: "domcontentloaded", timeout: 60000 }); await sleep(2500); };
const text = () => p.evaluate(() => document.body.innerText);
const ok = (label, cond) => console.log(cond ? "PASS" : "FAIL", "-", label);
const submit = () => Promise.all([p.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 8000 }).catch(() => {}), p.click(SAVE)]);
const titles = () => p.$$eval("ul.divide-y > li", (ls) => ls.map((l) => l.querySelector("a")?.textContent));

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
await go("/admin/case-studies");
if ((await text()).includes("No case studies in the database yet")) {
  for (const bt of await p.$$("button")) {
    if ((await bt.evaluate((n) => n.textContent)).includes("Import current case studies")) await bt.click();
  }
  await sleep(6000);
  await go("/admin/case-studies");
}
const m = (await text()).match(/(\d+) of (\d+) case studies/);
console.log("listed:", m?.[0]);
ok("imported case studies are listed", Boolean(m) && Number(m[2]) >= 12);
const original = await titles();
const n = original.length;

// ---- validation
await go("/admin/case-studies/new");
await submit();
await sleep(1200);
const errText = await text();
ok("empty form shows validation errors", errText.includes("Title is required") && errText.includes("Add at least one metric"));

// ---- create (all fields)
const fill = async (id, v) => { await p.click(id); await p.type(id, v); };
await fill("#f-title", "Admin test case study");
await fill("#f-slug", SLUG);
await fill("#f-client", "Test client");
await fill("#f-sector", "Testing");
await fill("#f-timeline", "2 weeks");
await fill("#f-team", "2 people");
await fill("#f-problem", "Something was slow.");
await fill("#f-result", "We made it fast.");
await fill("#f-metrics", "50% | Faster\n2x | Throughput");
await fill("#f-results", "Pages load twice as fast.");
await fill("#f-industryContext", "A test sector.");
await fill("#f-challenges", "Slow pages");
await fill("#f-approach", "Profile then fix");
await fill("#f-solution", "A faster system.");
await fill("#f-modules", "Cache | Adds a cache layer\nCDN | Serves static assets");
await fill("#f-stack", "Next.js, MongoDB");
await fill("#f-quote", "Great work.");
await fill("#f-quoteName", "Test Person");
await fill("#f-quoteRole", "CTO, Test Co");
await submit();
await sleep(3000);
console.log("after create url:", p.url());
ok("created and redirected to list", p.url().includes("saved=created"));
let names = await titles();
ok("new case study is first in the list", names[0] === "Admin test case study" && names.length === n + 1);

// ---- public pages
await go("/case-studies");
ok("public /case-studies lists it", (await text()).includes("Admin test case study"));
await go("/case-studies/" + SLUG);
const detail = await text();
ok("public detail renders metrics, modules and quote", /faster/i.test(detail) && detail.includes("Adds a cache layer") && detail.includes("Great work."));
await go("/");
ok("home page shows it (top 4)", (await text()).includes("Admin test case study"));

// ---- edit
await go("/admin/case-studies/" + SLUG);
await p.click("#f-title", { clickCount: 3 });
await p.type("#f-title", "Admin test case study EDITED");
await submit();
await sleep(3000);
ok("edit saved message", (await text()).includes("Case study saved"));
await go("/case-studies/" + SLUG);
ok("public shows edited title", (await text()).includes("EDITED"));

// ---- drag and drop: move the test case study (first) to the very end, then back
await go("/admin/case-studies");
const before = await titles();
await dragRow(0, before.length - 1, "bottom");
await go("/admin/case-studies");
names = await titles();
ok("dragged first -> last, saved after reload", names[names.length - 1].includes("EDITED"));
await go("/");
ok("home page no longer shows it (moved out of top 4)", !(await text()).includes("Admin test case study"));
await go("/admin/case-studies");
await dragRow(names.length - 1, 0, "top");
await go("/admin/case-studies");
names = await titles();
ok("dragged last -> first, saved after reload", names[0].includes("EDITED"));

// ---- unpublish
await p.click(`button[aria-label^="Unpublish Admin test case study"]`);
await sleep(3000);
await go("/case-studies/" + SLUG);
const gone = await text();
ok("unpublished case study is not public", !gone.includes("Adds a cache layer"));

// ---- delete
await go("/admin/case-studies");
await p.click(`button[aria-label^="Delete Admin test case study"]`);
await sleep(3000);
await go("/admin/case-studies");
names = await titles();
ok("deleted, and original order intact", JSON.stringify(names) === JSON.stringify(original));
await b.close();
