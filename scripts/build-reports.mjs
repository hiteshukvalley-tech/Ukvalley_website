// Builds the downloadable PDF reports in /public/reports from
// src/lib/reports.json — the same data the /clients and /case-studies pages
// render. Run `node scripts/build-reports.mjs` after editing that file.
//
// Each report becomes an A4 PDF: cover, summary + highlights, a single-hue
// bar chart (brand blue, labelled at the bar tip) with its table, then the
// report's sections. Uses the locally installed Chrome via puppeteer-core.
import puppeteer from "puppeteer-core";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "public", "reports");
const CHROME = process.env.CHROME_PATH ?? "C:/Program Files/Google/Chrome/Application/chrome.exe";

const { reports } = JSON.parse(fs.readFileSync(path.join(ROOT, "src", "lib", "reports.json"), "utf8"));

const esc = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function barChart(chart) {
  const rows = chart.rows;
  const max = Math.max(...rows.map((r) => r.value));
  const w = 640, labelW = 300, barH = 22, rowH = 40;
  const h = rows.length * rowH + 16;
  const plotW = w - labelW - 60;
  const ticks = 4;
  let svg = `<svg viewBox="0 0 ${w} ${h}" width="100%" xmlns="http://www.w3.org/2000/svg" font-family="Inter, Arial, sans-serif">`;
  for (let i = 0; i <= ticks; i++) {
    const x = labelW + (plotW * i) / ticks;
    svg += `<line x1="${x}" x2="${x}" y1="4" y2="${h - 12}" stroke="#e5e1f2" stroke-width="1"/>`;
  }
  rows.forEach((r, i) => {
    const y = 8 + i * rowH;
    const bw = Math.max(8, (r.value / max) * plotW);
    const label = r.label.length > 44 ? r.label.slice(0, 43) + "…" : r.label;
    svg += `<text x="${labelW - 10}" y="${y + barH / 2 + 4}" text-anchor="end" font-size="12" fill="#423b58">${esc(label)}</text>`;
    svg += `<path d="M${labelW} ${y} H${labelW + bw - 4} a4 4 0 0 1 4 4 v${barH - 8} a4 4 0 0 1 -4 4 H${labelW} Z" fill="#3100ff"/>`;
    svg += `<text x="${labelW + bw + 8}" y="${y + barH / 2 + 4}" font-size="12" font-weight="600" fill="#151122">${r.value}</text>`;
  });
  return svg + "</svg>";
}

function section(s) {
  let html = `<section class="sec"><h2>${esc(s.heading)}</h2>`;
  if (s.body) html += `<p>${esc(s.body)}</p>`;
  if (s.bullets) html += `<ul>${s.bullets.map((b) => `<li>${esc(b)}</li>`).join("")}</ul>`;
  if (s.table) {
    html += `<table>${s.table
      .map((row) => `<tr>${row.map((c, i) => `<td class="${i === 1 ? "num" : ""}">${esc(c)}</td>`).join("")}</tr>`)
      .join("")}</table>`;
  }
  return html + "</section>";
}

