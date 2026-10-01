// Drags posts in the admin Blog list, checks the order is saved and that the
// public /blog page follows it, then restores the original order.
// Run: node --env-file=.env.local scripts/_blog-dnd-test.mjs   (BASE defaults to :3000)
import puppeteer from "puppeteer-core";

const base = process.env.BASE ?? "http://localhost:3000";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const b = await puppeteer.launch({
  executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
  headless: true,
});
const p = await b.newPage();
await p.setViewport({ width: 1366, height: 900 });
p.on("pageerror", (e) => console.log("pageerror:", e.message.slice(0, 200)));
const go = async (path) => { await p.goto(base + path, { waitUntil: "domcontentloaded", timeout: 60000 }); await sleep(2500); };
const ok = (label, cond) => console.log(cond ? "PASS" : "FAIL", "-", label);

await go("/admin/login");
await p.type("#email", process.env.ADMIN_EMAIL);
await p.type("#password", process.env.ADMIN_PASSWORD);
await Promise.all([p.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 30000 }).catch(() => {}), p.click("button[type=submit]")]);
await sleep(2500);

const titles = () => p.$$eval("ul.divide-y > li", (ls) => ls.map((l) => l.querySelector("a")?.textContent));

async function dragRow(from, to, where) {
  // Separate steps with small gaps, like a real drag, so React re-renders in between.
  const step = (fn, ...args) => p.evaluate(fn, ...args);
  await step((from) => {
    const src = [...document.querySelectorAll("ul.divide-y > li")][from];
    window.__dt = new DataTransfer();
    src.dispatchEvent(new DragEvent("dragstart", { bubbles: true, cancelable: true, dataTransfer: window.__dt }));
  }, from);
  await sleep(150);
  await step((to, where) => {
    const dst = [...document.querySelectorAll("ul.divide-y > li")][to];
    const r = dst.getBoundingClientRect();
    const y = where === "top" ? r.top + 2 : r.bottom - 2;
    dst.dispatchEvent(new DragEvent("dragover", { bubbles: true, cancelable: true, dataTransfer: window.__dt, clientX: r.left + 50, clientY: y }));
  }, to, where);
  await sleep(150);
  await step((to, from) => {
    const lis = [...document.querySelectorAll("ul.divide-y > li")];
    lis[to].dispatchEvent(new DragEvent("drop", { bubbles: true, cancelable: true, dataTransfer: window.__dt }));
    lis[from].dispatchEvent(new DragEvent("dragend", { bubbles: true, cancelable: true, dataTransfer: window.__dt }));
  }, to, from);
  // Wait for the background save to finish before anything reloads the page.
  await p.waitForFunction(() => !document.body.innerText.includes("Saving order"), { timeout: 15000 }).catch(() => {});
  await sleep(1500);
}

await go("/admin/blog");
const original = await titles();
const n = original.length;
console.log("posts:", n, "| first:", original[0], "| last:", original[n - 1]);
ok("rows are draggable", await p.$$eval("ul.divide-y > li", (ls) => ls.every((l) => l.draggable)));
ok("no arrow buttons", (await p.$$("button[aria-label^='Move']")).length === 0);
ok("first row marked Featured", (await p.evaluate(() => document.querySelector("ul.divide-y > li").innerText)).includes("Featured"));

// last -> first
await dragRow(n - 1, 0, "top");
let now = await titles();
ok("last -> first (UI)", now[0] === original[n - 1] && now.length === n);
await go("/admin/blog");
now = await titles();
ok("order saved after reload", now[0] === original[n - 1]);

// public site follows the saved order
await go("/blog");
const blogText = await p.evaluate(() => document.body.innerText);
console.log("blog page has moved title first?", blogText.indexOf(original[n - 1]), blogText.indexOf(original[0]), /featured\s*·/i.test(blogText));
ok("public /blog features the moved post", /featured\s*·/i.test(blogText) && blogText.indexOf(original[n - 1]) < blogText.indexOf(original[0]));

// first -> last (restore)
await go("/admin/blog");
await dragRow(0, n - 1, "bottom");
await go("/admin/blog");
const restored = await titles();
ok("first -> last restores the original order", JSON.stringify(restored) === JSON.stringify(original));

// a middle move
await dragRow(0, 3, "bottom");
await go("/admin/blog");
now = await titles();
console.log("middle move result:", now.slice(0, 5).map((t) => t.slice(0, 28)));
ok("first -> after 4th (middle drop)", now[3] === original[0] && now[0] === original[1]);
await dragRow(3, 0, "top");
await go("/admin/blog");
ok("restored again", JSON.stringify(await titles()) === JSON.stringify(original));

await b.close();
