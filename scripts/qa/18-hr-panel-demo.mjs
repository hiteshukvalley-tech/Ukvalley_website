// QA: a full demo of the HR panel and one AI interview, A to Z, with screenshots.
//
//   candidate applies → HR panel lists the application → HR moves the interview to now →
//   candidate takes it in Chrome (fake camera and microphone): consent, device check,
//   answers (a reload mid-question keeps the typed draft and doesn't use up a resume),
//   test, a reload on the last screen goes straight to Submit, submit → evaluation →
//   HR reviews it in the panel (every HR page on desktop and phone width), comments,
//   shortlists → an HR team member (HR access only) can open the HR pages and nothing else.
//
// Same server setup as 16-ai-interviews.mjs (scratch database ukvalley_ai_qa, mock AI,
// fake SMTP on :2525). Screenshots go to QA_SHOTS (default: ./qa-shots). Test data is
// removed at the end.
import net from "node:net";
import { mkdirSync } from "node:fs";
import { randomBytes, scrypt } from "node:crypto";
import puppeteer from "puppeteer-core";
import { MongoClient } from "mongodb";
import { BASE, OWNER, check, launch, login, logout, newPage, section, sleep, summary } from "./lib.mjs";

const QA_URI = process.env.QA_MONGODB_URI || "mongodb://127.0.0.1:27099";
const QA_DB = process.env.QA_DB || "ukvalley_ai_qa";
if (!QA_DB.endsWith("_qa")) throw new Error(`Refusing to run against "${QA_DB}": use a scratch *_qa database.`);
const CHROME = process.env.CHROME_PATH || "C:/Program Files/Google/Chrome/Application/chrome.exe";
const SHOTS = process.env.QA_SHOTS || "qa-shots";
mkdirSync(SHOTS, { recursive: true });
let shotN = 0;
const shot = async (page, name, fullPage = true) => {
  const file = `${SHOTS}/${String(++shotN).padStart(2, "0")}-${name}.png`;
  await page.screenshot({ path: file, fullPage }).catch(() => {});
  return file;
};

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
        if (line === ".") {
          inData = false;
          mails.push(msg);
          msg = { to: [], body: "" };
          sock.write("250 OK\r\n");
        } else msg.body += line + "\n";
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
const plain = (body) => body.replace(/=\r?\n/g, "").replace(/=3D/gi, "=");
const linkFor = (addr) => mails.filter((m) => m.to.some((t) => t.includes(addr))).map((m) => plain(m.body).match(/\/interview\/([A-Za-z0-9_-]{20,})/)?.[1]).filter(Boolean).at(-1) ?? null;
async function until(fn, ms = 60_000, every = 1000) {
  const end = Date.now() + ms;
  for (;;) {
    const v = await fn();
    if (v) return v;
    if (Date.now() > end) return null;
    await sleep(every);
  }
}
const hashPassword = (pw) =>
  new Promise((resolve, reject) => {
    const salt = randomBytes(16);
    scrypt(pw.normalize("NFKC"), salt, 64, { N: 16384, r: 8, p: 1 }, (e, key) => (e ? reject(e) : resolve(["scrypt", 16384, 8, 1, salt.toString("base64"), key.toString("base64")].join("$"))));
  });

const client = await MongoClient.connect(QA_URI);
const db = client.db(QA_DB);
const email = `demo-${Date.now()}@example.com`;
const hrUser = { email: `hr-${Date.now()}@example.com`, password: "Hr-demo-passphrase-2026!" };
let adminBrowser;
let candBrowser;
let id = null;

