// Element-level screenshot: node peek-el.mjs <route> <selector> <outfile>
import puppeteer from "puppeteer-core";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const [route, sel, out] = process.argv.slice(2);

const browser = await puppeteer.launch({
  executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
  headless: "new",
  args: ["--no-sandbox", "--disable-gpu"],
});
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 1000, deviceScaleFactor: 1 });
await page.emulateMediaFeatures([
  { name: "prefers-reduced-motion", value: "reduce" },
  { name: "prefers-color-scheme", value: "light" },
]);
await page.goto(`http://localhost:3000${route}`, { waitUntil: "networkidle0", timeout: 60000 });
await new Promise((r) => setTimeout(r, 1200));
const el = await page.$(sel);
if (!el) {
  console.log("NOT FOUND: " + sel);
} else {
  await el.screenshot({ path: path.join(__dirname, "..", out) });
  console.log("saved " + out);
}
await browser.close();