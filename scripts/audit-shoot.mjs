// Full-site audit shooter: for each route capture
//   <name>-desk.png  full page @1440 (light)
//   <name>-mob.png   full page @390  (light)
//   <name>-dark.png  hero viewport @1440 (dark)
// Also logs console errors, page errors, failed requests, and bad responses.
import puppeteer from "puppeteer-core";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, "..", ".shots", "audit");

const routes = process.argv.slice(2);
if (!routes.length) {
  console.error("usage: node audit-shoot.mjs <route> [route...]");
  process.exit(1);
}

const name = (r) => (r === "/" ? "home" : r.replace(/^\//, "").replaceAll("/", "_"));

const browser = await puppeteer.launch({
  executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
  headless: "new",
  args: ["--no-sandbox", "--disable-gpu", "--force-color-profile=srgb"],
});

async function newPage(theme) {
  const page = await browser.newPage();
  await page.setViewport({ width: theme === "mob" ? 390 : 1440, height: 900, deviceScaleFactor: 1 });
  if (theme === "dark") {
    await page.evaluateOnNewDocument(() => localStorage.setItem("theme", "dark"));
  }
  page.on("console", (m) => {
    if (m.type() === "error") console.log(`PAGE ${page._route} CONSOLE-ERROR: ${m.text().slice(0, 300)}`);
  });
  page.on("pageerror", (e) => console.log(`PAGE ${page._route} PAGE-ERROR: ${String(e).slice(0, 300)}`));
  page.on("requestfailed", (r) => console.log(`PAGE ${page._route} REQ-FAILED: ${r.url().slice(0, 160)} ${r.failure()?.errorText}`));
  page.on("response", (r) => {
    if (r.status() >= 400) console.log(`PAGE ${page._route} HTTP-${r.status()}: ${r.url().slice(0, 160)}`);
  });
  return page;
}

for (const route of routes) {
  for (const theme of ["desk", "mob", "dark"]) {
    const page = await newPage(theme);
    page._route = route;
    try {
      await page.goto(`http://localhost:3000${route}`, { waitUntil: "networkidle0", timeout: 60000 });
      await new Promise((r) => setTimeout(r, 1600));
      await page.screenshot({
        path: path.join(OUT, `${name(route)}-${theme}.png`),
        fullPage: theme !== "dark",
      });
      console.log(`saved ${name(route)}-${theme}.png`);
    } catch (e) {
      console.log(`PAGE ${route} SHOT-FAILED: ${String(e).slice(0, 200)}`);
    }
    await page.close();
  }
}

await browser.close();