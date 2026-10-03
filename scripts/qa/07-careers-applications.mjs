// QA: Careers "Apply" popup → saved application → HR + applicant emails → admin.
// Runs its own fake SMTP server on :2525 that captures the emails, so start
// the app pointed at it and at a scratch database:
//   NEXT_DIST_DIR=.next-test MONGODB_DB=ukvalley_qa SMTP_HOST=127.0.0.1 SMTP_PORT=2525 \
//     SMTP_USER=qa@example.com SMTP_PASS=qa npx next start -p 3100
//   node scripts/qa/07-careers-applications.mjs
// Applications and resumes created here are removed at the end.
import net from "node:net";
import { readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { MongoClient } from "mongodb";
import { BASE, check, go, launch, login, newPage, section, sleep, summary, text } from "./lib.mjs";

const QA_DB = process.env.QA_DB || "ukvalley_qa";
if (!QA_DB.endsWith("_qa")) throw new Error(`Refusing to run against "${QA_DB}" — use a scratch *_qa database.`);
const uri = readFileSync(".env.local", "utf8").match(/^MONGODB_URI=(.*)$/m)?.[1];

// --- fake SMTP server -------------------------------------------------------
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
        if (line === ".") {
          inData = false;
          mails.push(msg);
          msg = { to: [], body: "" };
          sock.write("250 OK\r\n");
        } else msg.body += line + "\n";
        continue;
      }
      const cmd = line.slice(0, 4).toUpperCase();
      if (cmd === "EHLO") sock.write("250-qa\r\n250-AUTH PLAIN\r\n250 OK\r\n");
      else if (cmd === "AUTH") sock.write("235 OK\r\n");
      else if (cmd === "RCPT") { msg.to.push((line.match(/<(.*)>/)?.[1] ?? "").toLowerCase()); sock.write("250 OK\r\n"); }
      else if (cmd === "DATA") { inData = true; sock.write("354 go\r\n"); }
      else if (cmd === "QUIT") { sock.write("221 bye\r\n"); sock.end(); }
      else sock.write("250 OK\r\n");
    }
  });
});
await new Promise((r) => smtp.listen(2525, "127.0.0.1", r));
const mailTo = (addr) => mails.filter((m) => m.to.includes(addr.toLowerCase()));
/** The Subject header, with MIME encoded-words (=?UTF-8?Q?…?=) decoded. */
const subjectOf = (m) => {
  const raw = m.body.match(/^Subject: (.*(?:\n[ \t].*)*)/m)?.[1].replace(/\n[ \t]/g, " ") ?? "";
  return raw.replace(/=\?UTF-8\?([QB])\?([^?]*)\?=\s*/gi, (_, enc, s) =>
    enc.toUpperCase() === "B"
      ? Buffer.from(s, "base64").toString("utf8")
      : Buffer.from(s.replace(/_/g, " ").replace(/=([0-9A-F]{2})/gi, (_m, h) => String.fromCharCode(parseInt(h, 16))), "latin1").toString("utf8")
  );
};

// --- test files ---------------------------------------------------------------
const pdfPath = join(tmpdir(), "qa-resume.pdf");
const PDF = "%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[]/Count 0>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF\n";
writeFileSync(pdfPath, PDF);
const fakePdfPath = join(tmpdir(), "qa-not-really.pdf");
writeFileSync(fakePdfPath, "This is plain text pretending to be a PDF.");

const mongo = new MongoClient(uri);
const db = mongo.db(QA_DB);
const cleanup = async () => {
  await db.collection("applications").deleteMany({});
  await db.collection("resumes.files").deleteMany({});
  await db.collection("resumes.chunks").deleteMany({});
};
await cleanup();

