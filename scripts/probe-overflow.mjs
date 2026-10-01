// usage: node scripts/probe-overflow.mjs <width> <route> [route...]  -> lists elements sticking out past the viewport
import puppeteer from "puppeteer-core";
const [w, ...routes] = process.argv.slice(2);
const b = await puppeteer.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe", headless: "new", args: ["--no-sandbox", "--disable-gpu"] });
for (const r of routes) {
  const p = await b.newPage();
  await p.setViewport({ width: +w, height: 900 });
  await p.goto("http://localhost:3000" + r, { waitUntil: "networkidle2", timeout: 90000 });
  await new Promise((x) => setTimeout(x, 1500));
  const res = await p.evaluate(() => {
    const vw = document.documentElement.clientWidth, out = [];
    for (const el of document.querySelectorAll("body *")) {
      const bb = el.getBoundingClientRect();
      if (bb.width && (bb.right > vw + 1 || bb.left < -1)) out.push(`${el.tagName.toLowerCase()}.${String(el.className).slice(0, 90)} L=${Math.round(bb.left)} R=${Math.round(bb.right)}`);
    }
    return { sw: document.documentElement.scrollWidth, vw, out: out.slice(0, 12) };
  });
  console.log(r, res.sw, res.vw, "\n  " + res.out.join("\n  "));
  await p.close();
}
await b.close();
