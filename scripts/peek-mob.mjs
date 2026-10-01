// Viewport-only mobile shots at scroll positions, for inspecting details.
import puppeteer from "puppeteer-core";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, "..", ".shots", "verify");

const [route, positions] = [process.argv[2], process.argv[3].split(",").map(Number)];
const label = route === "/" ? "home" : route.replace(/^\//, "").replaceAll("/", "_");

const browser = await puppeteer.launch({
  executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
  headless: "new",
  args: ["--no-sandbox", "--disable-gpu", "--force-color-profile=srgb"],
});
const page = await browser.newPage();
await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
await page.emulateMediaFeatures([
  { name: "prefers-reduced-motion", value: "reduce" },
  { name: "prefers-color-scheme", value: "light" },
]);
await page.goto(`http://localhost:3000${route}`, { waitUntil: "networkidle0", timeout: 60000 });
await new Promise((r) => setTimeout(r, 1500));
for (const y of positions) {
  await page.evaluate((top) => window.scrollTo(0, top), y);
  await new Promise((r) => setTimeout(r, 400));
  await page.screenshot({ path: path.join(OUT, `peek-${label}-y${y}.png`) });
  console.log(`saved peek-${label}-y${y}.png`);
}
await browser.close();