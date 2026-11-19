// Shared helpers for the QA suites in scripts/qa/. Run against a server that
// uses a scratch database (e.g. MONGODB_DB=ukvalley_qa), never production data:
//   NEXT_DIST_DIR=.next-test MONGODB_DB=ukvalley_qa npx next start -p 3100
//   node scripts/qa/01-access-and-pages.mjs
import puppeteer from "puppeteer-core";
import { existsSync, readFileSync } from "node:fs";

export const BASE = process.env.QA_BASE || "http://localhost:3100";
const CHROME = process.env.CHROME_PATH || "C:/Program Files/Google/Chrome/Application/chrome.exe";

/** The local env file: .env.local when it has values, else .env. */
// QA_MONGODB_URI points the suites' own database checks at a local throwaway
// server (the same one the app under test uses) instead of the database in .env.local / .env.
const FILE_ENV = [".env.local", ".env"]
  .map((f) => (existsSync(f) ? readFileSync(f, "utf8") : ""))
  .find((t) => /^MONGODB_URI=/m.test(t)) ?? "";
export const ENV_TEXT = process.env.QA_MONGODB_URI
  ? FILE_ENV.replace(/^MONGODB_URI=.*$/m, `MONGODB_URI=${process.env.QA_MONGODB_URI}`) || `MONGODB_URI=${process.env.QA_MONGODB_URI}`
  : FILE_ENV;

const env = Object.fromEntries(
  ENV_TEXT
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
  // The admin asks "Are you sure?" in its own in-page dialog (not window.confirm,
  // so page.on("dialog") never fires): answer it with its confirm button, like
  // the suites expect.
  await page.evaluateOnNewDocument(() => {
    new MutationObserver(() => {
      const d = document.querySelector("[data-confirm-dialog]");
      if (d && !d.dataset.qaAnswered) {
        d.dataset.qaAnswered = "1";
        setTimeout(() => [...d.querySelectorAll("button")].pop()?.click(), 50);
      }
    }).observe(document, { childList: true, subtree: true });
  });
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

// The tab is brought to the front first: a suite with an admin and a site tab
// would otherwise drive a background tab, where Chrome pauses animation frames,
// so clicks and waitForFunction (which poll on them) hang until they time out.
export const go = async (page, path, opts = {}) => {
  await page.bringToFront();
  return page.goto(BASE + path, { waitUntil: "networkidle2", timeout: 60000, ...opts });
};

export async function login(page, creds = OWNER) {
  await go(page, "/admin/login");
  await page.type("#email", creds.email);
  await page.type("#password", creds.password);
  await Promise.all([page.waitForNavigation({ waitUntil: "networkidle2", timeout: 60000 }).catch(() => {}), page.click("button[type=submit]")]);
}

export async function logout(page) {
  // "Sign out" lives in the account menu (the name in the top bar): open it first.
  await page.evaluate(() => document.querySelector('button[aria-controls="admin-user-menu"]')?.click());
  await page.waitForSelector('#admin-user-menu button[type="submit"]', { timeout: 10000 }).catch(() => {});
  await Promise.all([
    page.waitForNavigation({ waitUntil: "networkidle2" }).catch(() => {}),
    page.evaluate(() => [...document.querySelectorAll("button")].find((b) => /sign out/i.test(b.textContent))?.click()),
  ]);
}

export const text = (page) => page.evaluate(() => document.body.innerText);

/**
 * Picks an option in an admin dropdown (AdminSelect): opens it by clicking the
 * trigger (`#id`), then clicks the option with this visible label.
 */
export async function pickOption(page, triggerSelector, label) {
  // A click that lands while the form is still re-rendering (e.g. the live email
  // preview redrawing after other fields changed) can miss: try a few times.
  const isOpen = (sel) =>
    page.evaluate((s) => {
      const t = document.querySelector(s);
      return !!t && (t.hasAttribute("data-popup-open") || t.getAttribute("aria-expanded") === "true") && !!document.querySelector('[role="option"]');
    }, sel);
  for (let attempt = 1; ; attempt++) {
    // Already open (an earlier click landed late): don't click again, that would close it.
    if (!(await isOpen(triggerSelector))) await page.click(triggerSelector);
    const open = await page
      .waitForFunction((s) => {
        const t = document.querySelector(s);
        return !!t && (t.hasAttribute("data-popup-open") || t.getAttribute("aria-expanded") === "true") && !!document.querySelector('[role="option"]');
      }, { timeout: 4000, polling: 100 }, triggerSelector)
      .then(() => true, () => false);
    if (open) break;
    if (attempt === 3) {
      const file = `${process.env.QA_SHOTS || "qa-shots"}/dropdown-failed-${triggerSelector.replace(/\W+/g, "_")}.png`;
      await page.screenshot({ path: file, fullPage: true }).catch(() => {});
      const info = await page.$eval(triggerSelector, (el) => {
        const r = el.getBoundingClientRect();
        const top = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
        return `at ${Math.round(r.x)},${Math.round(r.y)} ${Math.round(r.width)}x${Math.round(r.height)}; topmost there: ${top?.tagName}#${top?.id}.${String(top?.className).slice(0, 60)}`;
      }).catch((e) => `not found (${e.message})`);
      throw new Error(`Dropdown ${triggerSelector} did not open (${info}; screenshot ${file})`);
    }
    await sleep(500);
  }
  await page.evaluate((l) => {
    const opt = [...document.querySelectorAll('[role="option"]')].find((o) => o.textContent.trim() === l);
    if (!opt) throw new Error(`No option "${l}"`);
    opt.click();
  }, label);
  await page.waitForFunction(() => !document.querySelector('[role="listbox"]'), { timeout: 5000 }).catch(() => {});
}
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
