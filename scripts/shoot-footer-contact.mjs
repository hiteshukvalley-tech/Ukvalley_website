import puppeteer from "puppeteer-core";
const OUT = process.argv[2];
const b = await puppeteer.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe", headless: "new", args: ["--no-sandbox", "--disable-gpu"] });
for (const w of [320, 390, 1366]) {
  const p = await b.newPage();
  await p.setViewport({ width: w, height: 800, isMobile: w < 700, hasTouch: w < 700 });
  await p.goto("http://localhost:3000/contact", { waitUntil: "networkidle2", timeout: 90000 });
  await new Promise((r) => setTimeout(r, 1500));
  const f = await p.$("footer");
  await f.scrollIntoView();
  await new Promise((r) => setTimeout(r, 800));
  await f.screenshot({ path: `${OUT}/footer-${w}.png` });
  const o = await p.$$eval("h3", (hs) => hs.find((h) => h.textContent.includes("Offices"))?.parentElement);
  const h = await p.evaluateHandle(() => [...document.querySelectorAll("h3")].find((h) => h.textContent.includes("Offices")).parentElement);
  await h.asElement().screenshot({ path: `${OUT}/offices-${w}.png` });
  await p.close();
}
await b.close();
