// Admin → All page text: edit a heading, a paragraph, a button/link label and
// an image on a page, check the public site follows, that an edit that cannot
// show is reported, that revert / reset-all restore the originals. Run against
// a QA database only (see lib.mjs).
import { launch, newPage, go, login, check, section, summary, text, sleep } from "./lib.mjs";

const browser = await launch();
const page = await newPage(browser, { width: 1366, height: 900 });
page.on("dialog", (d) => d.accept());

const clickButton = (label) =>
  page.evaluate((l) => [...document.querySelectorAll("button")].find((b) => b.textContent.trim().startsWith(l))?.click(), label);
const has = (body, s) => body.toLowerCase().includes(s.toLowerCase());
const waitForText = (t, ms = 60000) => page.waitForFunction((x) => document.body.innerText.includes(x), { timeout: ms }, t);

/**
 * Changes the text `match` to `value` in the editor: a line in a section's
 * text box (one line per line on the page), or an image / link field.
 */
async function setField(match, value) {
  const ok = await page.evaluate((m, v) => {
    const put = (el, val) => {
      const proto = el.tagName === "TEXTAREA" ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
      Object.getOwnPropertyDescriptor(proto, "value").set.call(el, val);
      el.dispatchEvent(new Event("input", { bubbles: true }));
    };
    for (const box of document.querySelectorAll('main textarea[aria-label^="All text of the section"]')) {
      // texts in a section box are separated by an empty line
      const lines = box.value.split(/\n\s*\n/);
      const i = lines.indexOf(m);
      if (i >= 0) {
        lines[i] = v;
        put(box, lines.join("\n\n"));
        return true;
      }
    }
    const el = [...document.querySelectorAll("main ol textarea, main ol input")].find((e) => e.value === m);
    if (!el) return false;
    put(el, v);
    return true;
  }, match, value);
  return ok;
}
/** Every line of every section box on the editor page, with what it is (Heading, Button…). */
const boxLines = () =>
  page.$$eval("main section details ol li", (ls) =>
    ls.map((l) => { const s = l.querySelectorAll("span"); return { role: s[1]?.textContent ?? "", val: s[2]?.textContent ?? "" }; })
  );
const hasLine = (t) =>
  page.evaluate((x) => [...document.querySelectorAll('main textarea[aria-label^="All text of the section"]')].some((b) => b.value.split(/\n\s*\n/).includes(x)), t);
const editorPath = (p) => `/admin/texts?path=${encodeURIComponent(p)}`;
const publicText = async (p) => { await go(page, p, { timeout: 120000 }); return text(page); };

section("Start clean");
await login(page);
await go(page, "/admin/texts", { timeout: 180000 });
await clickButton("Restore every page");
await waitForText("Every page text is back to the original.");
let body = await text(page);
check("overview lists pages by menu section", has(body, "Services") && has(body, "Solutions") && has(body, "Insights") && has(body, "Privacy policy") && has(body, "About us"));
check("no page addresses are shown", !body.includes("/services/") && !body.includes("/privacy"));

section("Section pages and sidebar");
await go(page, "/admin/texts/services", { timeout: 120000 });
body = await text(page);
check("Services section lists every service page", has(body, "Web & Web App Development") && has(body, "Mobile App Development") && has(body, "Cloud & DevOps Engineering"));
check("sidebar: Services menu has Pages & text", has(body, "Pages & text") && has(body, "Service cards"));
check("old All page text / Page hero entries are gone from the sidebar", !has(body, "All page text") && !has(body, "Page hero"));
await go(page, "/admin/texts/solutions", { timeout: 120000 });
check("Solutions section lists solution pages", has(await text(page), "CRM Systems"));
await go(page, "/admin/texts/insights", { timeout: 120000 });
check("Insights section lists articles", has(await text(page), "Article"));
await go(page, "/admin/texts?path=%2Fservices%2Fweb-development", { timeout: 120000 });
check("old address redirects into the Services section", page.url().includes("/admin/texts/services?path="), page.url());
check("editor shows the service's name, not its address", has(await page.$eval("h1", (h) => h.innerText), "Web & Web App Development"));

section("Page scan");
await go(page, editorPath("/privacy"), { timeout: 180000 });
body = await text(page);
check("shows the page's heading", await hasLine("Privacy Policy"));
check("shows a paragraph", await hasLine("What we collect"));
check("one text box per section", (await page.$$('main textarea[aria-label^="All text of the section"]')).length >= 2);
const sectionCount = (await page.$$("main section[class*=overflow-hidden] > button")).length;
check("text is grouped into collapsible sections", sectionCount >= 2, String(sectionCount));
// Header and footer are edited once in their own editors (Overview → Header / Footer), not per page.
check("no Header/Footer groups on a page", !has(body, "Header (menu bar)"));

