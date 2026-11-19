// QA: the HR panel through its own buttons and forms (no API shortcuts).
//
//   Job openings: create a role in the admin → it is on /careers → an applicant applies →
//   AI interview created. Interview page: Send invitation again, Copy candidate link,
//   Extend, Reschedule, Remind, Email the candidate. Schedule list: tick a row → bulk
//   "Send a reminder". The candidate takes the interview → evaluated → Review panel:
//   comment, Next round, override the AI and remove the override. AI interview Settings:
//   save a change and put it back. Close the role (untick Published) → applications for it
//   are refused. Cancel an interview from its page.
//
// Same server setup as 16-ai-interviews.mjs (scratch database ukvalley_ai_qa, mock AI,
// fake SMTP on :2525). Test data is removed at the end.
import net from "node:net";
import puppeteer from "puppeteer-core";
import { MongoClient } from "mongodb";
import { BASE, OWNER, check, launch, login, newPage, section, sleep, summary } from "./lib.mjs";

const QA_URI = process.env.QA_MONGODB_URI || "mongodb://127.0.0.1:27099";
const QA_DB = process.env.QA_DB || "ukvalley_ai_qa";
if (!QA_DB.endsWith("_qa")) throw new Error(`Refusing to run against "${QA_DB}": use a scratch *_qa database.`);
const CHROME = process.env.CHROME_PATH || "C:/Program Files/Google/Chrome/Application/chrome.exe";

// --- fake SMTP ------------------------------------------------------------------------------------
const mails = [];
const smtp = net.createServer((sock) => {
  sock.write("220 qa ESMTP\r\n");
  let buf = "";
  let inData = false;
  let msg = { to: [], body: "" };
  sock.on("data", (chunk) => {
    buf += chunk.toString();
    let i;
    while ((i = buf.indexOf("\r\n")) >= 0) {
      const line = buf.slice(0, i);
      buf = buf.slice(i + 2);
      if (inData) {
        if (line === ".") { inData = false; mails.push(msg); msg = { to: [], body: "" }; sock.write("250 OK\r\n"); }
        else msg.body += line + "\n";
        continue;
      }
      const cmd = line.slice(0, 4).toUpperCase();
      if (cmd === "EHLO" || cmd === "HELO") sock.write("250-qa\r\n250 AUTH PLAIN LOGIN\r\n");
      else if (cmd === "AUTH") sock.write("235 OK\r\n");
      else if (cmd === "RCPT") { msg.to.push(line); sock.write("250 OK\r\n"); }
      else if (cmd === "DATA") { inData = true; sock.write("354 go\r\n"); }
      else if (cmd === "QUIT") { sock.write("221 bye\r\n"); sock.end(); }
      else sock.write("250 OK\r\n");
    }
  });
});
await new Promise((r) => smtp.listen(2525, "127.0.0.1", r));
const plain = (b) => b.replace(/=\r?\n/g, "").replace(/=3D/gi, "=");
const mailsTo = (addr) => mails.filter((m) => m.to.some((t) => t.includes(addr)));
const linkFor = (addr) => mailsTo(addr).map((m) => plain(m.body).match(/\/interview\/([A-Za-z0-9_-]{20,})/)?.[1]).filter(Boolean).at(-1) ?? null;
async function until(fn, ms = 60_000, every = 500) {
  const end = Date.now() + ms;
  for (;;) {
    const v = await fn();
    if (v) return v;
    if (Date.now() > end) return null;
    await sleep(every);
  }
}

const client = await MongoClient.connect(QA_URI);
const db = client.db(QA_DB);
const stamp = Date.now();
const roleName = `QA Buttons Role ${stamp}`;
const email = `buttons-${stamp}@example.com`;
let slug = "";
let id = null;
let browser;
let candBrowser;

