// iOS responsive audit (temporary). Emulates iPhone/iPad Safari viewports and
// reports: horizontal overflow, text cut off at the screen edge, content left
// invisible after scrolling (stuck reveal animations), clipped headings/buttons,
// form fields under 16px (iOS zoom-on-focus) and JS errors.
// usage: node _ios-audit.mjs [base] [routeFilter]
import puppeteer from "puppeteer-core";

const BASE = process.argv[2] || "http://localhost:3100";
const FILTER = process.argv[3] ? new RegExp(process.argv[3]) : null;
const UA_PHONE =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1";
const UA_PAD =
  "Mozilla/5.0 (iPad; CPU OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1";
const DEVICES = [
  { name: "iPhone SE", width: 375, height: 667, ua: UA_PHONE },
  { name: "iPhone 15", width: 393, height: 852, ua: UA_PHONE },
  { name: "iPhone 15 Pro Max", width: 430, height: 932, ua: UA_PHONE },
  { name: "iPhone landscape", width: 852, height: 393, ua: UA_PHONE },
  { name: "iPad mini", width: 768, height: 1024, ua: UA_PAD },
  { name: "iPad Pro", width: 1024, height: 1366, ua: UA_PAD },
];

const xml = await (await fetch(BASE + "/sitemap.xml")).text();
let routes = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname);
routes = [...new Set(routes)];
if (FILTER) routes = routes.filter((r) => FILTER.test(r));
console.log(`auditing ${routes.length} routes × ${DEVICES.length} devices`);

const browser = await puppeteer.launch({
  executablePath: process.env.CHROME_PATH || "C:/Program Files/Google/Chrome/Application/chrome.exe",
  headless: true,
  // Pages run 5 at a time: stop Chrome pausing animation frames in the
  // background tabs, or GSAP reveals never finish there (false "invisible").
  args: [
    "--no-sandbox", "--disable-gpu", "--disable-background-timer-throttling",
    "--disable-renderer-backgrounding", "--disable-backgrounding-occluded-windows",
  ],
});

async function audit(route, d) {
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message.slice(0, 140)));
  await page.setUserAgent(d.ua);
  await page.setViewport({ width: d.width, height: d.height, isMobile: true, hasTouch: true, deviceScaleFactor: 1 });
  try {
    await page.goto(BASE + route, { waitUntil: "networkidle2", timeout: 90000 });
    await new Promise((r) => setTimeout(r, 600));
    // scroll the whole page so every scroll-triggered reveal fires
    await page.evaluate(async () => {
      // the site sets scroll-behavior: smooth; jump instantly like a finger swipe
      document.documentElement.style.scrollBehavior = "auto";
      const step = Math.round(innerHeight * 0.3);
      for (let y = 0; y < document.documentElement.scrollHeight; y += step) {
        window.scrollTo({ top: y, behavior: "instant" });
        await new Promise((r) => setTimeout(r, 110));
      }
      window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "instant" });
      await new Promise((r) => setTimeout(r, 1600));
    });
    const res = await page.evaluate(() => {
      const vw = document.documentElement.clientWidth;
      const out = { overflow: null, offscreen: [], invisible: [], clipped: [], smallFields: [] };
      const desc = (el) => {
        const t = (el.innerText || el.value || el.placeholder || "").trim().replace(/\s+/g, " ").slice(0, 50);
        const c = typeof el.className === "string" ? el.className.split(" ").slice(0, 4).join(".") : "";
        return `<${el.tagName.toLowerCase()}${c ? "." + c : ""}> "${t}"`;
      };
      const ignored = (el) =>
        el.closest("[aria-hidden='true'],.sr-only,[role='dialog'],[data-marquee],.animate-marquee,script,style,noscript");
      const sw = document.documentElement.scrollWidth;
      if (sw > vw + 1) out.overflow = `scrollWidth ${sw} > ${vw}`;

      const hasOwnText = (el) =>
        [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim().length > 1);
      const scrollsX = (el) => {
        for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
          const o = getComputedStyle(p).overflowX;
          if (o === "auto" || o === "scroll") return true;
          const anim = getComputedStyle(p).animationName;
          if (anim && anim !== "none" && /marquee|scroll|ticker/i.test(anim)) return true;
        }
        return false;
      };
      for (const el of document.querySelectorAll("body *")) {
        if (!hasOwnText(el) || ignored(el)) continue;
        const r = el.getBoundingClientRect();
        if (!r.width || !r.height) continue;
        const cs = getComputedStyle(el);
        if (cs.visibility === "hidden" || cs.display === "none") continue;
        // text running past the screen edge (cut off or causing sideways scroll)
        if ((r.right > vw + 2 || r.left < -2) && !scrollsX(el)) out.offscreen.push(`${desc(el)} [${Math.round(r.left)}..${Math.round(r.right)}]`);
        // effective opacity through ancestors
        let op = 1;
        for (let p = el; p && p !== document.documentElement; p = p.parentElement) op *= parseFloat(getComputedStyle(p).opacity);
        if (op < 0.08) out.invisible.push(`${desc(el)} opacity=${op.toFixed(2)}`);
        // headings/buttons/links whose text is cut off inside their box
        if (/^(H1|H2|H3|H4|A|BUTTON|DT|DD|LABEL)$/.test(el.tagName) && cs.textOverflow !== "ellipsis" &&
            /hidden|clip/.test(cs.overflowX) && el.scrollWidth > el.clientWidth + 2)
          out.clipped.push(desc(el));
      }
      for (const f of document.querySelectorAll("input:not([type=hidden]):not([type=radio]):not([type=checkbox]):not([type=file]),select,textarea")) {
        if (ignored(f) || f.closest("[style*='left: -']") || f.tabIndex === -1) continue;
        const fs = parseFloat(getComputedStyle(f).fontSize);
        if (fs < 16) out.smallFields.push(`${desc(f)} ${fs}px`);
      }
      for (const k of ["offscreen", "invisible", "clipped", "smallFields"]) out[k] = [...new Set(out[k])].slice(0, 6);
      return out;
    });
    res.errors = errors.slice(0, 3);
    return res;
  } catch (e) {
    return { fail: String(e).slice(0, 120) };
  } finally {
    await page.close();
  }
}

const jobs = routes.flatMap((r) => DEVICES.map((d) => [r, d]));
const findings = [];
let i = 0;
async function worker() {
  while (i < jobs.length) {
    const [r, d] = jobs[i++];
    const res = await audit(r, d);
    const lines = [];
    if (res.fail) lines.push("LOAD FAIL " + res.fail);
    else {
      if (res.overflow) lines.push("OVERFLOW " + res.overflow);
      res.offscreen.forEach((x) => lines.push("OFFSCREEN " + x));
      res.invisible.forEach((x) => lines.push("INVISIBLE " + x));
      res.clipped.forEach((x) => lines.push("CLIPPED " + x));
      res.smallFields.forEach((x) => lines.push("ZOOM<16px " + x));
      res.errors.forEach((x) => lines.push("JS ERROR " + x));
    }
    if (lines.length) findings.push(`\n${r} @ ${d.name} (${d.width}x${d.height})\n  ${lines.join("\n  ")}`);
  }
}
await Promise.all(Array.from({ length: 5 }, worker));
console.log(findings.sort().join("\n") || "\nNo issues found.");
console.log(`\nchecked ${jobs.length} page/device combinations, ${findings.length} with findings`);
await browser.close();
