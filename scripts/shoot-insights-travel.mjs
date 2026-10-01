// Verify the travelling trend dot on /blog — capture it at two moments.
import puppeteer from "puppeteer-core";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, "..", ".shots");

const browser = await puppeteer.launch({
  executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
  headless: "new",
  args: ["--no-sandbox", "--disable-gpu", "--force-color-profile=srgb"],
});

const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
await page.goto("http://localhost:3000/blog", { waitUntil: "networkidle0", timeout: 60000 });
await new Promise((r) => setTimeout(r, 1200));
await page.screenshot({ path: path.join(OUT, "insights-travel-a.png") });
console.log("saved a (t≈1.2s)");
await new Promise((r) => setTimeout(r, 2300));
await page.screenshot({ path: path.join(OUT, "insights-travel-b.png") });
console.log("saved b (t≈3.5s)");
await page.close();
await browser.close();