/** Every admin page a visitor can reach from the sidebar, with problems found on it. */
async function visit(page, path, name, { phone = false } = {}) {
  page.problems.length = 0;
  if (phone) await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  const r = await page.goto(BASE + path, { waitUntil: "networkidle2", timeout: 60_000 }).catch(() => null);
  await sleep(400);
  const info = await page.evaluate(() => ({
    text: document.body.innerText,
    overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    // Text cut off at the screen's right edge (hidden overflow doesn't scroll, so it isn't in scrollWidth).
    // Content inside its own horizontal scroller (a wide table) is fine.
    clipped: [...document.querySelectorAll("main h1, main h2, main h3, main p, main li, main dd, main label, main button")]
      .filter((e) => {
        const r = e.getBoundingClientRect();
        if (!r.width || !r.height || r.right <= window.innerWidth + 1) return false;
        for (let p = e.parentElement; p && p !== document.body; p = p.parentElement) {
          const s = getComputedStyle(p);
          if ((s.overflowX === "auto" || s.overflowX === "scroll") && p.getBoundingClientRect().right <= window.innerWidth + 1) return false;
        }
        return true;
      })
      .slice(0, 3)
      .map((e) => e.textContent.trim().slice(0, 40)),
    h1: document.querySelector("h1")?.textContent?.trim() ?? "",
  }));
  await shot(page, name);
  if (phone) await page.setViewport({ width: 1366, height: 900 });
  const errors = page.problems.filter((p) => !/favicon|\/_next\/image|Download the React DevTools/.test(p));
  return { status: r?.status() ?? 0, url: page.url(), ...info, errors };
}

