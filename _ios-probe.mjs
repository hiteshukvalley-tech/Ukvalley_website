import puppeteer from "puppeteer-core";
const BASE = "http://localhost:3100";
const browser = await puppeteer.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe", headless: true });
const page = await browser.newPage();
for (const w of [1024, 1112, 1180, 1194, 1280, 1366, 1440]) {
  await page.setViewport({ width: w, height: 900, isMobile: w < 1280, hasTouch: w < 1280 });
  await page.goto(BASE + "/", { waitUntil: "networkidle2", timeout: 90000 });
  const r = await page.evaluate(() => {
    const row = document.querySelector("header nav[aria-label='Primary']")?.parentElement;
    const nav = row?.querySelector("nav");
    const cta = [...row.querySelectorAll("a")].find((a) => /scoping/i.test(a.textContent));
    return {
      vw: document.documentElement.clientWidth,
      rowScroll: row.scrollWidth, rowClient: row.clientWidth,
      nav: Math.round(nav.getBoundingClientRect().width),
      ctaRight: cta ? Math.round(cta.getBoundingClientRect().right) : null,
      burger: getComputedStyle(row.querySelector("button[aria-label='Open menu']")).display,
    };
  });
  console.log(w, JSON.stringify(r));
}
await browser.close();
