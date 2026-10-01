import puppeteer from "puppeteer-core";
import { mkdirSync } from "fs";

const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const URL = "http://localhost:3000/";
const OUT = "C:/Users/ADMIN/Desktop/PROJECTS/Ukvalley Website/ukvalley-web/.shots";
mkdirSync(OUT, { recursive: true });

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: "new",
  args: ["--no-sandbox", "--disable-gpu", "--force-color-profile=srgb"],
});

async function shoot(name, width, height, fullPage) {
  const page = await browser.newPage();
  await page.setViewport({ width, height, deviceScaleFactor: 2 });
  await page.goto(URL, { waitUntil: "load", timeout: 60000 });
  // let 3D canvas + fonts settle
  await new Promise((r) => setTimeout(r, 2500));
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage });
  await page.close();
  console.log(`shot ${name}.png @ ${width}x${height} fullPage=${fullPage}`);
}

await shoot("desktop-full", 1440, 900, true);
await shoot("mobile-full", 390, 844, true);

// hero-only desktop crop
{
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
  await page.goto(URL, { waitUntil: "load", timeout: 60000 });
  await new Promise((r) => setTimeout(r, 1800));
  await page.screenshot({ path: `${OUT}/desktop-hero.png` });
  await page.close();
  console.log("shot desktop-hero.png");
}

await browser.close();
console.log("done");