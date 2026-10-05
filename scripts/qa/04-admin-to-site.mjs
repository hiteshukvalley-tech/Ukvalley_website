// Admin → database → public site: regressions for the bugs fixed in the
// October 2026 QA pass. Leaves no test data behind.
//   - an admin-created service gets a working /services/<slug> page (was 404)
//   - admin text inside JSON-LD can't break out of its <script> tag (XSS)
//   - /faq shows FAQs edited in the admin (it used to read the static file)
//   - unpublished solutions drop out of the header menu instead of 404ing
import { BASE, check, go, launch, login, newPage, section, sleep, summary, text } from "./lib.mjs";

const browser = await launch();
const stamp = Date.now();
const SAVE = "form[novalidate] button[type=submit]";
const save = (page) =>
  Promise.all([page.waitForNavigation({ waitUntil: "networkidle2", timeout: 30000 }).catch(() => {}), page.click(SAVE)]);

const admin = await newPage(browser);
admin.on("dialog", (d) => d.accept()); // delete confirmations
await login(admin);

// Sections must be in the database (not on built-in defaults) for edits to apply.
async function ensureImported(path, buttonText) {
  await go(admin, path);
  const btn = await admin.evaluateHandle(
    (t) => [...document.querySelectorAll("button")].find((b) => b.textContent.includes(t)) ?? null,
    buttonText
  );
  if (await btn.evaluate((b) => !!b)) {
    await btn.click();
    await sleep(6000);
  }
}

// ---------------------------------------------------------------- services
section("Admin-created service has a public page");
const SVC = `qa-service-${stamp}`;
const SVC_TITLE = `QA Service ${stamp}`;
await ensureImported("/admin/services", "Import");
await go(admin, "/admin/services/new");
await admin.type("#f-title", SVC_TITLE);
// the slug fills itself in from the title: replace it, don't append
await admin.$eval("#f-slug", (e) => { e.value = ""; e.dispatchEvent(new Event("input", { bubbles: true })); });
await admin.type("#f-slug", SVC);
await admin.type("#f-blurb", "A temporary service created by the automated QA suite.");
await admin.type("#f-bullets", "First capability\nSecond capability");
await save(admin);
check("service created", admin.url().includes("saved=created"), admin.url());

const site = await newPage(browser);
let res = await go(site, `/services/${SVC}`);
let t = await text(site);
check("/services/<new slug> returns 200", res?.status() === 200, `status ${res?.status()}`);
check("page shows the service title", t.includes(SVC_TITLE));
check("page shows its bullets as capabilities", t.includes("Second capability"));
check("no empty 'Sound familiar?' card", !t.includes("Sound familiar?"));
check("no console/page errors", site.problems.length === 0, site.problems.join(" | "));
await go(site, "/sitemap.xml");
check("sitemap lists the new service", (await site.content()).includes(`/services/${SVC}`));

await go(admin, `/admin/services?q=${encodeURIComponent(SVC_TITLE)}`); // the list is paged: search for it
await admin.click(`button[aria-label^="Delete ${SVC_TITLE}"]`).catch(() => {});
await sleep(3000);
// fetch with no-store: the browser would answer with its cached copy (a 304).
const gone = await fetch(`${BASE}/services/${SVC}`, { cache: "no-store" });
check("deleted service 404s", gone.status === 404, `status ${gone.status}`);

// ---------------------------------------------------------------- JSON-LD XSS
section("JSON-LD cannot be broken out of");
const POST = `qa-xss-${stamp}`;
await go(admin, "/admin/blog/new");
await admin.type("#f-title", `QA xss </script><script>window.__pwned=1</script> ${stamp}`);
// the slug fills itself in from the title: replace it, don't append
await admin.$eval("#f-slug", (e) => { e.value = ""; e.dispatchEvent(new Event("input", { bubbles: true })); });
await admin.type("#f-slug", POST);
await admin.type("#f-category", "Testing");
await admin.type("#f-excerpt", "Payload </script><img src=x onerror=window.__pwned=2> test.");
await admin.type("#f-body", "Body paragraph for the injection check.");
await save(admin);
check("post with script-like title saved", admin.url().includes("saved=created"), admin.url());

await go(site, `/blog/${POST}`);
await sleep(1000);
const pwned = await site.evaluate(() => window.__pwned ?? 0);
check("injected script did not run", pwned === 0, `__pwned=${pwned}`);
const ld = await site.evaluate(() =>
  [...document.querySelectorAll('script[type="application/ld+json"]')].map((s) => {
    try {
      return JSON.parse(s.textContent).headline ?? null;
    } catch {
      return "PARSE_ERROR";
    }
  })
);
check("JSON-LD still parses", !ld.includes("PARSE_ERROR"), JSON.stringify(ld));
check("JSON-LD keeps the original text", ld.some((h) => typeof h === "string" && h.includes("</script>")));

await go(admin, `/admin/blog?q=${stamp}`); // the list is paged: search for it
await admin.click(`button[aria-label^="Delete QA xss"]`).catch(() => {});
await sleep(3000);
await go(admin, "/admin/blog");
check("xss test post cleaned up", !(await text(admin)).includes(`${stamp}`));

// ---------------------------------------------------------------- /faq
section("/faq shows admin-managed FAQs");
const Q = `QA question ${stamp}?`;
await ensureImported("/admin/faqs", "Import");
await go(admin, "/admin/faqs/new");
await admin.type("#f-q", Q);
await admin.type("#f-a", "An answer written by the automated QA suite.");
await save(admin);
check("faq created", admin.url().includes("saved=created"), admin.url());
await go(site, "/faq");
check("new FAQ appears on /faq", (await text(site)).includes(Q));
await go(site, "/");
check("new FAQ appears on the home page too", (await text(site)).includes(Q));
await go(admin, "/admin/faqs");
await admin.click(`button[aria-label^="Delete ${Q}"]`).catch(() => {});
await sleep(3000);
await go(site, "/faq");
check("deleted FAQ gone from /faq", !(await text(site)).includes(Q));

// ---------------------------------------------------------------- header menu
section("Header menu drops unpublished solutions");
await ensureImported("/admin/solutions", "Import");
await go(admin, "/admin/solutions");
const unpub = await admin.$('button[aria-label^="Unpublish POS"]');
if (unpub) {
  await unpub.click();
  await sleep(3000);
  await go(site, "/");
  const menuHasPos = await site.evaluate(() => !!document.querySelector('header a[href="/solutions/pos"]'));
  check("unpublished /solutions/pos not linked in header", !menuHasPos);
  await go(admin, "/admin/solutions");
  await admin.click('button[aria-label^="Publish POS"]').catch(() => {});
  await sleep(3000);
  await go(site, "/");
  const back = await site.evaluate(() => !!document.querySelector('header a[href="/solutions/pos"]'));
  check("re-published /solutions/pos linked again", back);
} else {
  check("found the POS solution's Unpublish button", false, "button not found");
}

await browser.close();
summary();