function html(r) {
  const today = new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${esc(r.title)}</title>
<style>
  @page { size: A4; margin: 18mm 16mm; }
  * { box-sizing: border-box; }
  body { font-family: Inter, "Segoe UI", Arial, sans-serif; color: #151122; font-size: 11pt; line-height: 1.55; margin: 0; }
  .cover { height: 250mm; display: flex; flex-direction: column; justify-content: flex-end; padding: 18mm; border-radius: 14px;
           background: linear-gradient(160deg, #EFECFF 0%, #F8F7FF 60%, #FFFFFF 100%); border: 1px solid #e5e1f2; page-break-after: always; position: relative; }
  .cover .brand { position: absolute; top: 18mm; left: 18mm; display: flex; align-items: center; gap: 10px; }
  .cover .mark { width: 34px; height: 34px; border-radius: 9px; background: linear-gradient(135deg,#3100FF,#2400C7); color: #fff; font-weight: 800; display: flex; align-items: center; justify-content: center; font-size: 18px; }
  .cover .brand b { font-size: 14px; letter-spacing: -0.01em; }
  .cover .brand small { display: block; font-size: 8px; letter-spacing: .28em; text-transform: uppercase; color: #68627a; }
  .kind { display: inline-block; font-size: 8pt; font-weight: 700; letter-spacing: .2em; text-transform: uppercase; color: #3100ff; background: rgba(49,0,255,.08); padding: 5px 12px; border-radius: 999px; }
  h1 { font-size: 30pt; line-height: 1.08; letter-spacing: -0.02em; margin: 14px 0 8px; max-width: 150mm; }
  .period { color: #68627a; font-size: 11pt; }
  .stripe { position: absolute; left: 0; right: 0; bottom: 0; height: 6px; border-radius: 0 0 14px 14px; background: linear-gradient(90deg,#3100FF,#684DFF,#287BFF,#fff500); }
  h2 { font-size: 15pt; letter-spacing: -0.01em; margin: 0 0 8px; color: #0e0b18; }
  .lead { font-size: 12pt; color: #423b58; }
  .hl { list-style: none; padding: 0; margin: 10px 0 0; display: grid; grid-template-columns: 1fr 1fr; gap: 8px 16px; }
  .hl li { padding-left: 18px; position: relative; font-size: 10pt; }
  .hl li::before { content: ""; position: absolute; left: 0; top: 6px; width: 9px; height: 9px; border-radius: 50%; background: #3100ff; }
  .chart { border: 1px solid #e5e1f2; border-radius: 12px; padding: 14px 16px; margin-top: 14px; page-break-inside: avoid; }
  .chart h3 { margin: 0 0 6px; font-size: 11pt; }
  .chart .unit { font-size: 8.5pt; color: #68627a; }
  .sec { margin-top: 18px; page-break-inside: avoid; }
  .sec p { margin: 0; color: #423b58; }
  .sec ul { margin: 6px 0 0; padding-left: 18px; color: #423b58; }
  .sec li { margin: 4px 0; }
  table { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 10pt; }
  td { padding: 7px 10px; border-bottom: 1px solid #e5e1f2; vertical-align: top; }
  td.num { font-weight: 700; color: #3100ff; white-space: nowrap; }
  tr td:last-child { color: #68627a; }
  .foot { margin-top: 24px; padding-top: 10px; border-top: 1px solid #e5e1f2; font-size: 8.5pt; color: #68627a; display: flex; justify-content: space-between; }
</style></head><body>
<div class="cover">
  <div class="brand"><div class="mark">U</div><div><b>Ukvalley</b><small>Technologies</small></div></div>
  <span class="kind">${esc(r.kind)}</span>
  <h1>${esc(r.title)}</h1>
  <div class="period">${esc(r.period)} · Published ${today}</div>
  <div class="stripe"></div>
</div>

<section class="sec">
  <h2>Summary</h2>
  <p class="lead">${esc(r.summary)}</p>
  <ul class="hl">${r.highlights.map((h) => `<li>${esc(h)}</li>`).join("")}</ul>
</section>

<div class="chart">
  <h3>${esc(r.chart.title)}</h3>
  <div class="unit">Values in ${esc(r.chart.unit)}</div>
  ${barChart(r.chart)}
  <table>${r.chart.rows.map((row) => `<tr><td>${esc(row.label)}</td><td class="num">${row.value} ${esc(r.chart.unit)}</td></tr>`).join("")}</table>
</div>

${(r.sections ?? []).map(section).join("")}

<div class="foot"><span>Ukvalley Technologies · ukvalley.com · sales@ukvalley.com</span><span>Client names anonymised. Figures rounded.</span></div>
</body></html>`;
}

fs.mkdirSync(OUT, { recursive: true });
const browser = await puppeteer.launch({ executablePath: CHROME, headless: "new", args: ["--no-sandbox"] });
for (const r of reports) {
  const page = await browser.newPage();
  await page.setContent(html(r), { waitUntil: "load" });
  const file = path.join(OUT, path.basename(r.file));
  await page.pdf({ path: file, format: "A4", printBackground: true, preferCSSPageSize: true });
  await page.close();
  console.log(`wrote ${path.relative(ROOT, file)}`);
}
await browser.close();
