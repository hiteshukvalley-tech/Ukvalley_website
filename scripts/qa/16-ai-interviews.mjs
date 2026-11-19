// QA: the AI interview module end to end, on a throwaway database.
//
//   apply on the careers form → interview created and scheduled → invitation email
//   → HR reschedules through the REST API → candidate opens the link in Chrome with a
//   fake camera and microphone → consent, device check, spoken interview (typed),
//   timed test, submit → recording stored → mock AI evaluation → normalized model
//   collections written → HR REST API: list, detail, dashboard, compare,
//   recordings (playback), notifications, calendar, decision, override, audit
//   → access checks (signed out, cross-site).
//
// Start a local MongoDB and the app pointed at it, with the mock AI and a fake SMTP
// server (this script runs the SMTP server on :2525):
//   mongod --dbpath <empty dir> --port 27099
//   NEXT_DIST_DIR=.next-build MONGODB_URI=mongodb://127.0.0.1:27099 MONGODB_DB=ukvalley_ai_qa \
//     AI_INTERVIEW_PROVIDER=mock SMTP_HOST=127.0.0.1 SMTP_PORT=2525 SMTP_SECURITY=none \
//     SMTP_USER=qa@example.com SMTP_PASS=qa MAIL_FROM=qa@example.com npx next start -p 3100
//   node scripts/qa/16-ai-interviews.mjs
// Every collection is emptied at the end (QA_DROP=1 drops the database).
import net from "node:net";
import puppeteer from "puppeteer-core";
import { MongoClient } from "mongodb";
import { BASE, OWNER, check, launch, login, newPage, section, sleep, summary } from "./lib.mjs";

const QA_URI = process.env.QA_MONGODB_URI || "mongodb://127.0.0.1:27099";
const QA_DB = process.env.QA_DB || "ukvalley_ai_qa";
if (!QA_DB.endsWith("_qa")) throw new Error(`Refusing to run against "${QA_DB}": use a scratch *_qa database.`);
const CHROME = process.env.CHROME_PATH || "C:/Program Files/Google/Chrome/Application/chrome.exe";

// --- fake SMTP server --------------------------------------------------------------------------
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

