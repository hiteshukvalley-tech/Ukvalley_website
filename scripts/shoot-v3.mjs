// Screenshot solutions / company / hire heroes (light + dark) for review.
import puppeteer from "puppeteer-core";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, "..", ".shots");

const shots = [
  { url: "http://localhost:3000/solutions", name: "v3-solutions" },
  { url: "http://localhost:3000/company", name: "v3-company" },
  { url: "http://localhost:3000/hire", name: "v3-hire" },
];

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
  for (const shot of shots) {
    await page.goto(shot.url, { waitUntil: "networkidle0", timeout: 60000 });
    await new Promise((r) => setTimeout(r, 2200));
    await page.screenshot({ path: path.join(OUT, `${shot.name}-${theme}.png`) });
    console.log(`saved ${shot.name}-${theme}.png`);
  }
  await page.close();
}

await browser.close();