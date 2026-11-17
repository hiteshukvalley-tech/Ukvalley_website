// QA: Admin → Email (SMTP). Start the app WITHOUT any SMTP_* env vars, on a
// scratch database, so email only works through the settings saved here:
//   NEXT_DIST_DIR=.next-test MONGODB_DB=ukvalley_qa npx next start -p 3100
//   node scripts/qa/14-email-settings.mjs
// Runs its own fake SMTP server on :2525. The saved settings are removed at the end.
import net from "node:net";
import { readFileSync } from "node:fs";
import { MongoClient } from "mongodb";
import { ENV_TEXT, check, go, launch, login, newPage, pickOption, section, sleep, summary, text } from "./lib.mjs";

const QA_DB = process.env.QA_DB || "ukvalley_qa";
if (!QA_DB.endsWith("_qa")) throw new Error(`Refusing to run against "${QA_DB}" — use a scratch *_qa database.`);
const uri = ENV_TEXT.match(/^MONGODB_URI=(.*)$/m)?.[1].trim();

// --- fake SMTP server (accepts any login) -----------------------------------------
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
      if (cmd === "EHLO") sock.write("250-qa\r\n250-AUTH PLAIN LOGIN\r\n250 OK\r\n");
      else if (cmd === "AUTH") sock.write("235 OK\r\n");
      else if (cmd === "RCPT") { msg.to.push((line.match(/<(.*)>/)?.[1] ?? "").toLowerCase()); sock.write("250 OK\r\n"); }
      else if (cmd === "DATA") { inData = true; sock.write("354 go\r\n"); }
      else if (cmd === "QUIT") { sock.write("221 bye\r\n"); sock.end(); }
      else sock.write("250 OK\r\n");
    }
  });
});
await new Promise((r) => smtp.listen(2525, "127.0.0.1", r));

const mongo = new MongoClient(uri);
const db = mongo.db(QA_DB);
await db.collection("settings").deleteOne({ _id: "smtp" });