/** Quoted-printable soft breaks and =3D undone, so links can be read. */
const plain = (body) => body.replace(/=\r?\n/g, "").replace(/=3D/gi, "=");
/** The newest interview link in the emails to this address. */
const linkFor = (addr) => {
  const hits = mails.filter((m) => m.to.includes(addr)).map((m) => plain(m.body).match(/\/interview\/([A-Za-z0-9_-]{20,})/)?.[1]).filter(Boolean);
  return hits.at(-1) ?? null;
};
async function until(fn, ms = 60_000, every = 1000) {
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
let adminBrowser;
let candidateBrowser;

try {
  // --- setup ----------------------------------------------------------------------------------
  section("Setup");
  await db.collection("aiInterviewSettings").updateOne(
    { _id: "global" },
    {
      $set: {
        settings: {
          enabled: true, autoSchedule: true, questionCount: 6, maxFollowUps: 1, candidateReschedules: 1,
          mustAskQuestions: ["behavioral: QA must-ask: tell me about a time you changed your mind."],
          mcqEnabled: true, mcqCount: 3, mcqMinutes: 3, recordVideo: true,
          channels: { email: true, whatsapp: false, calendar: false },
        },
        templates: {},
        updatedAt: new Date(),
        updatedBy: "qa",
      },
    },
    { upsert: true }
  );
  check("AI interviews switched on in the scratch database", true);
  // The server keeps the AI settings in memory for 30 s: wait it out, in case an
  // earlier suite (17) made it cache "switched off".
  await sleep(31_000);

  // --- apply -----------------------------------------------------------------------------------
  section("Candidate applies");
  const email = `ai-qa-${Date.now()}@example.com`;
  const fd = new FormData();
  const fields = {
    name: "Asha QA Rao", email, phone: "+91 98000 00000", location: "Pune", position: "Senior React / Next.js Engineer",
    experience: "4–6 years", source: "LinkedIn", currentCompany: "Acme Software", skills: "React, Next.js, Node.js, MongoDB",
    education: "B.E. Computer Engineering", timeZone: "Asia/Kolkata", coverLetter: "",
  };
  for (const [k, v] of Object.entries(fields)) fd.append(k, v);
  const pdf = "%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[]/Count 0>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF\n";
  fd.append("resume", new Blob([pdf], { type: "application/pdf" }), "resume.pdf");
  const encoded = new Response(fd);
  const body = Buffer.from(await encoded.arrayBuffer());
  const applyRes = await fetch(`${BASE}/careers/apply`, {
    method: "POST",
    headers: { "Content-Type": encoded.headers.get("content-type"), "Content-Length": String(body.length), Origin: BASE },
    body,
  });
  const applyJson = await applyRes.json().catch(() => ({}));
  check("application accepted", applyRes.ok && applyJson.ok, JSON.stringify(applyJson).slice(0, 300));

  const created = await until(() => db.collection("aiInterviews").findOne({ "candidate.email": email }), 30_000);
  check("AI interview session created for the application", !!created);
  if (!created) throw new Error("no interview: stopping");
  const id = created._id;
  check("candidate classified as experienced (4–6 years)", created.experienceType === "experienced", created.experienceType);
  const scheduled = await until(async () => {
    const d = await db.collection("aiInterviews").findOne({ _id: id });
    return d?.status === "scheduled" ? d : null;
  }, 30_000);
  check("interview scheduled automatically", !!scheduled);
  const invite = await until(() => linkFor(email), 60_000);
  check("invitation email with the interview link sent", !!invite);

  // --- HR: REST API ------------------------------------------------------------------------------
  section("HR REST API");
  adminBrowser = await launch();
  const admin = await newPage(adminBrowser);
  await login(admin, OWNER);
  const api = (method, path, payload) =>
    admin.evaluate(
      async (m, p, b) => {
        const r = await fetch(p, { method: m, headers: b ? { "Content-Type": "application/json" } : {}, body: b ? JSON.stringify(b) : undefined });
        return { status: r.status, json: await r.json().catch(() => null) };
      },
      method, path, payload ?? null
    );

  const list = await api("GET", "/admin/api/ai-interviews?q=" + encodeURIComponent(email));
  check("GET list finds the interview", list.status === 200 && list.json?.data?.items?.some((i) => i.id === id), `${list.status}`);
  const item = list.json?.data?.items?.[0] ?? {};
  check("list never exposes the link token or its hash", !("tokenEnc" in item) && !("tokenHash" in item));

  const startsAt = new Date(Date.now() + 2 * 60_000).toISOString();
  const re = await api("PUT", `/admin/api/ai-interviews/${id}/reschedule`, { startsAt });
  check("PUT reschedule moves the interview to now + 2 min", re.status === 200 && re.json?.data?.schedule?.version === 2, JSON.stringify(re.json).slice(0, 200));
  const bad = await api("PUT", `/admin/api/ai-interviews/${id}/reschedule`, { startsAt: "tomorrow" });
  check("PUT reschedule rejects an invalid date (422)", bad.status === 422);
  const newLink = await until(() => {
    const l = linkFor(email);
    return l && l !== invite ? l : null;
  }, 60_000);
  check("rescheduled email carries a new link (old one revoked)", !!newLink);

  const anon = await fetch(`${BASE}/admin/api/ai-interviews`);
  check("signed out: 401 JSON, not a redirect", anon.status === 401 && (await anon.json()).ok === false, `${anon.status}`);
  const cookie = (await admin.cookies()).map((c) => `${c.name}=${c.value}`).join("; ");
  const xsite = await fetch(`${BASE}/admin/api/ai-interviews/${id}/reminder`, { method: "POST", headers: { Cookie: cookie, Origin: "https://evil.example" } });
  check("cross-site write refused (403)", xsite.status === 403, `${xsite.status}`);
  const cal = await api("GET", "/admin/api/ai-interviews/calendar");
  check("GET calendar status answers (not configured here)", cal.status === 200 && cal.json?.data?.configured === false);

  // --- candidate takes the interview --------------------------------------------------------------
  section("Candidate portal");
  candidateBrowser = await puppeteer.launch({
    executablePath: CHROME,
    headless: true,
    args: ["--no-sandbox", "--use-fake-device-for-media-stream", "--use-fake-ui-for-media-stream", "--autoplay-policy=no-user-gesture-required", "--window-size=1366,900"],
    defaultViewport: { width: 1366, height: 900 },
  });
  const cand = await candidateBrowser.newPage();
  const candProblems = [];
  cand.on("pageerror", (e) => candProblems.push(e.message.slice(0, 200)));
  const uploads = [];
  cand.on("response", (r) => {
    if (r.url().includes("/api/recording")) uploads.push(r.status());
  });
  if (process.env.QA_DEBUG) cand.on("console", (m) => console.log("    [portal]", m.type(), m.text().slice(0, 200)));
  const old = await cand.goto(`${BASE}/interview/${invite}`, { waitUntil: "networkidle2" });
  check("old link no longer works", /not valid/i.test(await cand.evaluate(() => document.body.innerText)), `${old?.status()}`);
  await cand.goto(`${BASE}/interview/${newLink}`, { waitUntil: "networkidle2" });
  const clickText = (re) => cand.evaluate((src) => {
    const b = [...document.querySelectorAll("button")].find((x) => new RegExp(src, "i").test(x.textContent) && !x.disabled);
    b?.click();
    return !!b;
  }, re.source);
  const bodyText = () => cand.evaluate(() => document.body.innerText);
  check("welcome screen shows the candidate and the position", /Hello Asha/.test(await bodyText()) && /Senior React/.test(await bodyText()));
  check("Start is disabled before consent and device check", await cand.evaluate(() => [...document.querySelectorAll("button")].find((b) => /Start interview/.test(b.textContent))?.disabled === true));

  for (const box of await cand.$$("fieldset input[type=checkbox]")) await box.click();
  await clickText(/^I agree$/);
  check("consent saved", !!(await until(async () => /consent is saved/i.test(await bodyText()), 10_000, 300)));
  await clickText(/Turn on camera and microphone/);
  check("camera preview and microphone level work (fake devices)", !!(await until(async () => /Microphone works/i.test(await bodyText()), 20_000, 300)));
  await clickText(/Start interview/);
  check("interview started: first question shown", !!(await cand.waitForSelector("#answer", { timeout: 60_000 }).catch(() => null)));

  // While the candidate is answering, HR can't swap the link from under them.
  const midRe = await api("PUT", `/admin/api/ai-interviews/${id}/reschedule`, { startsAt: new Date(Date.now() + 3600_000).toISOString() });
  check("reschedule refused while the interview is running", midRe.status === 400 && /taking this interview right now/.test(midRe.json?.error ?? ""), `${midRe.status} ${midRe.json?.error ?? ""}`);
  const midDoc = await db.collection("aiInterviews").findOne({ _id: id });
  check("the running interview kept its link and status", midDoc?.status === "in_progress" && midDoc?.schedule?.version === 2, `${midDoc?.status} v${midDoc?.schedule?.version}`);
  check("the first question's asked time is saved", !!midDoc?.questions?.[0]?.askedAt);

  let answered = 0;
  for (let n = 0; n < 20; n++) {
    const phase = await cand.evaluate(() => (document.querySelector("#answer") ? "q" : /Start the test/.test(document.body.innerText) ? "test" : /Submit interview/.test(document.body.innerText) ? "finish" : "other"));
    if (phase !== "q") break;
    const before = await cand.evaluate(() => document.querySelector("h1")?.textContent ?? "");
    await cand.type("#answer", "I built a React and Next.js dashboard used by many customers; I used hooks, server rendering and MongoDB indexes.");
    await clickText(/Submit answer/);
    await until(async () => (await cand.evaluate(() => document.querySelector("h1")?.textContent ?? "")) !== before, 30_000, 300);
    answered++;
  }
  check("answered every spoken question", answered >= 6, `${answered} answered`);

  if (await clickText(/Start the test/)) {
    await cand.waitForSelector("input[type=radio]", { timeout: 20_000 });
    await cand.evaluate(() => document.querySelectorAll("fieldset").forEach((f) => f.querySelector("input[type=radio]")?.click()));
    await clickText(/Submit test/);
    check("timed test submitted", !!(await until(async () => /Submit interview/.test(await bodyText()), 20_000, 300)));
  } else check("timed test shown", false);

  await clickText(/Submit interview/);
  check("completion screen", !!(await until(async () => /interview is complete/i.test(await bodyText()), 120_000, 500)));
  check("recording chunks uploaded while the interview ran", uploads.length > 0 && uploads.every((x) => x === 200), `statuses: ${uploads.join(",") || "none"}`);
  check("no script errors in the portal", candProblems.length === 0, candProblems.join(" | "));

  // --- evaluation and models -------------------------------------------------------------------------
  section("Evaluation and data models");
  const done = await until(async () => {
    const d = await db.collection("aiInterviews").findOne({ _id: id });
    return d?.evaluation?.state === "done" ? d : null;
  }, 120_000, 2000);
  check("mock AI evaluation finished", !!done);
  check("recording stored (encrypted chunks)", (done?.recording?.chunks ?? 0) > 0, `${done?.recording?.chunks} chunks`);
  check("test score saved", typeof done?.mcq?.score === "number");

  await until(async () => {
    const d = await db.collection("aiInterviews").findOne({ _id: id });
    return d?.modelsSyncedAt && d.modelsSyncedAt >= d.updatedAt;
  }, 30_000, 500);
  const s = await db.collection("aiInterviews").findOne({ _id: id });
  check("session linked to candidate, job and configuration", !!(s.candidateId && s.jobId && s.configId), JSON.stringify({ c: s.candidateId, j: s.jobId, cfg: s.configId }));
  const by = { interviewId: id };
  const counts = {
    questions: await db.collection("aiInterviewQuestions").countDocuments(by),
    answers: await db.collection("aiInterviewAnswers").countDocuments(by),
  };
  check("InterviewQuestions: spoken + test questions", counts.questions === s.questions.length + s.mcq.questions.length, JSON.stringify(counts));
  check("InterviewAnswers: spoken + test answers", counts.answers === s.answers.length + s.mcq.questions.length, JSON.stringify(counts));
  const tr = await db.collection("aiInterviewTranscripts").findOne({ _id: id });
  check("InterviewTranscripts: interviewer and candidate turns", tr?.entries?.length === s.answers.length * 2, `${tr?.entries?.length}`);
  const tr2 = await db.collection("aiInterviewTranscripts").findOne({ _id: id });
  const asked = (tr2?.entries ?? []).filter((e) => e.speaker === "interviewer");
  check("transcript: every interviewer turn has its time", asked.length > 0 && asked.every((e) => e.at), `${asked.filter((e) => !e.at).length} of ${asked.length} without a time`);
  const ev = await db.collection("aiInterviewEvaluations").findOne({ _id: id });
  check("InterviewEvaluations: overall score and recommendation", typeof ev?.overall === "number" && !!ev?.recommendation);
  const rs = await db.collection("aiInterviewRecordingSets").findOne({ _id: id });
  check("InterviewRecordings: stored, with consent", rs?.status === "stored" && !!rs?.consent);
  const cd = await db.collection("aiCandidates").findOne({ _id: s.candidateId });
  check("Candidates: one record linked to the application", cd?.applicationIds?.includes(s.applicationId));
  check("InterviewConfigurations and InterviewSchedules written",
    !!(await db.collection("aiInterviewConfigurations").findOne({ _id: s.configId })) && !!(await db.collection("aiInterviewSchedules").findOne({ _id: id })));
  const infos = await db.listCollections({ name: { $in: ["aiInterviewQuestions", "aiInterviewEvaluations", "aiCandidates"] } }).toArray();
  check("model collections have $jsonSchema validators", infos.length === 3 && infos.every((c) => c.options?.validator?.$jsonSchema));
  const invalid = await db.collection("aiInterviewQuestions").insertOne({ _id: "bad" }).then(() => false, () => true);
  check("validator rejects an incomplete document", invalid);

  // --- HR reviews ----------------------------------------------------------------------------------
  section("HR review through the API");
  const detail = await api("GET", `/admin/api/ai-interviews/${id}`);
  check("GET detail returns the session and all models", detail.status === 200 && detail.json?.data?.models?.evaluation?.overall != null && detail.json.data.models.questions.length === counts.questions);
  check("detail never exposes the link token", !("tokenEnc" in (detail.json?.data?.session ?? {})));
  const evalRes = await api("GET", `/admin/api/ai-interviews/${id}/evaluation`);
  check("GET evaluation", evalRes.status === 200 && evalRes.json?.data?.state === "done");
  const trRes = await api("GET", `/admin/api/ai-interviews/${id}/transcript`);
  check("GET transcript", trRes.status === 200 && trRes.json?.data?.entries?.length > 0);
  const recs = await api("GET", `/admin/api/ai-interviews/${id}/recordings`);
  const seg = recs.json?.data?.segments?.[0];
  check("GET recordings lists playable segments", recs.status === 200 && !!seg?.url);
  if (seg) {
    const play = await admin.evaluate(async (u) => {
      const r = await fetch(u);
      return { status: r.status, type: r.headers.get("content-type"), size: (await r.arrayBuffer()).byteLength };
    }, seg.url);
    check("recording plays for HR (decrypted video)", play.status === 200 && /video/.test(play.type ?? "") && play.size > 1000, JSON.stringify(play));
    const anonPlay = await fetch(BASE + seg.url, { redirect: "manual" });
    check("recording is not reachable signed out", anonPlay.status !== 200, `${anonPlay.status}`);

    // Seeking: the player asks for byte ranges; the server answers 206 with exactly those bytes.
    const whole = await admin.evaluate(async (u) => new Uint8Array(await (await fetch(u)).arrayBuffer()).slice(100, 200).join(","), seg.url);
    const part = await admin.evaluate(async (u) => {
      const r = await fetch(u, { headers: { Range: "bytes=100-199" } });
      return { status: r.status, range: r.headers.get("content-range"), accept: r.headers.get("accept-ranges"), bytes: new Uint8Array(await r.arrayBuffer()).join(",") };
    }, seg.url);
    check("recording answers a byte range (206) for seeking", part.status === 206 && /^bytes 100-199\/\d+$/.test(part.range ?? "") && part.accept === "bytes", JSON.stringify({ ...part, bytes: undefined }));
    check("the range holds exactly those bytes", part.bytes === whole);
    // From Node, not the page: a deliberate 416 would show up as a page error.
    const bad = (await fetch(BASE + seg.url, { headers: { Cookie: cookie, Range: "bytes=999999999-" } })).status;
    check("a range past the end is refused (416)", bad === 416, `${bad}`);
  }
  const planned = await db.collection("aiInterviews").findOne({ _id: id });
  const hrQ = planned?.questions?.find((q) => q.fromHr);
  check("must-ask question asked word for word, in its section", hrQ?.text === "QA must-ask: tell me about a time you changed your mind." && hrQ?.section === "behavioral", JSON.stringify(hrQ));
  check("questions still add up with the must-ask one", planned?.questions?.filter((q) => !q.followUpOf).length === 6, `${planned?.questions?.length}`);
  check("answers record their recording part", planned?.answers?.length > 0 && planned.answers.every((a) => a.segment === 0));
  const dash = await api("GET", "/admin/api/ai-interviews/dashboard");
  check("GET dashboard counts the completed interview", dash.status === 200 && dash.json?.data?.cards?.completed >= 1);
  const cmp = await api("GET", "/admin/api/ai-interviews/compare?position=" + encodeURIComponent(fields.position));
  check("GET compare ranks candidates for the job", cmp.status === 200 && cmp.json?.data?.candidates?.[0]?.rank === 1);
  const notes = await api("GET", `/admin/api/ai-interviews/notifications?interviewId=${id}`);
  check("GET notifications shows the sent emails", notes.status === 200 && notes.json?.data?.items?.some((n) => n.status === "sent"));
  const rem = await api("POST", `/admin/api/ai-interviews/${id}/reminder`);
  check("reminder on a completed interview is refused (400)", rem.status === 400);

  const noReason = await api("PUT", `/admin/api/ai-interviews/${id}/decision`, { override: "hold" });
  check("override without a reason is refused", noReason.status === 400);
  const ov = await api("PUT", `/admin/api/ai-interviews/${id}/decision`, { override: "hold", reason: "QA: wants a second look" });
  check("override with a reason", ov.status === 200 && ov.json?.data?.interview?.finalRecommendation === "hold");
  const dec = await api("PUT", `/admin/api/ai-interviews/${id}/decision`, { decision: "shortlist", note: "QA shortlist" });
  check("shortlist decision", dec.status === 200);
  const app = await db.collection("applications").findOne({ _id: s.applicationId });
  check("application moved to Shortlisted", app?.status === "shortlisted", app?.status);
  await sleep(1500);
  const rv = await db.collection("aiHrInterviewReviews").findOne({ _id: id });
  check("HRInterviewReviews: decision and override synced", rv?.latestDecision?.kind === "shortlist" && rv?.recommendationOverride === "hold");
  const ev2 = await db.collection("aiInterviewEvaluations").findOne({ _id: id });
  check("evaluation model shows HR's final recommendation", ev2?.finalRecommendation === "hold");
  const audit = await api("GET", `/admin/api/ai-interviews/${id}/audit`);
  check("audit trail records the API actions", audit.json?.data?.some((a) => a.action === "decision:shortlist") && audit.json?.data?.some((a) => a.action === "rescheduled"));

  // --- fixes from the code read-through ---------------------------------------------------------
  section("Fixes: decisions, cancel, evaluation, retention");
  const before = (await db.collection("aiInterviews").findOne({ _id: id }))?.hr?.recommendationOverride;
  const mixed = await api("PUT", `/admin/api/ai-interviews/${id}/decision`, { override: "not_recommended", reason: "QA: should not stick", decision: "nonsense" });
  const afterMixed = (await db.collection("aiInterviews").findOne({ _id: id }))?.hr?.recommendationOverride;
  check("a bad decision refuses the whole request (override not applied)", mixed.status === 422 && afterMixed === before, `${mixed.status} ${before} → ${afterMixed}`);

  // A second attempt for the same application (HR "request another assessment").
  const again = await api("PUT", `/admin/api/ai-interviews/${id}/decision`, { decision: "reassess", note: "QA second attempt" });
  check("reassess creates a new attempt", again.status === 200, JSON.stringify(again.json).slice(0, 200));
  const second = await until(() => db.collection("aiInterviews").findOne({ applicationId: s.applicationId, _id: { $ne: id } }), 20_000, 500);
  check("second attempt exists", !!second);

  section("New features: quick actions, candidate picks a time, bulk, export");
  if (second) {
    const sid = second._id;
    // A reassessment starts unscheduled: schedule it at the next free time.
    const auto = await api("POST", `/admin/api/ai-interviews/${sid}/auto-schedule`);
    const autoDoc = await db.collection("aiInterviews").findOne({ _id: sid });
    check("auto-schedule picks the next free working time", auto.status === 200 && autoDoc?.status === "scheduled" && autoDoc.schedule.startsAt > new Date(), `${auto.status} ${auto.json?.error ?? ""}`);
    // Copy link
    const linkRes = await api("GET", `/admin/api/ai-interviews/${sid}/link`);
    const realLink = linkRes.json?.data?.link;
    check("GET link returns the candidate's link", linkRes.status === 200 && /\/interview\/[A-Za-z0-9_-]{20,}$/.test(realLink ?? ""), `${linkRes.status}`);
    // The link points at the public site address; open the same token on this test server.
    const candLink = `${BASE}/interview/${(realLink ?? "").split("/interview/")[1] ?? "missing"}`;
    check("viewing the link is in the audit trail", !!(await db.collection("aiInterviewAudit").findOne({ interviewId: sid, action: "link_viewed" })));
    // Resend the invitation
    const sentBefore = mails.filter((m) => m.to.includes(second.candidate.email)).length;
    const resend = await api("POST", `/admin/api/ai-interviews/${sid}/resend`);
    check("resend queues the invitation", resend.status === 202, `${resend.status}`);
    check("the invitation arrives again", !!(await until(() => mails.filter((m) => m.to.includes(second.candidate.email)).length > sentBefore, 60_000)));
    // Extend the link
    const before = (await db.collection("aiInterviews").findOne({ _id: sid })).schedule.closesAt;
    const ext = await api("PUT", `/admin/api/ai-interviews/${sid}/extend`, { hours: 24 });
    const after = (await db.collection("aiInterviews").findOne({ _id: sid })).schedule.closesAt;
    check("extend keeps the link open 24 hours longer", ext.status === 200 && after.getTime() - before.getTime() === 24 * 3600_000, `${ext.status}`);
    const extBad = await api("PUT", `/admin/api/ai-interviews/${sid}/extend`, { hours: 5 });
    check("extend refuses an odd number of hours", extBad.status === 400);
    // New questions
    const oldIds = (await db.collection("aiInterviews").findOne({ _id: sid })).questions.map((q) => q.id).join();
    const regen = await api("POST", `/admin/api/ai-interviews/${sid}/regenerate`);
    check("regenerate is accepted before the interview starts", regen.status === 202, `${regen.status} ${regen.json?.error ?? ""}`);
    const fresh = await until(async () => {
      const d = await db.collection("aiInterviews").findOne({ _id: sid });
      return d?.questions?.length && d.questions.map((q) => q.id).join() !== oldIds ? d : null;
    }, 60_000, 1000);
    check("new questions are written", !!fresh);
    const regenDone = await api("POST", `/admin/api/ai-interviews/${id}/regenerate`);
    check("regenerate is refused once answered", regenDone.status === 400);
    // Email the candidate
    const msgBefore = mails.filter((m) => m.to.includes(second.candidate.email)).length;
    const message = await api("POST", `/admin/api/ai-interviews/${sid}/message`, { subject: "QA hello from HR", body: "Just checking you got the invitation." });
    check("HR's email is sent", message.status === 200, JSON.stringify(message.json).slice(0, 200));
    check("…and arrives", mails.filter((m) => m.to.includes(second.candidate.email)).length > msgBefore && mails.some((m) => /QA hello from HR/.test(m.body)));
    check("…and is in the notification log", !!(await db.collection("aiNotificationLogs").findOne({ interviewId: sid, kind: "hr_message", status: "sent" })));

    // The candidate picks another time on the interview page.
    const pick = await candidateBrowser.newPage();
    await pick.goto(candLink, { waitUntil: "networkidle2" });
    const pickText = () => pick.evaluate(() => document.body.innerText);
    // Before the link opens the times are listed straight away; on the welcome screen behind "Pick another one".
    // Wait until the page is shown (innerText skips what the loading screen still hides).
    const offered = !!(await pick
      .waitForFunction(() => {
        const b = [...document.querySelectorAll("button")].find((x) => /Pick another one/.test(x.textContent));
        b?.click();
        return !!b || /Pick another time/.test(document.body.textContent);
      }, { timeout: 15_000, polling: 250 })
      .catch(() => null));
    check("candidate is offered to pick another time", offered);
    await pick.waitForSelector('input[name="slot"]', { timeout: 10_000 }).catch(() => null);
    const slots = await pick.$$('input[name="slot"]');
    check("candidate is offered several times", slots.length >= 4, `${slots.length}`);
    if (slots.length) {
      await slots[1].click();
      const versionBefore = (await db.collection("aiInterviews").findOne({ _id: sid })).schedule.version;
      await pick.evaluate(() => [...document.querySelectorAll("button")].find((x) => /Move my interview/.test(x.textContent))?.click());
      await pick.waitForFunction((old) => location.href !== old, { timeout: 20_000 }, candLink).catch(() => null);
      await pick.waitForNetworkIdle({ timeout: 10_000 }).catch(() => null);
      const moved = await db.collection("aiInterviews").findOne({ _id: sid });
      check("the interview moved to the chosen time", moved.schedule.version === versionBefore + 1 && moved.selfReschedules === 1, `v${moved.schedule.version} self ${moved.selfReschedules}`);
      check("the page opened the new link", pick.url() !== candLink && /\/interview\//.test(pick.url()));
      check("the new link opens the interview page", /Hello|hasn't opened yet/.test(await pickText()), (await pickText()).slice(0, 120));
      check("no second move offered (limit 1)", !/Pick another one|Pick another time/.test(await pickText()));
      const oldPage = await candidateBrowser.newPage();
      await oldPage.goto(candLink, { waitUntil: "networkidle2" });
      check("the old link stopped working", /not valid/i.test(await oldPage.evaluate(() => document.body.innerText)));
      await oldPage.close();
      const forged = await pick.evaluate(async () => {
        const r = await fetch(`${location.pathname}/api/reschedule`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ startsAt: new Date(Date.now() + 3 * 3600_000 + 7 * 60_000).toISOString() }) });
        return r.status;
      });
      check("a time that wasn't offered is refused", forged === 400, `${forged}`);
    }
    await pick.close();

    // Bulk: one that applies, one that doesn't (the first interview is completed).
    const bulk = await api("POST", "/admin/api/ai-interviews/bulk", { ids: [sid, id], action: "remind" });
    check("bulk runs where it applies and skips the rest", bulk.status === 200 && bulk.json?.data?.done === 1 && bulk.json?.data?.skipped?.length === 1 && bulk.json.data.skipped[0].id === id, JSON.stringify(bulk.json).slice(0, 300));
    const bulkBad = await api("POST", "/admin/api/ai-interviews/bulk", { ids: [sid], action: "explode" });
    check("bulk refuses an unknown action (422)", bulkBad.status === 422);

    // Senior QA round: the fixes and features added after the review.
    const linkBefore = (await db.collection("aiInterviews").findOne({ _id: sid })).tokenHash;
    const bulkAuto = await api("POST", "/admin/api/ai-interviews/bulk", { ids: [sid], action: "auto_schedule" });
    const linkAfter = (await db.collection("aiInterviews").findOne({ _id: sid })).tokenHash;
    check("bulk auto-schedule skips an interview that already has a time (link kept)", bulkAuto.json?.data?.done === 0 && /Already has a time/.test(bulkAuto.json?.data?.skipped?.[0]?.reason ?? "") && linkBefore === linkAfter, JSON.stringify(bulkAuto.json).slice(0, 200));
    const autoAgain = await api("POST", `/admin/api/ai-interviews/${sid}/auto-schedule`);
    check("auto-schedule refuses a scheduled interview", autoAgain.status === 400, `${autoAgain.status}`);

    // Evaluate again: one queued at a time, and the earlier result is kept in the history.
    const evalAt = (await db.collection("aiInterviews").findOne({ _id: id })).evaluation.at;
    const ev1 = await api("POST", `/admin/api/ai-interviews/${id}/evaluate`);
    const ev2 = await api("POST", `/admin/api/ai-interviews/${id}/evaluate`);
    check("evaluate again is queued", ev1.status === 202 || ev1.status === 200, `${ev1.status} ${ev1.json?.error ?? ""}`);
    check("a second evaluate while one is queued is refused", ev2.status === 400 && /already (queued|running)/.test(ev2.json?.error ?? ""), `${ev2.status} ${ev2.json?.error ?? ""}`);
    const reevaluated = await until(async () => {
      const d = await db.collection("aiInterviews").findOne({ _id: id });
      return d?.evaluation?.state === "done" && d.evaluation.at > evalAt ? d : null;
    }, 90_000, 1000);
    check("re-evaluation finishes", !!reevaluated);
    check("the earlier evaluation is kept in the history", (reevaluated?.evaluation?.history?.length ?? 0) >= 1, JSON.stringify(reevaluated?.evaluation?.history ?? null).slice(0, 200));
    check("no evaluation is left marked running", !reevaluated?.evaluation?.runningSince);

    // Compare: one row per applicant (the evaluated attempt, not the new unscored one).
    const cmp = await api("GET", `/admin/api/ai-interviews/compare?position=${encodeURIComponent(second.position)}`);
    const cands = cmp.json?.data?.candidates ?? [];
    check("compare lists each applicant once (their evaluated attempt)", cands.filter((c) => c.applicationId === second.applicationId).length === 1 && cands.some((c) => c.interviewId === id), JSON.stringify(cands.map((c) => c.interviewId)).slice(0, 200));

    // Server actions' unknown values and paging can't misbehave.
    const frac = await api("GET", "/admin/api/ai-interviews?page=1.5&pageSize=2");
    check("list paging: whole pages, real page size echoed", frac.status === 200 && frac.json?.data?.pageSize === 5, `${frac.status} ${JSON.stringify(frac.json?.data?.pageSize)}`);
    const sched = await admin.goto(`${BASE}/admin/ai-interviews/schedule?page=1.5`, { waitUntil: "networkidle2" });
    check("schedule page with ?page=1.5 renders without a database error", sched?.status() === 200 && !/Could not read/i.test(await admin.evaluate(() => document.body.innerText)));

    // CSV export
    const csv = await admin.evaluate(async () => {
      const r = await fetch("/admin/ai-interviews/export?sort=created");
      return { status: r.status, type: r.headers.get("content-type"), body: await r.text() };
    });
    check("CSV export downloads", csv.status === 200 && /text\/csv/.test(csv.type ?? ""), `${csv.status}`);
    check("CSV has the header and both attempts", /Candidate,Email,Phone,Position/.test(csv.body) && csv.body.includes(id) && csv.body.includes(sid), csv.body.slice(0, 200));
    const picked = await admin.evaluate(async (x) => (await (await fetch(`/admin/ai-interviews/export?ids=${x}`)).text()).split("\r\n").filter(Boolean).length, sid);
    check("CSV of selected rows has just those", picked === 2, `${picked} lines`);
    const anonCsv = await fetch(`${BASE}/admin/ai-interviews/export`, { redirect: "manual" });
    check("CSV export is not reachable signed out", anonCsv.status !== 200, `${anonCsv.status}`);
    check("exports are in the audit trail", !!(await db.collection("aiInterviewAudit").findOne({ action: "exported_csv" })));

    // Work queues
    const q = await api("GET", "/admin/api/ai-interviews?queue=awaiting_decision");
    check("queue filter: the decided interview isn't awaiting a decision", q.status === 200 && !q.json?.data?.items?.some((x) => x.id === id));
  }
  if (second) {
    // Pretend it has a recording, so the cancel has something to keep or delete.
    await db.collection("aiInterviews").updateOne({ _id: second._id }, { $set: { "recording.chunks": 2, "recording.bytes": 100 } });
    const cancel = await api("PUT", `/admin/api/ai-interviews/${second._id}/cancel`, { reason: "QA cancel" });
    check("cancel the second attempt", cancel.status === 200, `${cancel.status}`);
    const cancelled = await db.collection("aiInterviews").findOne({ _id: second._id });
    const days = (cancelled?.recording?.deleteAfter - Date.now()) / 86400_000;
    check("cancelled interview: recording deletion date set from the retention period", cancelled?.recording?.deleteAfter && days > cancelled.config.retentionDays - 1, `${days?.toFixed?.(1)} days`);
    const purge = await db.collection("aiInterviewJobs").findOne({ interviewId: second._id, kind: "purge_recordings", state: "pending" });
    check("cancelled interview: recording purge queued", !!purge);
    const ev = await api("POST", `/admin/api/ai-interviews/${second._id}/evaluate`);
    check("evaluating a cancelled interview is refused with a reason", ev.status === 400 && /cancelled interview isn't evaluated/i.test(ev.json?.error ?? ""), `${ev.status} ${ev.json?.error ?? ""}`);
    const res = await api("PUT", `/admin/api/ai-interviews/${second._id}/reschedule`, { startsAt: new Date(Date.now() + 3600_000).toISOString() });
    check("a cancelled interview can't be rescheduled", res.status === 400, `${res.status}`);
  }

  // --- admin pages still render --------------------------------------------------------------------
  section("Admin pages");
  for (const p of ["/admin/ai-interviews", `/admin/ai-interviews/${id}`, "/admin/ai-interviews/settings", "/admin/ai-interviews/compare", "/admin/users/new"]) {
    const r = await admin.goto(BASE + p, { waitUntil: "networkidle2" });
    check(`${p} renders`, r?.status() === 200, `${r?.status()}`);
  }
  await admin.goto(BASE + "/admin/ai-interviews", { waitUntil: "networkidle2" });
  check("dashboard shows Needs attention", /Needs attention/.test(await admin.evaluate(() => document.body.innerText)));
  await admin.goto(BASE + "/admin/ai-interviews/schedule", { waitUntil: "networkidle2" });
  const rows = await admin.$$('input[name="bulk-id"]');
  check("schedule list has a checkbox per row", rows.length >= 2, `${rows.length}`);
  if (rows.length) {
    await rows[0].click();
    check("ticking a row shows the bulk bar", !!(await admin.waitForSelector('[aria-label="Bulk actions"]', { timeout: 5000 }).catch(() => null)));
  }
  await admin.goto(BASE + `/admin/ai-interviews/${id}`, { waitUntil: "networkidle2" });
  const detailText = await admin.evaluate(() => document.body.innerText);
  check("interview page has Quick actions", /Quick actions/.test(detailText) && /Email the candidate/.test(detailText));
  check("transcript offers 'Play from' for answers", /Play from \d+:\d\d/.test(detailText));
  // The player learns the duration and seeks (MediaRecorder files have no index until the fix runs).
  const seek = await admin.evaluate(async () => {
    const v = document.querySelector("video");
    if (!v) return { ok: false, why: "no video" };
    const wait = (ms) => new Promise((r) => setTimeout(r, ms));
    for (let n = 0; n < 80 && !(Number.isFinite(v.duration) && v.dataset.ready === "1"); n++) await wait(250);
    if (!Number.isFinite(v.duration)) return { ok: false, why: `duration ${v.duration}` };
    const target = Math.max(0.5, v.duration / 2);
    const seeked = new Promise((r) => v.addEventListener("seeked", () => r(true), { once: true }));
    v.currentTime = target;
    const done = await Promise.race([seeked, wait(10_000).then(() => false)]);
    return { ok: done && Math.abs(v.currentTime - target) < 1.5, duration: v.duration, at: v.currentTime, target };
  });
  check("the recording player knows its length and can seek", seek.ok, JSON.stringify(seek));
  await admin.goto(BASE + "/admin/ai-interviews/settings", { waitUntil: "networkidle2" });
  const settingsText = await admin.evaluate(() => document.body.innerText);
  check("settings offer must-ask questions and candidate-picked times", /Must-ask questions/.test(settingsText) && /Candidate may pick a new time/.test(settingsText));
  check("settings page shows the data models panel", /Data models/.test(settingsText) && /aiInterviewEvaluations/.test(settingsText));
  await admin.goto(BASE + "/admin/users/new", { waitUntil: "networkidle2" });
  check("user form offers HR team access", /Use HR team access/.test(await admin.evaluate(() => document.body.innerText)));
  // Not counted: the API calls above that are meant to fail (4xx), their console
  // lines, and the site logo (/media/…) that an empty database doesn't have.
  const unexpected = admin.problems.filter(
    (p) => !/\/admin\/api\/ai-interviews\//.test(p) && !/\/media\//.test(p) && !/Failed to load resource: the server responded with a status of (400|404|422)/.test(p)
  );
  check("no unexpected errors on the admin pages", unexpected.length === 0, unexpected.join(" | "));
} catch (e) {
  check("suite ran to the end", false, e instanceof Error ? e.stack : String(e));
} finally {
  await adminBrowser?.close().catch(() => {});
  await candidateBrowser?.close().catch(() => {});
  // Empty every collection (keeps them, with their validators, for the running
  // server); QA_DROP=1 drops the whole scratch database instead.
  if (process.env.QA_DROP === "1") await db.dropDatabase().catch(() => {});
  else for (const c of await db.listCollections({}, { nameOnly: true }).toArray()) await db.collection(c.name).deleteMany({}).catch(() => {});
  await client.close();
  smtp.close();
  summary();
}
