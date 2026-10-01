// Drives the admin Services list: drags rows via real DOM drag events and
// checks the order persists after a reload. Restores the original order.
// Run: node --env-file=.env.local scripts/_dnd-test.mjs   (BASE defaults to :3000)
import puppeteer from "puppeteer-core";

const base = process.env.BASE ?? "http://localhost:3000";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const b = await puppeteer.launch({
  executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
  headless: true,
});
const p = await b.newPage();
await p.setViewport({ width: 1366, height: 800 });
p.on("pageerror", (e) => console.log("pageerror:", e.message.slice(0, 200)));

await p.goto(base + "/admin/login", { waitUntil: "domcontentloaded", timeout: 60000 });
await sleep(2500);
await p.type("#email", process.env.ADMIN_EMAIL);
await p.type("#password", process.env.ADMIN_PASSWORD);
await Promise.all([
  p.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 30000 }).catch(() => {}),
  p.click("button[type=submit]"),
]);
await sleep(2500);
await p.goto(base + "/admin/services", { waitUntil: "domcontentloaded", timeout: 60000 });
await sleep(2500);

const titles = () =>
  p.$$eval("ul.divide-y > li", (ls) => ls.map((l) => l.querySelector("a")?.textContent));

async function dragRow(from, to, where) {
  await p.evaluate(
    (from, to, where) => {
      const lis = [...document.querySelectorAll("ul.divide-y > li")];
      const src = lis[from];
      const dst = lis[to];
      const dt = new DataTransfer();
      const r = dst.getBoundingClientRect();
      const y = where === "top" ? r.top + 2 : r.bottom - 2;
      const fire = (type, el, cy) =>
        el.dispatchEvent(
          new DragEvent(type, { bubbles: true, cancelable: true, dataTransfer: dt, clientX: r.left + 50, clientY: cy })
        );
      fire("dragstart", src, 0);
      fire("dragover", dst, y);
      fire("drop", dst, y);
      fire("dragend", src, y);
    },
    from,
    to,
    where
  );
  await sleep(3000);
}

const original = await titles();
console.log("original:", original);
console.log("draggable:", await p.$$eval("ul.divide-y > li", (ls) => ls.every((l) => l.draggable)));
console.log("arrow buttons left:", await p.$$eval("button[aria-label^='Move']", (e) => e.length));

const n = original.length;
await dragRow(n - 1, 0, "top"); // last -> first
const afterFirst = await titles();
console.log("last -> first (UI):", afterFirst[0], "| ok:", afterFirst[0] === original[n - 1]);
console.log("alerts:", await p.$$eval("[role=alert]", (e) => e.map((x) => x.textContent)));

await p.reload({ waitUntil: "domcontentloaded" });
await sleep(2500);
const persisted = await titles();
console.log("after reload first:", persisted[0], "| saved:", persisted[0] === original[n - 1]);

await dragRow(0, n - 1, "bottom"); // first -> last (restores original)
await p.reload({ waitUntil: "domcontentloaded" });
await sleep(2500);
const restored = await titles();
console.log("first -> last, after reload last:", restored[n - 1]);
console.log("original order restored:", JSON.stringify(restored) === JSON.stringify(original));

await b.close();
