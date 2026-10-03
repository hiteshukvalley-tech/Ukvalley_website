import { BASE, OWNER, check, go, launch, login, logout, newPage, section, sleep, summary, text } from "./lib.mjs";

const browser = await launch();

section("Access control (not signed in)");
{
  const noFollow = (path, init = {}) => fetch(BASE + path, { redirect: "manual", ...init });
  for (const path of ["/admin", "/admin/leads", "/admin/users", "/admin/media", "/admin/migration", "/admin/settings", "/admin/leads/export"]) {
    const r = await noFollow(path);
    check(`GET ${path} redirects to login`, r.status >= 300 && r.status < 400 && (r.headers.get("location") || "").includes("/admin/login"), `${r.status} ${r.headers.get("location")}`);
  }
  const up = await noFollow("/admin/media/upload", { method: "POST", body: new FormData() });
  check("POST /admin/media/upload blocked when signed out", up.status !== 200 && up.status !== 400, String(up.status));
  const upper = await noFollow("/ADMIN");
  check("/ADMIN canonicalises to lowercase", (upper.headers.get("location") || "").endsWith("/admin"), `${upper.status} ${upper.headers.get("location")}`);
  const m1 = await fetch(BASE + "/media/zzzz");
  const m2 = await fetch(BASE + "/media/" + "a".repeat(24));
  check("/media/<bad id> → 404", m1.status === 404, String(m1.status));
  check("/media/<unknown id> → 404", m2.status === 404, String(m2.status));
  const login = await fetch(BASE + "/admin/login");
  check("login page is noindex", /noindex/.test(await login.text()));
}

section("Login");
const page = await newPage(browser);
{
  await go(page, "/admin/login");
  await page.type("#email", OWNER.email);
  await page.type("#password", "Definitely-Wrong-Pass1"); // meets the password rules, so the server checks it
  await page.click("button[type=submit]");
  await page.waitForSelector("[role=alert]", { timeout: 15000 }).catch(() => {});
  const t = await text(page);
  check("wrong password shows an error", /incorrect email (id )?or password/i.test(t));
  check("wrong password stays on login", page.url().endsWith("/admin/login"));
  check("email kept after failed login", (await page.$eval("#email", (e) => e.value)) === OWNER.email);

  await login(page);
  check("owner login lands on dashboard", page.url().endsWith("/admin"), page.url());
  const t2 = await text(page);
  check("dashboard shows Dashboard title", /Dashboard/.test(t2));
  check("dashboard shows owner email + role", t2.includes(OWNER.email) && /admin/i.test(t2));
  check("login page forwards a signed-in user", await (async () => { await go(page, "/admin/login"); return page.url().endsWith("/admin"); })());
}

section("Every admin page loads cleanly (owner)");
const adminPaths = [
  "/admin", "/admin/account", "/admin/settings", "/admin/services", "/admin/services/new", "/admin/blog", "/admin/blog/new",
  "/admin/case-studies", "/admin/case-studies/new", "/admin/products", "/admin/products/new", "/admin/solutions", "/admin/solutions/new",
  "/admin/industries", "/admin/industries/new", "/admin/hire", "/admin/hire/new", "/admin/locations", "/admin/locations/new",
  "/admin/team", "/admin/team/new", "/admin/careers", "/admin/careers/new", "/admin/testimonials", "/admin/testimonials/new",
  "/admin/faqs", "/admin/faqs/new", "/admin/process", "/admin/process/new", "/admin/tech-stack", "/admin/tech-stack/new",
  "/admin/engagement", "/admin/engagement/new", "/admin/leads", "/admin/media", "/admin/users", "/admin/users/new", "/admin/migration",
];
for (const path of adminPaths) {
  page.problems.length = 0;
  const res = await go(page, path);
  const t = await text(page);
  const issues = [];
  if (res.status() !== 200) issues.push("status " + res.status());
  if (page.url().includes("/admin/login")) issues.push("bounced to login");
  if (/Application error|Something went wrong|Unhandled|\[object Object\]|undefined/.test(t)) issues.push("error text on page");
  if (!(await page.$("h1"))) issues.push("no h1");
  if (page.problems.length) issues.push(page.problems.join(" | "));
  check(`${path}`, issues.length === 0, issues.join("; "));
}

section("Sidebar");
{
  await go(page, "/admin");
  const links = await page.$$eval("nav[aria-label=Admin] a", (as) => as.map((a) => a.getAttribute("href")));
  check("sidebar has no 'Soon' placeholders left", !(await text(page)).includes("Soon"));
  const bad = [];
  for (const href of links) {
    const r = await fetch(BASE + href, { redirect: "manual", headers: { cookie: (await page.cookies()).map((c) => `${c.name}=${c.value}`).join("; ") } });
    if (r.status !== 200) bad.push(`${href}:${r.status}`);
  }
  check(`all ${links.length} sidebar links resolve (200)`, bad.length === 0, bad.join(", "));
}

section("Sign out");
{
  await logout(page);
  check("sign out returns to login", page.url().endsWith("/admin/login"), page.url());
  const r = await fetch(BASE + "/admin", { redirect: "manual" });
  check("session cookie cleared (no cookie → redirect)", r.status >= 300);
  await go(page, "/admin/settings");
  check("protected page bounces after sign out", page.url().endsWith("/admin/login"), page.url());
}

await browser.close();
summary();
