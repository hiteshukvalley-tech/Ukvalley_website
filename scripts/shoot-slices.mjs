// Screenshots a page at a given width as viewport-height slices.
// usage: node scripts/shoot-slices.mjs <outDir> <width> <route> [maxSlices]
import puppeteer from "puppeteer-core";
const [out, w, r, max = "6"] = process.argv.slice(2);
const b = await puppeteer.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe", headless: "new", args: ["--no-sandbox", "--disable-gpu"] });
const p = await b.newPage();
await p.setViewport({ width: +w, height: 1400 });
await p.goto("http://localhost:3000" + r, { waitUntil: "networkidle2", timeout: 90000 });
await new Promise((x) => setTimeout(x, 1500));
const H = await p.evaluate(() => document.documentElement.scrollHeight);
const name = r === "/" ? "home" : r.slice(1).replaceAll("/", "_");
for (let i = 0; i < Math.min(+max, Math.ceil(H / 1400)); i++) {
  await p.evaluate((y) => window.scrollTo(0, y), i * 1400);
  await new Promise((x) => setTimeout(x, 900));
  await p.screenshot({ path: `${out}/${name}-${w}-${i}.png` });
}
console.log(name, "height", H);
await b.close();