const APPLICANT = `qa.applicant.${Date.now()}@example.com`;
const browser = await launch();
try {
  const page = await newPage(browser);

  section("Careers page");
  await go(page, "/careers");
  const roleName = await page.$eval("#open-roles article h3", (e) => e.textContent.trim());
  check("Apply buttons are buttons (no mailto)", !(await page.$('#open-roles a[href^="mailto:"][href*="Application"]')));
  await page.$$eval("#open-roles article button", (b) => b[0].click());
  await page.waitForSelector('[role="dialog"]', { timeout: 10000 });
  check("popup opens with the form title", /Ukvalley Career Application Form/.test(await text(page)));
  check("position prefilled with the clicked role", (await page.$eval("#apply-position", (e) => e.value)) === roleName, roleName);
  const labels = await page.$$eval('[role="dialog"] label', (ls) => ls.map((l) => l.textContent.replace(/\s+/g, " ").trim()));
  for (const want of ["Full Name", "Email Address", "Phone Number", "Current Location", "Position Applied For", "Years Of Experience", "Portfolio / LinkedIn (Optional)", "Upload Resume (PDF Only)", "Cover Letter (Optional)"]) {
    check(`field: ${want}`, labels.some((l) => l.startsWith(want)), labels.join(" | "));
  }
  check("portfolio placeholder https://", (await page.$eval("#apply-portfolio", (e) => e.placeholder)) === "https://");
  check("cover letter placeholder", (await page.$eval("#apply-cover", (e) => e.placeholder)) === "Write your cover letter...");
  check('"No file chosen" shown', /No file chosen/.test(await text(page)));

  section("Validation");
  let posts = 0;
  page.on("request", (r) => { if (r.method() === "POST" && r.url().endsWith("/careers/apply")) posts++; });
  await page.$eval("#apply-position", (e) => { e.value = ""; });
  await page.click('[role="dialog"] button[type=submit]');
  await sleep(400);
  const t = await text(page);
  check("required-field messages", /Please enter your full name/.test(t) && /valid email/.test(t) && /phone number/.test(t) &&
    /current location/.test(t) && /position you're applying for/.test(t) && /years of experience/.test(t) && /upload your resume/.test(t), t.slice(0, 400));
  check("nothing sent while invalid", posts === 0);

  await page.type("#apply-name", "Qa Applicant");
  await page.type("#apply-email", APPLICANT);
  await page.type("#apply-phone", "98765 43210");
  await page.type("#apply-location", "Pune, Maharashtra");
  await page.type("#apply-position", roleName);
  await page.select("#apply-experience", "2–4 years");
  await page.type("#apply-portfolio", "not a link");
  await page.type("#apply-cover", "I build things that ship.\nSecond line.");
  await (await page.$("#apply-resume")).uploadFile(fakePdfPath);
  await page.click('[role="dialog"] button[type=submit]');
  await sleep(400);
  check("bad portfolio link rejected", /full link starting with https/.test(await text(page)));

  await page.$eval("#apply-portfolio", (e) => { e.value = ""; });
  await page.type("#apply-portfolio", "https://www.linkedin.com/in/qa-applicant");
  await page.click('[role="dialog"] button[type=submit]');
  await sleep(2500);
  check("fake PDF rejected by the server", /isn't a valid PDF/.test(await text(page)));
  check("no application saved for the fake PDF", (await db.collection("applications").countDocuments()) === 0);

  section("Submit");
  await (await page.$("#apply-resume")).uploadFile(pdfPath);
  await sleep(200);
  check("chosen file name shown", /qa-resume\.pdf/.test(await text(page)));
  await page.click('[role="dialog"] button[type=submit]');
  await page.waitForFunction(() => /Your application is in/.test(document.body.innerText), { timeout: 30000 }).catch(() => {});
  check("success message", /Thank you, Qa! Your application is in/.test(await text(page)));

  const saved = await db.collection("applications").findOne({ email: APPLICANT });
  check("application saved", !!saved);
  check("all fields stored", saved && saved.name === "Qa Applicant" && saved.phone === "98765 43210" && saved.location === "Pune, Maharashtra" &&
    saved.position === roleName && saved.experience === "2–4 years" && saved.portfolio.includes("linkedin") && saved.coverLetter.includes("Second line") && saved.status === "new");
  check("linked to the open role", !!saved?.careerSlug, String(saved?.careerSlug));
  check("resume stored privately", (await db.collection("resumes.files").countDocuments()) === 1);

  section("Emails");
  for (let i = 0; i < 20 && mails.length < 2; i++) await sleep(500);
  const hrDefault = await (async () => {
    const s = await db.collection("settings").findOne({ _id: "site" });
    return (s?.hr?.email ?? "hr@ukvalley.com").toLowerCase();
  })();
  const toHr = mailTo(hrDefault)[0];
  const toApplicant = mailTo(APPLICANT)[0];
  check(`HR email sent to ${hrDefault}`, !!toHr);
  check("HR email: subject has role and name", !!toHr && subjectOf(toHr) === `New application: ${roleName} — Qa Applicant`, toHr && subjectOf(toHr));
  check("thank-you subject", !!toApplicant && subjectOf(toApplicant) === `We've received your application — ${roleName}`, toApplicant && subjectOf(toApplicant));
  check("HR email: resume attached", !!toHr && /Content-Type: application\/pdf/i.test(toHr.body) && /qa-resume\.pdf/.test(toHr.body));
  check("HR email: reply goes to the applicant", !!toHr && new RegExp(`Reply-To: ${APPLICANT.replace(/\./g, "\\.")}`, "i").test(toHr.body));
  check("thank-you email sent to the applicant", !!toApplicant);
  check('thank-you is from "Ukvalley HR Team"', !!toApplicant && /From: "?Ukvalley HR Team"? </i.test(toApplicant.body));
  check("thank-you: reply goes to HR", !!toApplicant && new RegExp(`Reply-To: ${hrDefault.replace(/\./g, "\\.")}`, "i").test(toApplicant.body));
  await sleep(500);
  const marked = await db.collection("applications").findOne({ email: APPLICANT });
  check("email status recorded", marked?.emails?.hr === true && marked?.emails?.applicant === true, JSON.stringify(marked?.emails));

  section("Duplicate");
  await page.goto(BASE + "/careers", { waitUntil: "networkidle2" });
  await page.$$eval("#open-roles article button", (b) => b[0].click());
  await page.waitForSelector("#apply-name");
  await page.type("#apply-name", "Qa Applicant");
  await page.type("#apply-email", APPLICANT);
  await page.type("#apply-phone", "98765 43210");
  await page.type("#apply-location", "Pune");
  await page.select("#apply-experience", "2–4 years");
  await (await page.$("#apply-resume")).uploadFile(pdfPath);
  await page.click('[role="dialog"] button[type=submit]');
  await sleep(2500);
  check("same role twice is refused", /already applied for this position/.test(await text(page)));
  await page.keyboard.press("Escape");
  await sleep(300);
  check("Escape closes the popup", !(await page.$('[role="dialog"]')));

  section("Resume is private");
  const anon = await fetch(`${BASE}/admin/applications/${saved._id}/resume`, { redirect: "manual" });
  check("signed-out request refused", anon.status === 307 || anon.status === 401, String(anon.status));

  section("Admin");
  const admin = await newPage(browser);
  await login(admin);
  await go(admin, "/admin/applications");
  const at = await text(admin);
  check("listed in admin", at.includes("Qa Applicant"));
  const row = await admin.$$eval("table tbody tr", (rows) => rows.map((r) => [...r.querySelectorAll("td")].map((td) => td.textContent.trim())));
  const roleRow = row.find((r) => r[0].startsWith(roleName));
  check("per-role count = 1 (1 new)", !!roleRow && roleRow[1] === "1" && roleRow[2] === "1", JSON.stringify(roleRow));
  check("open roles listed with 0 too", row.some((r) => r[1] === "0"));
  await go(admin, `/admin/applications?role=${encodeURIComponent(roleName)}`);
  check("filter by role", (await text(admin)).includes("Qa Applicant"));

  await go(admin, `/admin/applications/${saved._id}`);
  const dt = await text(admin);
  check("detail shows every field", ["Qa Applicant", APPLICANT, "98765 43210", "Pune, Maharashtra", roleName, "2–4 years", "linkedin.com/in/qa-applicant", "Second line", "qa-resume.pdf"].every((s) => dt.includes(s)));
  check("email status shown", /To HR: sent/.test(dt) && /Thank-you to applicant: sent/.test(dt));

  const cookies = (await admin.cookies()).map((c) => `${c.name}=${c.value}`).join("; ");
  const res = await fetch(`${BASE}/admin/applications/${saved._id}/resume?download=1`, { headers: { cookie: cookies } });
  const body = Buffer.from(await res.arrayBuffer()).toString();
  check("resume downloads as PDF for admins", res.status === 200 && res.headers.get("content-type") === "application/pdf" && body === PDF);
  check("download has the file name", /attachment; filename="qa-resume\.pdf"/.test(res.headers.get("content-disposition") ?? ""));

  await admin.select('select[name="status"]', "shortlisted");
  await admin.type('textarea[name="note"]', "Strong portfolio.");
  // Not just any submit button: the admin header's "Sign out" is one too.
  await admin.$$eval("button[type=submit]", (bs) => bs.find((b) => /Save changes/.test(b.textContent))?.click());
  await sleep(2000);
  const updated = await db.collection("applications").findOne({ _id: saved._id });
  check("status + note saved", updated?.status === "shortlisted" && updated?.note === "Strong portfolio.");

  await go(admin, "/admin");
  check("dashboard shows new-applications card", /New job applications/i.test(await text(admin)));

  admin.on("dialog", (d) => d.accept());
  await go(admin, `/admin/applications/${saved._id}`);
  await Promise.all([
    admin.waitForNavigation({ waitUntil: "networkidle2", timeout: 30000 }).catch(() => {}),
    admin.$$eval("button", (bs) => bs.find((b) => /Delete application/.test(b.textContent))?.click()),
  ]);
  check("delete removes application and resume",
    (await db.collection("applications").countDocuments({ _id: saved._id })) === 0 && (await db.collection("resumes.files").countDocuments()) === 0);

  check("no browser errors (site)", page.problems.length === 0, page.problems.join(" | "));
  check("no browser errors (admin)", admin.problems.length === 0, admin.problems.join(" | "));
} finally {
  await browser.close();
  await cleanup();
  await mongo.close();
  smtp.close();
  console.log(`\n(base ${BASE}, database ${QA_DB})`);
  summary();
}
