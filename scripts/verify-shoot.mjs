// Verification shooter: emulates light color scheme + reduced motion so
// scroll-reveal sections render their final state, then captures full page.
import puppeteer from "puppeteer-core";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, "..", ".shots", "verify");

const routes = process.argv.slice(2);
if (!routes.length) {
  console.error("usage: node verify-shoot.mjs <route> [route...]");
  process.exit(1);
}

const name = (r) => (r === "/" ? "home" : r.replace(/^\//, "").replaceAll("/", "_"));

const browser = await puppeteer.launch({
  executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
  headless: "new",
  args: ["--no-sandbox", "--disable-gpu", "--force-color-profile=srgb"],
});

for (const route of routes) {
  for (const theme of ["light", "dark", "light-mob"]) {
    const page = await browser.newPage();
    await page.setViewport({
      width: theme === "light-mob" ? 390 : 1440,
      height: theme === "light-mob" ? 844 : 900,
      deviceScaleFactor: 1,
    });
    await page.emulateMediaFeatures([
      { name: "prefers-reduced-motion", value: "reduce" },
      { name: "prefers-color-scheme", value: theme },
    ]);
    page.on("pageerror", (e) => console.log(`PAGE ${route} PAGE-ERROR: ${String(e).slice(0, 300)}`));
    try {
      await page.goto(`http://localhost:3000${route}`, { waitUntil: "networkidle0", timeout: 60000 });
      await new Promise((r) => setTimeout(r, 1500));
      await page.screenshot({
        path: path.join(OUT, `${name(route)}-${theme}.png`),
        fullPage: true,
      });
      console.log(`saved verify ${name(route)}-${theme}.png`);
    } catch (e) {
      console.log(`PAGE ${route} SHOT-FAILED: ${String(e).slice(0, 200)}`);
    }
    await page.close();
  }
}

await browser.close();