section("Edit text");
check("heading field found", await setField("Privacy Policy", "QA Privacy Heading"));
check("paragraph field found", await setField("What we collect", "QA what we collect"));
check("unsaved marker", /\d+ unsaved change/.test(await text(page)));
await clickButton("Save changes");
await waitForText("Checked on the live page");
check("saved and verified on the live page", true);

body = await publicText("/privacy");
check("heading replaced on the public page", has(body, "QA Privacy Heading"));
check("paragraph replaced", has(body, "QA what we collect"));
body = await publicText("/terms");
check("same text replaced everywhere it appears (footer link)", has(body, "QA Privacy Heading"));

section("Editor shows edited state, then revert");
await go(page, editorPath("/privacy"));
body = await text(page);
check("edited sections are marked", has(body, "Edited") && (await hasLine("QA Privacy Heading")));
// Typing the original text back reverts that one line; the rest of the section keeps its edits.
await setField("QA Privacy Heading", "Privacy Policy");
await clickButton("Save changes");
await waitForText("Checked on the live page");
body = await publicText("/privacy");
check("reverted heading is back", has(body, "Privacy Policy") && !has(body, "QA Privacy Heading"));
check("the other edit is kept", has(body, "QA what we collect"));

section("Link text and image");
await go(page, editorPath("/about"), { timeout: 180000 });
const aboutRows = await boxLines();
const candidates = aboutRows.filter((r) => /link|button/i.test(r.role) && r.val && r.val.length < 40 && !r.val.startsWith("/")).slice(0, 5);
check("found button or link labels on /about", candidates.length > 0, JSON.stringify(aboutRows.slice(0, 4)));
let buttonDone = false;
for (const [i, c] of candidates.entries()) {
  if (i > 0) await go(page, editorPath("/about"));
  await setField(c.val, "QA Button Label");
  await clickButton("Save changes");
  await page.waitForFunction(() => /Checked on the live page|not showing on this page/.test(document.body.innerText), { timeout: 60000 });
  if ((await text(page)).includes("Checked on the live page")) {
    check(`button label "${c.val}" replaced on /about`, has(await publicText("/about"), "QA Button Label"));
    buttonDone = true;
    break;
  }
}
check("at least one button/link label on /about is editable", buttonDone, `tried ${candidates.map((c) => c.val).join(" | ")}`);
await go(page, editorPath("/about"));
await page.select('select[aria-label="Type of item"]', "image");
const imgInputs = await page.$$eval('main ol input[id^="t-"]', (els) => els.map((e) => e.value));
check("images are listed", imgInputs.length > 0, String(imgInputs.length));
if (imgInputs.length) {
  const from = imgInputs.find((v) => /^\/(company|hire|insights)-hero\.jpg$/.test(v)) ?? imgInputs[0];
  const to = from === "/hire-hero.jpg" ? "/insights-hero.jpg" : "/hire-hero.jpg";
  await setField(from, to);
  await clickButton("Save changes");
  await waitForText("Checked on the live page");
  const html = await (await fetch(page.url().split("/admin")[0] + "/about", { cache: "no-store" })).text();
  check("image replaced on the public page", html.includes(encodeURIComponent(to)) || html.includes(`src="${to}"`), `${from} -> ${to}`);
}
check("bad image path is rejected", await (async () => {
  await go(page, editorPath("/about"));
    await page.select('select[aria-label="Type of item"]', "image");
  const first = await page.$eval('main ol input[id^="t-"]', (e) => e.value);
  await setField(first, "https://evil.example/x.png");
  await clickButton("Save changes");
  await waitForText("An image must be a site path");
  return true;
})());

// Form labels used to be built into the form and could not change; since the
// October 2026 "editable text everywhere" pass they are editable like any text.
section("Form labels can be edited");
await go(page, editorPath("/contact"), { timeout: 180000 });
const label = (await boxLines()).find((r) => /label/i.test(r.role) && r.val.length > 2 && r.val.length < 40)?.val ?? null;
check("found a form label on /contact", !!label);
if (label) {
  await setField(label, "QA form label");
  await clickButton("Save changes");
  await page.waitForFunction(
    () => /Checked on the live page|not showing on this page/.test(document.body.innerText), { timeout: 60000 }
  );
  check("the form label edit shows on the live page", has(await text(page), "Checked on the live page"));
  body = await publicText("/contact");
  check("form label replaced on /contact", has(body, "QA form label"));
}

section("Reset everything");
await go(page, "/admin/texts");
await clickButton("Restore every page");
await waitForText("Every page text is back to the original.");
body = await publicText("/privacy");
check("privacy page original again", has(body, "What we collect") && !has(body, "QA what we collect") && !has(body, "QA Privacy Heading"));
body = await publicText("/about");
check("about page original again", !has(body, "QA Button Label"));

const real = page.problems.filter((p) => !p.includes("ERR_NAME_NOT_RESOLVED") && !p.includes("evil.example"));
check("no console/page errors", real.length === 0, real.slice(0, 5).join(" | "));
await browser.close();
summary();
