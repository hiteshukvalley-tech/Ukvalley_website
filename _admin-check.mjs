// Read-only check of today's admin changes (temporary). Saves nothing.
import { launch, newPage, go, login, sleep } from "./scripts/qa/lib.mjs";

const SHOTS = process.env.SHOTS;
const browser = await launch();
const page = await newPage(browser, { width: 1440, height: 1000 });
await login(page);
await go(page, "/admin");
const nav = await page.evaluate(() => {
  const aside = document.querySelector("aside") ?? document.body;
  return [...aside.querySelectorAll("a, button")].map((e) => e.textContent.trim()).filter(Boolean);
});
console.log("sidebar:", nav.join(" | "));
console.log("Media in sidebar:", nav.some((t) => /^Media$/.test(t)));
console.log("Dashboard media card:", await page.evaluate(() => document.body.innerText.includes("Media files")));
const ci = nav.indexOf("Company"), ki = nav.indexOf("Careers"), hi = nav.indexOf("Hire");
console.log(`order: Company@${ci} Careers@${ki} Hire@${hi} ->`, ci < ki && ki < hi ? "Careers is below Company" : "WRONG ORDER");

await go(page, "/admin/texts/company");
console.log("Company > Pages & text lists Social impact:", await page.evaluate(() => document.body.innerText.includes("Our social impact")));

await go(page, "/admin/pages/social-impact");
const ed = await page.evaluate(() => ({
  sections: document.body.innerText.match(/SECTION \d+/gi)?.length ?? 0,
  titles: [...document.querySelectorAll("input")].map((i) => i.value).filter((v) => /Social Activities|Sports Event|Celebrations|Ganpati|Workshops/.test(v)),
  thumbs: document.querySelectorAll("fieldset ol img").length,
  upload: document.body.innerText.includes("Upload pictures"),
  addSection: [...document.querySelectorAll("button")].some((b) => /Add section/i.test(b.textContent)),
}));
console.log("social-impact editor:", JSON.stringify(ed));
if (SHOTS) await page.screenshot({ path: `${SHOTS}/admin-social-impact.png`, fullPage: false });
await page.evaluate(() => [...document.querySelectorAll("legend")].find((l) => /Event sections/.test(l.textContent))?.scrollIntoView());
await sleep(400);
if (SHOTS) await page.screenshot({ path: `${SHOTS}/admin-social-galleries.png` });

await go(page, "/social-impact");
const pub = await page.evaluate(() => [...document.querySelectorAll("main section h2")].map((h) => h.textContent.trim()));
console.log("public /social-impact headings:", pub.join(" | "));
console.log("problems:", page.problems.slice(0, 5));
await browser.close();
