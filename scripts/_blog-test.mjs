// End-to-end check of the admin Blog page. Creates a temporary post, edits it,
// unpublishes it, checks the public site each time, then deletes it.
// Run: node --env-file=.env.local scripts/_blog-test.mjs   (BASE defaults to :3000)
import puppeteer from "puppeteer-core";

const base = process.env.BASE ?? "http://localhost:3000";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const SLUG = "zz-admin-test-post";
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

await go("/admin/login");
await p.type("#email", process.env.ADMIN_EMAIL);
await p.type("#password", process.env.ADMIN_PASSWORD);
await Promise.all([p.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 30000 }).catch(() => {}), p.click("button[type=submit]")]); // login form (no admin header yet)
await sleep(2500);

await go("/admin/blog");
let t = await text();
if (t.includes("No posts in the database yet")) {
  const btns = await p.$$("button");
  for (const bt of btns) if ((await bt.evaluate((n) => n.textContent)).includes("Import current posts")) await bt.click();
  await sleep(6000);
  await go("/admin/blog");
  t = await text();
}
const m = t.match(/(\d+) of (\d+) posts/);
console.log("posts listed:", m?.[0]);
ok("blog list shows imported posts", Boolean(m) && Number(m[2]) >= 27);

// create
await go("/admin/blog/new");
await p.type("#f-title", "Admin test post");
await p.type("#f-slug", SLUG);
await p.type("#f-category", "Testing");
await p.type("#f-readMinutes", "");
await p.type("#f-excerpt", "Temporary post created by the automated check.");
await p.type("#f-body", "First paragraph.\n\nSecond paragraph.");
await Promise.all([p.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 30000 }).catch(() => {}), p.click(SAVE)]);
await sleep(3000);
console.log("after create url:", p.url());
ok("redirected to list with saved flag", p.url().includes("saved=created"));
ok("new post in admin list", (await text()).includes("Admin test post"));

// validation
await go("/admin/blog/new");
await Promise.all([p.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 5000 }).catch(() => {}), p.click(SAVE)]);
await sleep(1500);
ok("empty form shows validation errors", (await text()).includes("Title is required"));

// public site
await go("/blog");
ok("public /blog lists the new post", (await text()).includes("Admin test post"));
await go("/blog/" + SLUG);
ok("public article page renders", (await text()).includes("Second paragraph."));

// edit
await go("/admin/blog/" + SLUG);
await p.click("#f-title", { clickCount: 3 });
await p.type("#f-title", "Admin test post EDITED");
await Promise.all([p.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 5000 }).catch(() => {}), p.click(SAVE)]);
await sleep(3000);
ok("edit saved message", (await text()).includes("Post saved"));
await go("/blog/" + SLUG);
ok("public shows edited title", (await text()).includes("EDITED"));

// unpublish
await go("/admin/blog");
await p.click(`button[aria-label^="Unpublish Admin test post"]`);
await sleep(3000);
await go("/blog/" + SLUG);
const gone = await text();
ok("unpublished post 404s publicly", gone.includes("404") || gone.toLowerCase().includes("not found") || !gone.includes("Second paragraph."));

// delete
await go("/admin/blog");
await p.click(`button[aria-label^="Delete Admin test post"]`);
await sleep(3000);
await go("/admin/blog");
ok("deleted post removed from list", !(await text()).includes("Admin test post"));
await b.close();
