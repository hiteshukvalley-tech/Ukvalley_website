// Emulates a phone browser's "Desktop site" mode (980px layout viewport).
// usage: node scripts/shoot-desktop-mode.mjs <outDir> <route> [route...]
import puppeteer from "puppeteer-core";
const [out, ...routes] = process.argv.slice(2);
const b = await puppeteer.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe", headless: "new", args: ["--no-sandbox", "--disable-gpu"] });
for (const r of routes) {
  const p = await b.newPage();
  await p.setViewport({ width: 980, height: 1800 });
  await p.goto("http://localhost:3000" + r, { waitUntil: "networkidle2", timeout: 90000 });
  await new Promise((x) => setTimeout(x, 1500));
  // scroll through so reveal animations fire
  await p.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 600) { window.scrollTo(0, y); await new Promise((x) => setTimeout(x, 120)); } window.scrollTo(0, 0); });
  await new Promise((x) => setTimeout(x, 800));
  const sw = await p.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth]);
  console.log(r, "scrollWidth/clientWidth", sw.join("/"));
  await p.screenshot({ path: `${out}/dm-${r === "/" ? "home" : r.slice(1).replaceAll("/", "_")}.png`, fullPage: true });
  await p.close();
}
await b.close();