try {
  section("Setup");
  await db.collection("aiInterviewSettings").updateOne(
    { _id: "global" },
    {
      $set: {
        settings: {
// startRightAway (on by default) sends the invitation inviteDelayMinutes after
          // applying (default 2); 0 sends it at once, so the suite needn't wait.
          startRightAway: true, inviteDelayMinutes: 0,
          enabled: true, autoSchedule: true, questionCount: 5, maxFollowUps: 1, candidateReschedules: 1, maxResumes: 1,
          mcqEnabled: true, mcqCount: 3, mcqMinutes: 3, recordVideo: true,
          channels: { email: true, whatsapp: false, calendar: false },
        },
        templates: {}, updatedAt: new Date(), updatedBy: "qa",
      },
    },
    { upsert: true }
  );
  await db.collection("adminUsers").insertOne({
    _id: `qa-hr-${Date.now()}`, email: hrUser.email, name: "Priya HR (demo)", role: "editor", title: "HR",
    access: ["careers", "applications", "ai-interviews"], passwordHash: await hashPassword(hrUser.password),
    active: true, sessionVersion: 1, createdAt: new Date(),
  });
  check("demo settings and an HR team member ready", true);
  await sleep(31_000); // the server caches the AI settings for 30 s

  // --- 1. the candidate applies on the careers page ----------------------------------------------
  section("1. Candidate applies");
  const fd = new FormData();
  const fields = {
    name: "Rahul Demo Sharma", email, phone: "+91 98111 22233", location: "Pune", position: "Senior React / Next.js Engineer",
    experience: "4–6 years", source: "LinkedIn", currentCompany: "Acme Software", skills: "React, Next.js, Node.js, MongoDB",
    education: "B.E. Computer Engineering", timeZone: "Asia/Kolkata", coverLetter: "I enjoy building fast web apps.", whatsappOptIn: "",
  };
  for (const [k, v] of Object.entries(fields)) fd.append(k, v);
  const pdf = "%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[]/Count 0>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF\n";
  fd.append("resume", new Blob([pdf], { type: "application/pdf" }), "resume.pdf");
  const enc = new Response(fd);
  const body = Buffer.from(await enc.arrayBuffer());
  const applyRes = await fetch(`${BASE}/careers/apply`, { method: "POST", headers: { "Content-Type": enc.headers.get("content-type"), "Content-Length": String(body.length), Origin: BASE }, body });
  check("application accepted", applyRes.ok);
  const created = await until(() => db.collection("aiInterviews").findOne({ "candidate.email": email }), 30_000);
  check("AI interview created automatically", !!created);
  if (!created) throw new Error("no interview: stopping");
  id = created._id;
  const firstLink = await until(() => linkFor(email), 60_000);
  check("interview scheduled and invitation emailed", !!firstLink);
  const mail = mails.find((m) => m.to.some((t) => t.includes(email)) && /\/interview\//.test(plain(m.body)));
  check("invitation email names the job and has the link", /Senior React/.test(plain(mail?.body ?? "")));
  check("the applicant also got the careers thank-you email", mails.some((m) => m.to.some((t) => t.includes(email)) && !/\/interview\//.test(plain(m.body))));

  // --- 2. HR sees it and moves it to now ---------------------------------------------------------
  section("2. HR panel: application and interview");
  adminBrowser = await launch();
  const admin = await newPage(adminBrowser);
  await login(admin, OWNER);
  const api = (method, path, payload) =>
    admin.evaluate(async (m, p, b) => {
      const r = await fetch(p, { method: m, headers: b ? { "Content-Type": "application/json" } : {}, body: b ? JSON.stringify(b) : undefined });
      return { status: r.status, json: await r.json().catch(() => null) };
    }, method, path, payload ?? null);

  const apps = await visit(admin, "/admin/applications", "hr-applications");
  check("Job applications counts the new application for its role", apps.status === 200 && /Senior React \/ Next\.js Engineer/.test(apps.text) && /1 new/.test(apps.text), `${apps.status}`);
  const applicants = await visit(admin, "/admin/applications/applicants", "hr-applicants");
  check("Applicants lists the new applicant", applicants.status === 200 && /Rahul Demo Sharma/.test(applicants.text), `${applicants.status}`);
  const sched = await visit(admin, "/admin/ai-interviews/schedule", "hr-ai-schedule");
  check("AI interview schedule lists the interview", /Rahul Demo Sharma/.test(sched.text));
  const re = await api("PUT", `/admin/api/ai-interviews/${id}/reschedule`, { startsAt: new Date(Date.now() + 60_000).toISOString() });
  check("HR moves the interview to now (new link sent)", re.status === 200, `${re.status} ${re.json?.error ?? ""}`);
  const link = await until(() => {
    const l = linkFor(email);
    return l && l !== firstLink ? l : null;
  }, 60_000);
  check("rescheduled email with a new link", !!link);
  const oldPage = await fetch(`${BASE}/interview/${firstLink}`).then((r) => r.text());
  check("the first link stopped working", /not valid/i.test(oldPage));

  // --- 3. the candidate takes the interview -----------------------------------------------------------
  section("3. Candidate takes the interview");
  candBrowser = await puppeteer.launch({
    executablePath: CHROME, headless: true,
    args: ["--no-sandbox", "--use-fake-device-for-media-stream", "--use-fake-ui-for-media-stream", "--autoplay-policy=no-user-gesture-required", "--window-size=1366,900"],
    defaultViewport: { width: 1366, height: 900 },
  });
  const cand = await candBrowser.newPage();
  const candErrors = [];
  const candWarnings = [];
  cand.on("pageerror", (e) => candErrors.push(e.message.slice(0, 200)));
  cand.on("console", (m) => { if (/camera\/microphone check failed/.test(m.text())) candWarnings.push(m.text().slice(0, 200)); });
  const url = `${BASE}/interview/${link}`;
  const bodyText = () => cand.evaluate(() => document.body.innerText);
  const click = (re) => cand.evaluate((src) => {
    const b = [...document.querySelectorAll("button")].find((x) => new RegExp(src, "i").test(x.textContent) && !x.disabled);
    b?.click();
    return !!b;
  }, re.source);

  // phone width first: the welcome screen must work on a phone too
  await cand.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  await cand.goto(url, { waitUntil: "networkidle2" });
  const phoneOverflow = await cand.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  await shot(cand, "candidate-welcome-phone");
  check("welcome screen fits a phone (no sideways scroll)", phoneOverflow <= 1, `${phoneOverflow}px`);
  await cand.setViewport({ width: 1366, height: 900 });
  await cand.reload({ waitUntil: "networkidle2" });
  await shot(cand, "candidate-welcome");
  check("welcome screen greets the candidate", /Hello Rahul/.test(await bodyText()));

  for (const box of await cand.$$("fieldset input[type=checkbox]")) await box.click();
  await click(/^I agree$/);
  check("consent saved", !!(await until(async () => /consent is saved/i.test(await bodyText()), 10_000, 300)));
  await click(/Turn on camera and microphone/);
  check("camera and microphone check passes", !!(await until(async () => /Microphone works/i.test(await bodyText()), 20_000, 300)));
  await shot(cand, "candidate-device-check");
  await click(/Start interview/);
  check("first question shown", !!(await cand.waitForSelector("#answer", { timeout: 60_000 }).catch(() => null)));
  await sleep(800);
  await shot(cand, "candidate-question-1");

  // A reload in the middle of an answer: the typed draft comes back, no resume is used up.
  const draft = "Draft kept across a reload: I led a Next.js migration";
  await cand.type("#answer", draft);
  await sleep(700);
  await cand.reload({ waitUntil: "networkidle2" });
  const afterReload = await bodyText();
  check("after a reload the candidate continues where they stopped", /continue|Welcome back|Hello Rahul/i.test(afterReload), afterReload.slice(0, 120));
  await click(/Turn on camera and microphone/);
  let camOk = await until(async () => /Microphone works/i.test(await bodyText()), 15_000, 300);
  // Like a candidate would: press "Check again" if the first check failed.
  for (let n = 0; !camOk && n < 3; n++) {
    await click(/Check again/);
    camOk = await until(async () => /Microphone works/i.test(await bodyText()), 10_000, 300);
  }
  check("after the reload the camera works again", !!camOk, candWarnings.slice(-2).join(" | "));
  await click(/Continue interview|Start interview/);
  await cand.waitForSelector("#answer", { timeout: 30_000 }).catch(() => null);
  const restored = await cand.evaluate(() => document.querySelector("#answer")?.value ?? "");
  check("the typed answer was kept as a draft", restored.includes("Draft kept across a reload"), restored.slice(0, 80));
  const doc1 = await db.collection("aiInterviews").findOne({ _id: id });
  check("a reload with nothing new answered doesn't use up a resume", (doc1?.resumes ?? 0) === 0, `resumes ${doc1?.resumes}`);
  await cand.evaluate(() => { const a = document.querySelector("#answer"); if (a) { const set = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value").set; set.call(a, ""); a.dispatchEvent(new Event("input", { bubbles: true })); } });

  let answered = 0;
  for (let n = 0; n < 20; n++) {
    const onQuestion = await cand.evaluate(() => !!document.querySelector("#answer"));
    if (!onQuestion) break;
    const before = await cand.evaluate(() => document.querySelector("h1")?.textContent ?? "");
    await cand.type("#answer", `Answer ${n + 1}: I built React and Next.js apps with server rendering, hooks and MongoDB indexes, and measured the results.`);
    await click(/Submit answer/);
    await until(async () => (await cand.evaluate(() => document.querySelector("h1")?.textContent ?? "")) !== before, 30_000, 300);
    answered++;
  }
  check("every question answered", answered >= 5, `${answered}`);
  await shot(cand, "candidate-test-intro");
  if (await click(/Start the test/)) {
    await cand.waitForSelector("input[type=radio]", { timeout: 20_000 });
    await cand.evaluate(() => document.querySelectorAll("fieldset").forEach((f) => f.querySelector("input[type=radio]")?.click()));
    await shot(cand, "candidate-test");
    await click(/Submit test/);
    check("test submitted", !!(await until(async () => /Submit interview/.test(await bodyText()), 20_000, 300)));
  } else check("test shown", false);
  await shot(cand, "candidate-finish");

  // A reload on the last screen goes straight to Submit (no camera check, can't be locked out).
  await cand.reload({ waitUntil: "networkidle2" });
  check("after a reload on the last screen, Submit is shown straight away", /Submit interview/.test(await bodyText()), (await bodyText()).slice(0, 120));
  await click(/Submit interview/);
  check("interview complete", !!(await until(async () => /interview is complete/i.test(await bodyText()), 120_000, 500)));
  await shot(cand, "candidate-complete");
  check("no script errors on the candidate's pages", candErrors.length === 0, candErrors.join(" | "));
  const thanks = await until(() => mails.some((m) => m.to.some((t) => t.includes(email)) && /Thank you for completing/i.test(plain(m.body))), 60_000);
  check("thank-you email sent to the candidate", !!thanks);

  // --- 4. evaluation -------------------------------------------------------------------------------
  section("4. AI evaluation");
  const evaluated = await until(async () => {
    const d = await db.collection("aiInterviews").findOne({ _id: id });
    return d?.evaluation?.state === "done" ? d : null;
  }, 120_000, 1500);
  check("evaluation finished", !!evaluated);
  check("overall score between 0 and 100", typeof evaluated?.evaluation?.result?.overall === "number" && evaluated.evaluation.result.overall >= 0 && evaluated.evaluation.result.overall <= 100, `${evaluated?.evaluation?.result?.overall}`);

  // --- 5. HR reviews: every HR page ----------------------------------------------------------------------
  section("5. HR panel A to Z (owner)");
  const hrPages = [
    ["/admin", "dashboard"],
    ["/admin/careers", "job-openings"],
    ["/admin/careers/recycle", "recycle-openings"],
    ["/admin/applications", "job-applications"],
    ["/admin/applications/status", "application-status"],
    ["/admin/applications/applicants", "applicants"],
    ["/admin/todays-applications", "todays-applications"],
    ["/admin/interviews", "daily-interviews"],
    ["/admin/email-logs", "email-logs"],
    ["/admin/ai-interviews", "ai-dashboard"],
    ["/admin/ai-interviews/schedule", "ai-schedule"],
    [`/admin/ai-interviews/${id}`, "ai-interview-detail"],
    ["/admin/ai-interviews/compare", "ai-compare"],
    [`/admin/ai-interviews/compare?position=${encodeURIComponent("Senior React / Next.js Engineer")}`, "ai-compare-position"],
    ["/admin/ai-interviews/notifications", "ai-notifications"],
    ["/admin/ai-interviews/settings", "ai-settings"],
    ["/admin/settings/api-keys", "api-keys"],
    ["/admin/users", "users"],
    ["/admin/profile", "my-profile"],
  ];
  const appId = created.applicationId;
  if (appId) hrPages.splice(4, 0, [`/admin/applications/${appId}`, "application-detail"]);
  for (const [path, name] of hrPages) {
    const v = await visit(admin, path, `owner-${name}`);
    const broken = /Application error|Something went wrong|Could not read|Unhandled Runtime Error|This page could not be found/i.test(v.text);
    check(`${path} works`, v.status === 200 && !broken && v.errors.length === 0, `${v.status} ${broken ? "error text on page" : ""} ${v.errors.slice(0, 3).join(" | ")}`);
    if (v.overflow > 1) check(`${path} has no sideways scroll on desktop`, false, `${v.overflow}px`);
  }
  for (const [path, name] of [
    ["/admin/ai-interviews", "ai-dashboard"], ["/admin/ai-interviews/schedule", "ai-schedule"], [`/admin/ai-interviews/${id}`, "ai-interview-detail"],
    ["/admin/ai-interviews/settings", "ai-settings"], ["/admin/ai-interviews/notifications", "ai-notifications"], ["/admin/ai-interviews/compare", "ai-compare"],
    ["/admin/applications", "job-applications"], ["/admin/applications/applicants", "applicants"], ...(appId ? [[`/admin/applications/${appId}`, "application-detail"]] : []),
    ["/admin/careers", "job-openings"], ["/admin/interviews", "daily-interviews"], ["/admin/email-logs", "email-logs"],
  ]) {
    const v = await visit(admin, path, `phone-${name}`, { phone: true });
    check(`${path} fits a phone screen`, v.overflow <= 1 && v.status === 200, `${v.overflow}px`);
    check(`${path}: no text cut off at the edge on a phone`, v.clipped.length === 0, v.clipped.join(" | "));
  }

  // The interview page has what HR needs to decide.
  const detail = await visit(admin, `/admin/ai-interviews/${id}`, "owner-interview-review");
  for (const [label, re] of [["the overall score", /\/100|Overall/i], ["the recommendation", /Recommended|Hold|Not recommended|Strongly/i], ["the transcript", /Transcript/i], ["the recording", /Recording/i], ["the audit trail", /Audit|History|Activity/i], ["Quick actions", /Quick actions/i]]) {
    check(`interview page shows ${label}`, re.test(detail.text));
  }
  const player = await admin.$("video");
  check("the recording player is on the page", !!player);

  // HR decides through the panel's own API (same calls the buttons make).
  const comment = await api("PUT", `/admin/api/ai-interviews/${id}/decision`, { decision: "comment", note: "Strong React answers; check system design in round 2." });
  check("HR adds a comment", comment.status === 200, `${comment.status} ${comment.json?.error ?? ""}`);
  const shortlist = await api("PUT", `/admin/api/ai-interviews/${id}/decision`, { decision: "shortlist", note: "Demo shortlist" });
  check("HR shortlists the candidate", shortlist.status === 200, `${shortlist.status} ${shortlist.json?.error ?? ""}`);
  const app = appId ? await db.collection("applications").findOne({ _id: appId }) ?? await db.collection("applications").findOne({ id: appId }) : null;
  check("the application moved to Shortlisted", app?.status === "shortlisted", `${app?.status}`);
  const afterDecision = await visit(admin, `/admin/ai-interviews/${id}`, "owner-after-decision");
  check("the decision shows on the interview page", /shortlist/i.test(afterDecision.text));
  const csv = await admin.evaluate(async () => { const r = await fetch("/admin/ai-interviews/export"); return { s: r.status, t: await r.text() }; });
  check("CSV export includes the candidate", csv.s === 200 && csv.t.includes("Rahul Demo Sharma"));

  // --- 6. an HR team member -------------------------------------------------------------------------------
  section("6. HR team member (HR access only)");
  await logout(admin);
  await login(admin, hrUser);
  const hrHome = await visit(admin, "/admin", "hr-member-dashboard");
  check("HR member can sign in", hrHome.status === 200 && !/\/admin\/login/.test(hrHome.url), hrHome.url);
  for (const path of ["/admin/careers", "/admin/applications", "/admin/ai-interviews", "/admin/ai-interviews/schedule", `/admin/ai-interviews/${id}`, "/admin/ai-interviews/notifications"]) {
    const v = await visit(admin, path, `hr-member-${path.split("/").filter(Boolean).slice(1).join("-") || "home"}`);
    check(`HR member opens ${path}`, v.status === 200 && !/don.t have access|not allowed|Forbidden/i.test(v.text) && !/\/admin\/login/.test(v.url), `${v.status} ${v.url}`);
  }
  for (const path of ["/admin/users", "/admin/settings/api-keys", "/admin/leads", "/admin/blog"]) {
    const v = await visit(admin, path, `hr-member-blocked-${path.split("/").pop()}`);
    const blocked = v.status === 403 || v.status === 404 || /don.t have access|not allowed|no access|Forbidden|admins only/i.test(v.text) || !v.url.endsWith(path);
    check(`HR member is kept out of ${path}`, blocked, `${v.status} ${v.url}`);
  }
  const hrApi = await api("GET", "/admin/api/ai-interviews");
  check("HR member can use the AI interview API", hrApi.status === 200, `${hrApi.status}`);
} catch (e) {
  check("demo ran to the end", false, e instanceof Error ? e.message : String(e));
} finally {
  // clean up the demo data
  if (id) {
    const doc = await db.collection("aiInterviews").findOne({ _id: id });
    for (const c of await db.listCollections().toArray()) {
      if (c.name.startsWith("ai") && c.type === "collection") await db.collection(c.name).deleteMany({ $or: [{ interviewId: id }, { _id: id }] }).catch(() => {});
    }
    if (doc?.applicationId) await db.collection("applications").deleteMany({ $or: [{ _id: doc.applicationId }, { id: doc.applicationId }] }).catch(() => {});
  }
  await db.collection("adminUsers").deleteMany({ email: hrUser.email }).catch(() => {});
  await adminBrowser?.close().catch(() => {});
  await candBrowser?.close().catch(() => {});
  await client.close();
  smtp.close();
  console.log(`\nScreenshots: ${SHOTS}`);
  summary();
}