try {
  section("Setup");
  await db.collection("aiInterviewSettings").updateOne(
    { _id: "global" },
    { $set: { settings: { enabled: true, autoSchedule: true, questionCount: 4, maxFollowUps: 0, candidateReschedules: 1, mcqEnabled: false, recordVideo: true, channels: { email: true, whatsapp: false, calendar: false } }, templates: {}, updatedAt: new Date(), updatedBy: "qa" } },
    { upsert: true }
  );
  await sleep(31_000); // the server caches the AI settings for 30 s
  browser = await launch();
  const ctx = browser.defaultBrowserContext();
  await ctx.overridePermissions(BASE, ["clipboard-read", "clipboard-write", "clipboard-sanitized-write"]);
  const admin = await newPage(browser);
  admin.on("dialog", (d) => d.accept()); // window.prompt fallback of "Copy link"
  await login(admin, OWNER);
  const goto = (p) => admin.goto(BASE + p, { waitUntil: "networkidle2", timeout: 60_000 });
  const body = () => admin.evaluate(() => document.body.innerText);
  const clickText = (re, scope = "button") =>
    admin.evaluate((src, sel) => {
      const b = [...document.querySelectorAll(sel)].find((x) => new RegExp(src, "i").test(x.textContent) && !x.disabled);
      b?.click();
      return !!b;
    }, re.source, scope);
  const toast = (re, ms = 15_000) => until(() => admin.evaluate((src) => [...document.querySelectorAll('[role="status"],[role="alert"]')].some((t) => new RegExp(src, "i").test(t.textContent)), re.source), ms, 250);
  const doc = () => db.collection("aiInterviews").findOne({ _id: id });

  // --- 1. Job opening created in the admin ------------------------------------------------------------
  section("1. Job openings: create a role");
  await goto("/admin/careers/new");
  await admin.type('input[name="role"]', roleName);
  await admin.type('input[name="location"]', "Pune, Maharashtra");
  await admin.type('textarea[name="summary"]', "A role created by the QA suite.");
  await admin.type('textarea[name="requirements"]', "React\nTypeScript");
  const published = await admin.$('input[name="published"]');
  if (published && !(await published.evaluate((e) => e.checked))) await published.click();
  await Promise.all([admin.waitForNavigation({ waitUntil: "networkidle2", timeout: 60_000 }).catch(() => {}), clickText(/Create role/)]);
  const role = await until(() => db.collection("careers").findOne({ role: roleName }), 15_000);
  slug = role?._id ?? role?.slug ?? "";
  check("role saved", !!role, "not in the careers collection");
  check("back on the list after saving", /\/admin\/careers/.test(admin.url()) && (await body()).includes(roleName));
  const careersPage = await until(async () => (await (await fetch(`${BASE}/careers`)).text()).includes(roleName), 30_000, 2000);
  check("the new role is on the public Careers page", !!careersPage);

  // --- 2. Someone applies ---------------------------------------------------------------------------
  section("2. An applicant applies to it");
  const apply = async (position, addr) => {
    const fd = new FormData();
    for (const [k, v] of Object.entries({ name: "Neha Buttons Test", email: addr, phone: "+91 98222 33344", location: "Pune", position, experience: "2–4 years", source: "LinkedIn", timeZone: "Asia/Kolkata", coverLetter: "" })) fd.append(k, v);
    fd.append("resume", new Blob(["%PDF-1.4\n1 0 obj<</Type/Catalog>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF\n"], { type: "application/pdf" }), "cv.pdf");
    const enc = new Response(fd);
    const buf = Buffer.from(await enc.arrayBuffer());
    const r = await fetch(`${BASE}/careers/apply`, { method: "POST", headers: { "Content-Type": enc.headers.get("content-type"), "Content-Length": String(buf.length), Origin: BASE }, body: buf });
    return r.json().catch(() => ({}));
  };
  const applied = await apply(roleName, email);
  check("application accepted for the new role", applied.ok === true, JSON.stringify(applied).slice(0, 150));
  const created = await until(() => db.collection("aiInterviews").findOne({ "candidate.email": email }), 30_000);
  id = created?._id ?? null;
  check("AI interview created for it", !!created && created.position === roleName, created?.position);
  if (!id) throw new Error("no interview: stopping");
  check("invitation sent", !!(await until(() => linkFor(email), 60_000)));

  // --- 3. Interview page buttons --------------------------------------------------------------------------
  section("3. Interview page buttons");
  await goto(`/admin/ai-interviews/${id}`);
  let before = mailsTo(email).length;
  await clickText(/Send invitation again/);
  check("Send invitation again: confirmation shown", !!(await toast(/Invitation queued again/)));
  check("…and the email arrives", !!(await until(() => mailsTo(email).length > before, 60_000)));
  check("…and it is in the audit trail", !!(await db.collection("aiInterviewAudit").findOne({ interviewId: id, action: "invitation_resent" })));

  await clickText(/Copy candidate link/);
  check("Copy candidate link: copied", !!(await toast(/link copied/i)) || !!(await db.collection("aiInterviewAudit").findOne({ interviewId: id, action: "link_viewed" })));
  check("…and the view is in the audit trail", !!(await until(() => db.collection("aiInterviewAudit").findOne({ interviewId: id, action: "link_viewed" }), 10_000)));

  const closesBefore = (await doc()).schedule.closesAt.getTime();
  await admin.select(`#extend-${id}`, "24");
  await clickText(/^\s*Extend\s*$/);
  check("Extend: the link stays open 24 hours longer", !!(await until(async () => (await doc()).schedule.closesAt.getTime() === closesBefore + 24 * 3600_000, 15_000)));

  before = mailsTo(email).length;
  await clickText(/^\s*Remind\s*$/);
  check("Remind: a reminder is emailed", !!(await until(() => mailsTo(email).length > before, 60_000)));

  await clickText(/Email the candidate/);
  await admin.waitForSelector('input[name="subject"]', { timeout: 10_000 });
  await admin.type('input[name="subject"]', "QA hello from the buttons suite");
  await admin.type('textarea[name="body"]', "Please check your interview link.");
  await clickText(/^\s*Send email\s*$/);
  check("Email the candidate: sent", !!(await toast(/Sent|sent/)));
  check("…and it arrives", !!(await until(() => mailsTo(email).some((m) => /QA hello from the buttons suite/.test(plain(m.body))), 30_000)));

  // Reschedule from the page: to "now" (India time), so the candidate can take it below.
  const v1 = (await doc()).schedule.version;
  await clickText(/^\s*Reschedule\s*$/);
  await admin.waitForSelector('input[name="startsAt"]', { timeout: 10_000 });
  const istNow = new Date(Date.now() + 5.5 * 3600_000 + 2 * 60_000).toISOString().slice(0, 16);
  await admin.$eval('input[name="startsAt"]', (el, v) => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(el, v);
    el.dispatchEvent(new Event("input", { bubbles: true }));
  }, istNow);
  const oldLink = linkFor(email);
  await admin.$$eval("form button[type=submit]", (bs) => bs.find((b) => /Save|Reschedule|Move/i.test(b.textContent) && b.closest("form")?.querySelector('input[name="startsAt"]'))?.click());
  check("Reschedule: new time saved", !!(await until(async () => (await doc()).schedule.version === v1 + 1, 20_000)));
  const newLink = await until(() => { const l = linkFor(email); return l && l !== oldLink ? l : null; }, 60_000);
  check("…and a new link is emailed", !!newLink);

  // --- 4. Bulk bar on the schedule list ---------------------------------------------------------------------
  section("4. Schedule list: bulk action");
  await goto(`/admin/ai-interviews/schedule?q=${encodeURIComponent(email)}`);
  const row = await admin.$(`input[name="bulk-id"][value="${id}"]`);
  check("the interview has a checkbox in the list", !!row);
  if (row) {
    await row.click();
    await admin.waitForSelector('[aria-label="Bulk actions"]', { timeout: 5_000 });
    await admin.select("#bulk-action", "remind");
    before = mailsTo(email).length;
    await clickText(/^\s*Apply\s*$/);
    check("bulk reminder: done", !!(await toast(/Done|1 /)));
    check("…and the reminder arrives", !!(await until(() => mailsTo(email).length > before, 60_000)));
  }

  // --- 5. The candidate takes the interview ---------------------------------------------------------------
  section("5. The candidate takes it");
  candBrowser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ["--no-sandbox", "--use-fake-device-for-media-stream", "--use-fake-ui-for-media-stream", "--autoplay-policy=no-user-gesture-required"], defaultViewport: { width: 1366, height: 900 } });
  const cand = await candBrowser.newPage();
  const ctext = () => cand.evaluate(() => document.body.innerText);
  const cclick = (re) => cand.evaluate((src) => { const b = [...document.querySelectorAll("button")].find((x) => new RegExp(src, "i").test(x.textContent) && !x.disabled); b?.click(); return !!b; }, re.source);
  await cand.goto(`${BASE}/interview/${newLink}`, { waitUntil: "networkidle2" });
  for (const box of await cand.$$("fieldset input[type=checkbox]")) await box.click();
  await cclick(/^I agree$/);
  await until(async () => /consent is saved/i.test(await ctext()), 10_000, 300);
  await cclick(/Turn on camera and microphone/);
  await until(async () => /Microphone works/i.test(await ctext()), 20_000, 300);
  await cclick(/Start interview/);
  let answered = 0;
  if (await cand.waitForSelector("#answer", { timeout: 60_000 }).catch(() => null)) {
    for (let n = 0; n < 12 && (await cand.$("#answer")); n++) {
      const h = await cand.evaluate(() => document.querySelector("h1")?.textContent ?? "");
      await cand.type("#answer", `Answer ${n + 1}: I build typed React apps and test them well.`);
      await cclick(/Submit answer/);
      await until(async () => (await cand.evaluate(() => document.querySelector("h1")?.textContent ?? "")) !== h, 30_000, 300);
      answered++;
    }
  }
  await cclick(/Submit interview/);
  check("candidate finished the interview", answered >= 4 && !!(await until(async () => /interview is complete/i.test(await ctext()), 120_000, 500)), `${answered} answered`);
  check("evaluated", !!(await until(async () => (await doc())?.evaluation?.state === "done", 120_000, 1500)));

  // --- 6. Review panel ----------------------------------------------------------------------------------------
  section("6. Review panel");
  await goto(`/admin/ai-interviews/${id}`);
  const decide = async (value, note) => {
    await admin.select('select[name="decision"]', value);
    await admin.$eval('form textarea[name="note"]', (el) => { el.value = ""; });
    if (note) await admin.type('form textarea[name="note"]', note);
    await admin.$$eval("form button[type=submit]", (bs) => bs.find((b) => b.textContent.trim() === "Save" && b.closest("form")?.querySelector('select[name="decision"]'))?.click());
  };
  await decide("comment", "QA comment through the panel.");
  check("comment saved", !!(await until(async () => (await doc()).hr.comments.some((c) => /QA comment through the panel/.test(c.text)), 15_000)));
  await decide("next_round", "Good answers.");
  check("Next round saved", !!(await until(async () => (await doc()).hr.decisions.some((d) => d.kind === "next_round"), 15_000)));
  const app = await until(async () => { const a = await db.collection("applications").findOne({ _id: created.applicationId }); return a?.status === "next-round" ? a : null; }, 15_000);
  check("…and the application moved to Next round", !!app);

  await admin.select('select[aria-label="Recommendation"]', "recommended");
  await admin.$eval('form textarea[name="reason"]', (el) => { el.value = ""; });
  await admin.type('form textarea[name="reason"]', "Strong practical answers for this role.");
  await clickText(/Save override/);
  check("override saved", !!(await until(async () => (await doc()).hr.recommendationOverride === "recommended", 15_000)));
  await goto(`/admin/ai-interviews/${id}`);
  check("the page shows the HR override", /Recommended/.test(await body()) && /HR/.test(await body()));
  await admin.select('select[aria-label="Recommendation"]', "");
  await clickText(/Save override/);
  check("override removed", !!(await until(async () => !(await doc()).hr.recommendationOverride, 15_000)));
  const noReason = async () => {
    await admin.select('select[aria-label="Recommendation"]', "hold");
    await admin.$eval('form textarea[name="reason"]', (el) => { el.value = ""; });
    await clickText(/Save override/);
    return toast(/reason/i, 8_000);
  };
  check("an override without a reason is refused", !!(await noReason()) && !(await doc()).hr.recommendationOverride);

  // Empties an input like a person does (select all + delete). Setting .value
  // directly can leave the old digits behind on a number field, so "7" became "47".
  const clearField = async (el) => {
    await el.click();
    await admin.keyboard.down("Control"); await admin.keyboard.press("KeyA"); await admin.keyboard.up("Control");
    await admin.keyboard.press("Backspace");
    await el.evaluate((e) => { if (e.value) { e.value = ""; e.dispatchEvent(new Event("input", { bubbles: true })); } });
  };

  // --- 7. Settings ----------------------------------------------------------------------------------------
  section("7. AI interview settings");
  await goto("/admin/ai-interviews/settings");
  const form = await admin.evaluateHandle(() => [...document.querySelectorAll("form")].find((f) => /Save settings/.test(f.textContent)));
  const qc = await form.asElement().$('input[name="questionCount"]');
  const original = await qc.evaluate((e) => e.value);
  await clearField(qc);
  await qc.type("7");
  await form.asElement().$$eval("button[type=submit]", (bs) => bs.find((b) => /Save settings/.test(b.textContent))?.click());
  const toastsNow = () => admin.evaluate(() => [...document.querySelectorAll('[role="status"],[role="alert"]')].map((t) => t.textContent.trim()).filter(Boolean).join(" | "));
  const savedQc = await until(async () => (await db.collection("aiInterviewSettings").findOne({ _id: "global" }))?.settings?.questionCount === 7, 15_000);
  check("settings saved from the form", !!savedQc, `typed value ${await qc.evaluate((e) => e.value)}; messages: ${(await toastsNow()).slice(0, 300)}`);
  if (!savedQc) await admin.screenshot({ path: `${process.env.QA_SHOTS || "."}/19-settings-not-saved.png`, fullPage: true }).catch(() => {});
  await clearField(qc);
  await qc.type(String(original));
  await form.asElement().$$eval("button[type=submit]", (bs) => bs.find((b) => /Save settings/.test(b.textContent))?.click());
  check("…and put back", !!(await until(async () => String((await db.collection("aiInterviewSettings").findOne({ _id: "global" }))?.settings?.questionCount) === String(original), 15_000)));
  const badQc = await form.asElement().$('input[name="questionCount"]');
  await clearField(badQc);
  await badQc.type("999");
  await form.asElement().$$eval("button[type=submit]", (bs) => bs.find((b) => /Save settings/.test(b.textContent))?.click());
  check("an out-of-range value is refused", !!(await toast(/fix the highlighted|Please fix/i, 10_000)) && String((await db.collection("aiInterviewSettings").findOne({ _id: "global" }))?.settings?.questionCount) === String(original));

  // --- 8. Cancel an interview from its page (while the role is still open) ----------------------------------------
  // Once the admin manages job openings, only those roles take applications: use this suite's own role.
  section("8. Cancel from the page");
  const second = await apply(roleName, `cancel-${stamp}@example.com`);
  const sec = second.ok ? await until(() => db.collection("aiInterviews").findOne({ "candidate.email": `cancel-${stamp}@example.com`, status: "scheduled" }), 30_000) : null;
  check("a second interview to cancel", !!sec, JSON.stringify(second).slice(0, 120));
  if (sec) {
    await goto(`/admin/ai-interviews/${sec._id}`);
    await clickText(/^\s*Cancel\s*$/);
    await admin.waitForSelector('input[name="reason"]', { timeout: 10_000 });
    await admin.type('input[name="reason"]', "The position was filled.");
    await admin.$$eval("form button[type=submit]", (bs) => bs.find((b) => b.closest("form")?.querySelector('input[name="reason"]') && /cancel/i.test(b.textContent))?.click());
    check("interview cancelled", !!(await until(async () => (await db.collection("aiInterviews").findOne({ _id: sec._id }))?.status === "cancelled", 15_000)));
    check("the candidate is told", !!(await until(() => mailsTo(`cancel-${stamp}@example.com`).some((m) => /cancelled/i.test(plain(m.body))), 60_000)));
    // cleanup this one too
    await db.collection("aiInterviews").deleteOne({ _id: sec._id });
    await db.collection("applications").deleteOne({ _id: sec.applicationId });
  }

  // --- 9. Close the role ----------------------------------------------------------------------------------
  section("9. Close the role");
  if (slug) {
    await goto(`/admin/careers/${slug}`);
    const pub = await admin.$('input[name="published"]');
    if (pub && (await pub.evaluate((e) => e.checked))) await pub.click();
    await clickText(/Save changes/);
    check("role moved to drafts", !!(await until(async () => { const r = await db.collection("careers").findOne({ role: roleName }); return r && r.published === false; }, 15_000)));
    const refused = await apply(roleName, `late-${stamp}@example.com`);
    check("applications for a closed role are refused", refused.ok === false && refused.kind === "closed", JSON.stringify(refused).slice(0, 150));
  } else check("role can be edited", false, "no slug");

  const pageErrors = admin.problems.filter((p) => !/favicon|_next\/image|about:srcdoc/.test(p));
  check("no browser errors in the admin", pageErrors.length === 0, pageErrors.slice(0, 4).join(" | "));
} catch (e) {
  check("suite ran to the end", false, e instanceof Error ? e.message : String(e));
} finally {
  if (id) {
    const d = await db.collection("aiInterviews").findOne({ _id: id });
    for (const c of await db.listCollections().toArray()) {
      if (c.name.startsWith("ai") && c.type === "collection") await db.collection(c.name).deleteMany({ $or: [{ interviewId: id }, { _id: id }] }).catch(() => {});
    }
    if (d?.applicationId) await db.collection("applications").deleteOne({ _id: d.applicationId }).catch(() => {});
  }
  await db.collection("careers").deleteMany({ role: roleName }).catch(() => {});
  await db.collection("applications").deleteMany({ email: { $in: [email, `late-${stamp}@example.com`, `cancel-${stamp}@example.com`] } }).catch(() => {});
  await browser?.close().catch(() => {});
  await candBrowser?.close().catch(() => {});
  await client.close();
  smtp.close();
  summary();
}
