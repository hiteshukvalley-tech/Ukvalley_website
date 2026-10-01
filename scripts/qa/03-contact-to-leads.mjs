// Website → backend → admin: a public enquiry must reach the admin Leads inbox,
// and the admin must be able to triage, export and delete it.
import { BASE, check, go, launch, login, newPage, section, sleep, summary, text } from "./lib.mjs";

const browser = await launch();
const stamp = Date.now();
const EMAIL = `qa.${stamp}@example.com`;
const NAME = `QA Tester ${stamp}`;
const MSG = `=cmd|' /C calc'!A0 automated QA enquiry ${stamp}`; // also probes CSV formula injection

section("Contact form validation (browser)");
const site = await newPage(browser);
await go(site, "/contact");
await site.evaluate(() => document.querySelector("form button[type=submit]")?.click());
await sleep(500);
let t = await text(site);
check("empty submit shows validation errors", /enter your name|valid email|at least 10|agree to be contacted/i.test(t));

await site.type("#name", NAME);
await site.type("#email", "not-an-email");
await site.type("#phone", "12345");
await site.type("#message", "short");
await site.evaluate(() => document.querySelector("form button[type=submit]")?.click());
await sleep(500);
t = await text(site);
check("bad email rejected", /valid email/i.test(t));
check("bad phone rejected", /10-digit|valid/i.test(t) && /mobile/i.test(t));
check("short message rejected", /at least 10/i.test(t));
const sentEarly = await site.evaluate(() => !!document.querySelector("[role=status]"));
check("invalid form not submitted", !sentEarly);

section("Contact form submit");
await go(site, "/contact");
await site.type("#name", NAME);
await site.type("#email", EMAIL);
await site.type("#company", "QA Co");
await site.type("#phone", "+91 98765 43210");
await site.type("#message", MSG);
await site.evaluate(() => document.querySelector('input[name="consent"]').click());
await site.evaluate(() => document.querySelector("form button[type=submit]")?.click());
await site.waitForSelector("[role=status]", { timeout: 20000 }).catch(() => {});
t = await text(site);
check("success state shown", !!(await site.$("[role=status]")), t.slice(0, 120));
check("no 'unavailable' fallback", !/email app|unavailable|mailto/i.test(await site.evaluate(() => document.querySelector("[role=status]")?.innerText || "")));

section("Honeypot / duplicate");
{
  const fd = new FormData();
  fd.set("website", "http://spam.example");
  // honeypot is a server action; just confirm the page's field is hidden from users
  const hidden = await site.evaluate(() => {
    const el = document.querySelector('input[name="website"]');
    if (!el) return null;
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el.parentElement);
    return { w: r.width, h: r.height, left: r.left, vis: cs.visibility, pos: cs.position };
  });
  check("honeypot field not visible to users", !hidden || hidden.w === 0 || hidden.left < -100 || hidden.vis === "hidden" || hidden.pos === "absolute", JSON.stringify(hidden));
}

section("Admin sees the lead");
const admin = await newPage(browser);
await login(admin);
await go(admin, `/admin/leads?q=${encodeURIComponent(EMAIL)}`);
t = await text(admin);
check("lead listed in admin inbox", t.includes(NAME), t.slice(0, 150));
check("lead shows status New", /New/.test(t));

const href = await admin.evaluate((n) => [...document.querySelectorAll("a")].find((a) => a.textContent.includes(n))?.getAttribute("href"), NAME);
check("lead has detail link", !!href, String(href));
if (href) {
  await go(admin, href);
  t = await text(admin);
  check("detail shows all fields", t.includes(EMAIL) && t.includes("QA Co") && t.includes("98765"), "");
  check("detail shows source contact-page", /contact/i.test(t));

  // triage: status + note
  await admin.select("select[name=status]", "contacted").catch(() => {});
  await admin.evaluate(() => { const n = document.querySelector("textarea[name=note]"); if (n) n.value = ""; });
  await admin.type("textarea[name=note]", "QA note");
  await admin.evaluate(() => document.querySelector("form[novalidate] button[type=submit]")?.click());
  await sleep(2000);
  t = await text(admin);
  check("status/note saved", /Lead updated|saved/i.test(t), t.slice(0, 120));

  await go(admin, `/admin/leads?status=contacted&q=${encodeURIComponent(EMAIL)}`);
  check("status filter finds it under Contacted", (await text(admin)).includes(NAME));
  await go(admin, `/admin/leads?status=new&q=${encodeURIComponent(EMAIL)}`);
  check("no longer under New", !(await text(admin)).includes(NAME));
}

section("CSV export");
{
  const cookie = (await admin.cookies()).map((c) => `${c.name}=${c.value}`).join("; ");
  const r = await fetch(BASE + "/admin/leads/export", { headers: { cookie } });
  const csv = await r.text();
  check("export 200 text/csv", r.status === 200 && /text\/csv/.test(r.headers.get("content-type") || ""));
  check("export contains the lead", csv.includes(EMAIL));
  check("formula cell neutralised (leading quote)", csv.includes(`"'=cmd`) && !csv.includes(`,"=cmd`));
}

section("Delete + cleanup");
if (href) {
  await go(admin, href);
  admin.on("dialog", (d) => d.accept());
  await admin.evaluate(() => [...document.querySelectorAll("button")].find((b) => /delete/i.test(b.textContent))?.click());
  await sleep(1500);
  // some UIs use an in-page confirm dialog
  await admin.evaluate(() => [...document.querySelectorAll("[role=alertdialog] button, [role=dialog] button")].find((b) => /delete|confirm|yes/i.test(b.textContent))?.click());
  await sleep(2500);
  await go(admin, `/admin/leads?q=${encodeURIComponent(EMAIL)}`);
  check("lead deleted", !(await text(admin)).includes(NAME));
}

await browser.close();
summary();