const PASSWORD = "qa-secret-password";
const TEST_TO = "qa.smtp.test@example.com";
const browser = await launch();
try {
  const admin = await newPage(browser);
  await login(admin);

  section("Page");
  await go(admin, "/admin/settings/email");
  let t = await text(admin);
  check("page opens for admins", /Email \(SMTP\)/.test(t));
  check("sidebar link", !!(await admin.$('a[href="/admin/settings/email"]')));
  check("shows email is off with no settings", /Email is off/.test(t), t.slice(0, 300));

  section("Validation");
  await admin.$$eval("button[type=submit]", (bs) => bs.find((b) => /Save settings/.test(b.textContent))?.click());
  await sleep(1500);
  t = await text(admin);
  check("required fields checked", /Enter the SMTP server/.test(t) && /Enter the username/.test(t) && /Enter the password/.test(t));

  section("Gmail preset");
  await admin.$$eval("button", (bs) => bs.find((b) => /Gmail/.test(b.textContent))?.click());
  await sleep(300);
  check("preset fills server and port",
    (await admin.$eval("#f-host", (e) => e.value)) === "smtp.gmail.com" && (await admin.$eval("#f-port", (e) => e.value)) === "465");

  section("Test email (not saved yet)");
  const fill = async (sel, v) => { await admin.$eval(sel, (e) => { e.value = ""; }); await admin.type(sel, v); };
  await fill("#f-host", "127.0.0.1");
  await pickOption(admin, "#f-security", "None (not recommended)");
  await admin.$eval("#f-port", (e) => { e.focus(); e.select(); });
  await admin.keyboard.type("2525");
  await fill("#f-user", "qa@example.com");
  await fill("#f-pass", PASSWORD);
  await fill("#f-fromName", "Ukvalley QA");
  await fill("#f-testTo", TEST_TO);
  await admin.$$eval("button[type=submit]", (bs) => bs.find((b) => /Send test email/.test(b.textContent))?.click());
  for (let i = 0; i < 20 && !mails.some((m) => m.to.includes(TEST_TO)); i++) await sleep(500);
  const test = mails.find((m) => m.to.includes(TEST_TO));
  check("test email delivered", !!test);
  check("test email from the sender name", !!test && /From: "?Ukvalley QA"? <qa@example\.com>/.test(test.body), test?.body.match(/^From:.*$/m)?.[0]);
  check("nothing saved by a test", !(await db.collection("settings").findOne({ _id: "smtp" })));

  section("Save");
  await fill("#f-pass", PASSWORD);
  await admin.$$eval("button[type=submit]", (bs) => bs.find((b) => /Save settings/.test(b.textContent))?.click());
  await sleep(2500);
  const doc = await db.collection("settings").findOne({ _id: "smtp" });
  check("settings saved", doc?.host === "127.0.0.1" && doc?.port === 2525 && doc?.security === "none" && doc?.user === "qa@example.com");
  check("password stored encrypted (not plain text)", !!doc?.passEnc && !JSON.stringify(doc).includes(PASSWORD) && !("pass" in (doc ?? {})));
  await go(admin, "/admin/settings/email");
  t = await text(admin);
  check("status shows the saved settings are used", /using the settings saved here/.test(t) && /127\.0\.0\.1:2525/.test(t), t.slice(0, 300));
  check("password never sent back to the page", !(await admin.content()).includes(PASSWORD));

  section("Saved settings send real emails");
  // Keep the saved password (blank field) and send another test.
  const before = mails.length;
  await admin.$$eval("button[type=submit]", (bs) => bs.find((b) => /Send test email/.test(b.textContent))?.click());
  for (let i = 0; i < 20 && mails.length === before; i++) await sleep(500);
  check("blank password keeps the saved one", mails.length === before + 1);

  // The careers form's thank-you goes out through the saved settings (no SMTP_* env vars on this server).
  await db.collection("applications").deleteMany({ email: "qa.smtp.applicant@example.com" });
  const page = await newPage(browser);
  await go(page, "/careers");
  const role = await page.$eval("#open-roles li h3", (e) => e.textContent.trim());
  const res = await page.evaluate(async (role) => {
    const fd = new FormData();
    Object.entries({ name: "Smtp Applicant", email: "qa.smtp.applicant@example.com", phone: "98765 43210", location: "Pune", position: role, experience: "1–2 years", portfolio: "", coverLetter: "" })
      .forEach(([k, v]) => fd.append(k, v));
    fd.append("resume", new File(["%PDF-1.4\n%%EOF\n"], "cv.pdf", { type: "application/pdf" }));
    const r = await fetch("/careers/apply", { method: "POST", body: fd });
    return r.status;
  }, role);
  for (let i = 0; i < 20 && !mails.some((m) => m.to.includes("qa.smtp.applicant@example.com")); i++) await sleep(500);
  check("application emails use the saved settings", res === 200 && mails.some((m) => m.to.includes("qa.smtp.applicant@example.com")), `status ${res}`);

  section("Remove");
  admin.on("dialog", (d) => d.accept());
  await admin.$$eval("button", (bs) => bs.find((b) => /Remove saved settings/.test(b.textContent))?.click());
  await sleep(2500);
  check("settings removed", !(await db.collection("settings").findOne({ _id: "smtp" })));
  await go(admin, "/admin/settings/email");
  // The page streams in after its database read (a loading skeleton shows first).
  await admin.waitForFunction(() => /Email is (on|off)/.test(document.body.innerText), { timeout: 30000 }).catch(() => {});
  t = await text(admin);
  if (process.env.QA_DEBUG) {
    await admin.screenshot({ path: process.env.QA_DEBUG + "/smtp-after-remove.png" });
    console.log("HTML has 'Email is off':", (await admin.content()).includes("Email is off"), "| main:", await admin.evaluate(() => document.querySelector("main")?.innerHTML.slice(0, 400)));
  }
  check("email off again", /Email is off/.test(t), `${admin.url()} :: ${t.replace(/\s+/g, " ").slice(0, 500)}`);

  section("Access");
  const anon = await fetch(`${process.env.QA_BASE || "http://localhost:3100"}/admin/settings/email`, { redirect: "manual" });
  check("signed-out visitors are sent to login", anon.status >= 300 && anon.status < 400);

  check("no browser errors", admin.problems.length === 0, admin.problems.join(" | "));
} finally {
  await browser.close();
  await db.collection("settings").deleteOne({ _id: "smtp" });
  await db.collection("applications").deleteMany({ email: "qa.smtp.applicant@example.com" });
  await db.collection("resumes.files").deleteMany({ filename: "cv.pdf" });
  await mongo.close();
  smtp.close();
  summary();
}
