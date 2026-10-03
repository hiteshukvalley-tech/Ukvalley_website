// QA: admin "Forgot password" (email code → verify → new password).
// Runs its own fake SMTP server on :2525 that captures the emails, so start
// the app pointed at it and at a scratch database:
//   NEXT_DIST_DIR=.next-test MONGODB_DB=ukvalley_qa SMTP_HOST=127.0.0.1 SMTP_PORT=2525 \
//     SMTP_USER=qa SMTP_PASS=qa npx next start -p 3100
//   node scripts/qa/06-forgot-password.mjs
// The owner's reset password is removed again at the end.
import net from "node:net";
import { readFileSync } from "node:fs";
import { MongoClient } from "mongodb";
import { BASE, OWNER, check, go, launch, newPage, section, sleep, summary, text } from "./lib.mjs";

const QA_DB = process.env.QA_DB || "ukvalley_qa";
if (!QA_DB.endsWith("_qa")) throw new Error(`Refusing to run against "${QA_DB}" — use a scratch *_qa database.`);
const uri = readFileSync(".env.local", "utf8").match(/^MONGODB_URI=(.*)$/m)?.[1];

// --- fake SMTP server -------------------------------------------------------
const mails = [];
const smtp = net.createServer((sock) => {
  sock.write("220 qa ESMTP\r\n");
  let buf = "";
  let inData = false;
  let msg = { to: "", body: "" };
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
          msg = { to: "", body: "" };
          sock.write("250 OK\r\n");
        } else msg.body += line + "\n";
        continue;
      }
      const cmd = line.slice(0, 4).toUpperCase();
      if (cmd === "EHLO") sock.write("250-qa\r\n250-AUTH PLAIN\r\n250 OK\r\n");
      else if (cmd === "AUTH") sock.write("235 OK\r\n");
      else if (cmd === "RCPT") { msg.to = (line.match(/<(.*)>/)?.[1] ?? "").toLowerCase(); sock.write("250 OK\r\n"); }
      else if (cmd === "DATA") { inData = true; sock.write("354 go\r\n"); }
      else if (cmd === "QUIT") { sock.write("221 bye\r\n"); sock.end(); }
      else sock.write("250 OK\r\n");
    }
  });
});
await new Promise((r) => smtp.listen(2525, "127.0.0.1", r));

const codeFor = (email) => {
  const m = [...mails].reverse().find((x) => x.to === email.toLowerCase());
  return m?.body.match(/Subject: (\d{6})/)?.[1];
};

async function submit(page) {
  await Promise.all([
    page.waitForResponse((r) => r.request().method() === "POST", { timeout: 30000 }).catch(() => {}),
    page.click("button[type=submit]:not([name])"),
  ]);
  await sleep(600);
}

const mongo = new MongoClient(uri);
const db = mongo.db(QA_DB);
await db.collection("adminOwner").deleteMany({});
await db.collection("passwordResets").deleteMany({});

const NEW_PASSWORD = "QaNewPass-2026!";
const browser = await launch();
try {
  const page = await newPage(browser);

  section("Login page");
  await go(page, "/admin/login");
  check("email placeholder", (await page.$eval("#email", (e) => e.placeholder)) === "Enter your email ID");
  check("password placeholder", (await page.$eval("#password", (e) => e.placeholder)) === "Enter your password");
  const link = await page.$('a[href="/admin/forgot-password"]');
  check("Forgot password link", !!link);
  await Promise.all([page.waitForNavigation({ waitUntil: "networkidle2" }), link.click()]);
  check("forgot page is public", page.url().endsWith("/admin/forgot-password"), page.url());

  section("Unknown email");
  await page.type("#email", "nobody-here@example.com");
  await submit(page);
  check("moves to code step", !!(await page.$("#code")));
  check("generic message (no account leak)", /If nobody-here@example.com has an admin account/.test(await text(page)));
  check("no email sent", !codeFor("nobody-here@example.com"));

  section("Owner: request code");
  await page.click('button[value="restart"]');
  await page.waitForSelector("#email", { timeout: 30000 });
  await sleep(500);
  check('"Use a different email" goes back to step 1', !(await page.$("#code")));
  await page.$eval("#email", (e) => { e.value = ""; });
  await page.type("#email", OWNER.email);
  await submit(page);
  await sleep(500);
  const code = codeFor(OWNER.email);
  check("email with 6-digit code sent", !!code, (await text(page)).replace(/\s+/g, " ").slice(0, 300));
  if (!code) throw new Error("No code email; stopping.");

  section("Resend too soon");
  await page.click('button[value="resend"]');
  await sleep(1200);
  check("asks to wait a minute", /less than a minute ago/.test(await text(page)));

  section("Wrong code");
  const wrong = code === "000000" ? "111111" : "000000";
  await page.type("#code", wrong);
  await submit(page);
  check("wrong code rejected", /isn't right/.test(await text(page)));

  section("Right code");
  await page.type("#code", code);
  await submit(page);
  check("moves to new password step", !!(await page.$("#next")));

  section("New password");
  await page.type("#next", NEW_PASSWORD);
  await page.type("#confirm", NEW_PASSWORD + "x");
  await submit(page);
  check("mismatch rejected", /don't match/.test(await text(page)));
  await page.type("#next", NEW_PASSWORD);
  await page.type("#confirm", NEW_PASSWORD);
  await Promise.all([page.waitForNavigation({ waitUntil: "networkidle2", timeout: 30000 }).catch(() => {}), page.click("button[type=submit]:not([name])")]);
  check("redirected to login", page.url().includes("/admin/login?reset=1"), page.url());
  check("success banner", /Password changed/.test(await text(page)));

  section("Sign in");
  const tryLogin = async (password) => {
    const p = await newPage(browser);
    await go(p, "/admin/login");
    await p.type("#email", OWNER.email);
    await p.type("#password", password);
    await Promise.all([p.waitForNavigation({ waitUntil: "networkidle2", timeout: 30000 }).catch(() => {}), p.click("button[type=submit]")]);
    await sleep(500);
    const url = new URL(p.url()).pathname;
    await p.close();
    return url;
  };
  check("old password refused", (await tryLogin(OWNER.password)) === "/admin/login");
  check("new password works", (await tryLogin(NEW_PASSWORD)) === "/admin");

  section("Code is single-use");
  const reuse = await newPage(browser);
  await go(reuse, "/admin/forgot-password");
  await reuse.type("#email", OWNER.email);
  await submit(reuse); // within the resend wait: goes to the code step without a new code
  await reuse.type("#code", code);
  await submit(reuse);
  check("used code refused", !(await reuse.$("#next")) && /expired|isn't right/.test(await text(reuse)));
  await reuse.close();

  check("no browser errors", page.problems.length === 0, page.problems.join(" | "));
} finally {
  await browser.close();
  // Back to the env password.
  await db.collection("adminOwner").deleteMany({});
  await db.collection("passwordResets").deleteMany({});
  await mongo.close();
  smtp.close();
  console.log(`\n(base ${BASE}, database ${QA_DB})`);
  summary();
}
