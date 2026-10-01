// Screenshot the hire hero canvas area (light + dark) for review.
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

for (const theme of ["light", "dark"]) {
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
  if (theme === "dark") {
    await page.evaluateOnNewDocument(() => {
      localStorage.setItem("theme", "dark");
    });
  }
  await page.goto("http://localhost:3000/hire", { waitUntil: "networkidle0", timeout: 60000 });
  await new Promise((r) => setTimeout(r, 2200));
  await page.screenshot({
    path: path.join(OUT, `hire2-${theme}.png`),
    clip: { x: 940, y: 0, width: 500, height: 700 },
  });
  console.log(`saved hire2-${theme}.png`);
  await page.close();
}

await browser.close();