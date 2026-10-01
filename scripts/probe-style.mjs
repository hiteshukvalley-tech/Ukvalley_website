// usage: node scripts/probe-style.mjs <width> <route> <selector> <cssProp>
import puppeteer from "puppeteer-core";
const [w, r, sel, prop] = process.argv.slice(2);
const b = await puppeteer.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe", headless: "new", args: ["--no-sandbox"] });
const p = await b.newPage();
await p.setViewport({ width: +w, height: 900 });
await p.goto("http://localhost:3000" + r, { waitUntil: "networkidle2", timeout: 90000 });
console.log(await p.$eval(sel, (e, pr) => getComputedStyle(e)[pr] + " | " + e.getBoundingClientRect().width, prop));
await b.close();
