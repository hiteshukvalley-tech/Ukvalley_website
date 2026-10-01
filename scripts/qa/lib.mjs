// Shared helpers for the QA suites in scripts/qa/. Run against a server that
// uses a scratch database (e.g. MONGODB_DB=ukvalley_qa), never production data:
//   NEXT_DIST_DIR=.next-test MONGODB_DB=ukvalley_qa npx next start -p 3100
//   node scripts/qa/01-access-and-pages.mjs
import puppeteer from "puppeteer-core";
import { readFileSync } from "node:fs";

export const BASE = process.env.QA_BASE || "http://localhost:3100";
const CHROME = process.env.CHROME_PATH || "C:/Program Files/Google/Chrome/Application/chrome.exe";

const env = Object.fromEntries(
  readFileSync(".env.local", "utf8")
    .split(/\r?\n/)
    .filter((l) => l.includes("=") && !l.startsWith("#"))
    .map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1)])
);
export const OWNER = { email: env.ADMIN_EMAIL, password: env.ADMIN_PASSWORD };

export const results = { pass: 0, fail: 0, failures: [] };
export function check(name, ok, detail = "") {
  if (ok) {
    results.pass++;
    console.log("  ✓", name);
  } else {
    results.fail++;
    results.failures.push(`${name}${detail ? " — " + detail : ""}`);
    console.log("  ✗", name, detail ? `(${detail})` : "");
  }
}
export const section = (t) => console.log(`\n## ${t}`);
export function summary() {
  console.log(`\n=== ${results.pass} passed, ${results.fail} failed ===`);
  results.failures.forEach((f) => console.log("FAIL:", f));
  process.exitCode = results.fail ? 1 : 0;
}

export async function launch() {
  return puppeteer.launch({
    executablePath: CHROME,
    headless: true,
    args: ["--no-sandbox", "--disable-gpu", "--window-size=1366,900"],
    defaultViewport: { width: 1366, height: 900 },
  });
}

/** A page that records console errors, page errors and failed/4xx-5xx same-origin requests. */
export async function newPage(browser, { width = 1366, height = 900 } = {}) {
  const page = await browser.newPage();
  await page.setViewport({ width, height });
  page.problems = [];
  page.on("pageerror", (e) => page.problems.push("pageerror: " + e.message.slice(0, 200)));
  page.on("console", (m) => {
    if (m.type() === "error") page.problems.push("console: " + m.text().slice(0, 200));
  });
  page.on("response", (r) => {
    if (r.url().startsWith(BASE) && r.status() >= 400 && !r.url().includes("/not-a-real")) {
      page.problems.push(`http ${r.status()}: ${r.url().replace(BASE, "")}`);
    }
  });
  return page;
}

export const go = (page, path, opts = {}) =>
  page.goto(BASE + path, { waitUntil: "networkidle2", timeout: 60000, ...opts });

export async function login(page, creds = OWNER) {
  await go(page, "/admin/login");
  await page.type("#email", creds.email);
  await page.type("#password", creds.password);
  await Promise.all([page.waitForNavigation({ waitUntil: "networkidle2", timeout: 60000 }).catch(() => {}), page.click("button[type=submit]")]);
}

export async function logout(page) {
  await Promise.all([
    page.waitForNavigation({ waitUntil: "networkidle2" }).catch(() => {}),
    page.evaluate(() => [...document.querySelectorAll("button")].find((b) => /sign out/i.test(b.textContent))?.click()),
  ]);
}

export const text = (page) => page.evaluate(() => document.body.innerText);
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
