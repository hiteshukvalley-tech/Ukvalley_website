// QA: Site settings → API keys. Add, validate, replace and remove keys in the
// admin; check they are stored encrypted, shown masked, used at once by the
// app (AI mode), logged in the history, and that the recording key locks once
// recordings exist.
//
// Same server setup as 16-ai-interviews.mjs, but WITHOUT AI_INTERVIEW_PROVIDER in
// the environment: this suite switches the AI to test mode from the admin and
// leaves it so, so running 16 afterwards shows the app using a key saved here.
//   node scripts/qa/17-api-keys.mjs && node scripts/qa/16-ai-interviews.mjs
import { MongoClient } from "mongodb";
import { BASE, OWNER, check, go, launch, login, newPage, pickOption, section, sleep, summary } from "./lib.mjs";

const QA_URI = process.env.QA_MONGODB_URI || "mongodb://127.0.0.1:27099";
const QA_DB = process.env.QA_DB || "ukvalley_ai_qa";
if (!QA_DB.endsWith("_qa")) throw new Error(`Refusing to run against "${QA_DB}": use a scratch *_qa database.`);

const client = await MongoClient.connect(QA_URI);
const db = client.db(QA_DB);
const keysDoc = () => db.collection("appIntegrationKeys").findOne({ _id: "keys" });
let browser;

const KEY1 = `sk-ant-qa-${"a1b2c3d4e5".repeat(4)}QA42`;
const KEY2 = `sk-ant-qa-${"f6g7h8i9j0".repeat(4)}ZZ99`;

try {
  await db.collection("appIntegrationKeys").deleteMany({});
  await db.collection("aiInterviewRecordings").deleteMany({ _id: "qa-fake-chunk" });
  browser = await launch();
  const page = await newPage(browser);
  await login(page, OWNER);
  const text = () => page.evaluate(() => document.body.innerText);
  const save = async () => {
    await page.evaluate(() => [...document.querySelectorAll("button[type=submit]")].find((b) => /Save keys/.test(b.textContent))?.click());
    await page.waitForFunction(() => !/Saving…/.test(document.body.innerText), { timeout: 30_000 }).catch(() => {});
    await sleep(800);
  };
  const type = async (name, value) => {
    await page.$eval(`#k-${name}`, (el) => (el.value = ""));
    await page.type(`#k-${name}`, value);
  };

  section("Page and access");
  const r = await go(page, "/admin/settings/api-keys");
  check("API keys page opens for the admin", r?.status() === 200 && /API keys/.test(await text()));
  check("sidebar links to API keys", await page.evaluate(() => !!document.querySelector('a[href="/admin/settings/api-keys"]')));
  check("explains what must stay in .env", /AUTH_SECRET/.test(await text()) && /MONGODB_URI/.test(await text()));
  const anon = await fetch(`${BASE}/admin/settings/api-keys`, { redirect: "manual" });
  check("signed out: sent to the login page", anon.status >= 300 && anon.status < 400 && /login/.test(anon.headers.get("location") ?? ""), `${anon.status}`);

  section("Validation");
  await type("ANTHROPIC_API_KEY", KEY1);
  await type("WHATSAPP_PHONE_NUMBER_ID", "+91 98000");
  await save();
  check("invalid value refused with a field message", /phone number ID is digits only/.test(await text()));
  check("nothing saved when any value is invalid", !(await keysDoc())?.values?.ANTHROPIC_API_KEY);

  section("Add keys");
  await type("ANTHROPIC_API_KEY", KEY1);
  await type("WHATSAPP_PHONE_NUMBER_ID", "123456789012345");
  await type("INTERVIEW_BASE_URL", "http://localhost:3100");
  await pickOption(page, "#k-AI_INTERVIEW_PROVIDER", "Test mode: fixed questions and scores");
  await save();
  check("saved message", /Saved: .*Anthropic API key/.test(await text()), (await text()).slice(0, 200));
  const d1 = await keysDoc();
  check("stored encrypted: the key itself is nowhere in the database", !!d1?.values?.ANTHROPIC_API_KEY && !JSON.stringify(d1).includes(KEY1));
  check("only the last four characters kept in clear", d1?.values?.ANTHROPIC_API_KEY?.last4 === "QA42");
  check("who and when recorded", d1?.values?.ANTHROPIC_API_KEY?.updatedBy?.toLowerCase() === OWNER.email.trim().toLowerCase() && d1?.values?.ANTHROPIC_API_KEY?.updatedAt instanceof Date);

  await go(page, "/admin/settings/api-keys");
  const t1 = await text();
  check("page shows the key masked (••••QA42), never in full", t1.includes("••••QA42") && !t1.includes(KEY1) && !(await page.content()).includes(KEY1));
  check("the secret box is empty after saving", (await page.$eval("#k-ANTHROPIC_API_KEY", (e) => e.value)) === "");
  check("plain value shown for editing", (await page.$eval("#k-WHATSAPP_PHONE_NUMBER_ID", (e) => e.value)) === "123456789012345");

  section("Used by the app at once");
  await go(page, "/admin/ai-interviews/settings");
  check("AI interviews settings shows test mode (saved here, not in .env)", /test mode/i.test(await text()));
  await go(page, "/admin/settings/api-keys");
  await page.evaluate(() => [...document.querySelectorAll("button")].filter((b) => /Test saved keys/.test(b.textContent))[0]?.click());
  check("Claude test respects test mode (no call made)", !!(await page.waitForFunction(() => /Test mode is on/.test(document.body.innerText), { timeout: 15_000 }).catch(() => null)));
  await page.evaluate(() => [...document.querySelectorAll("button")].filter((b) => /Test saved keys/.test(b.textContent)).at(-1)?.click());
  check("recordings test (MongoDB storage)", !!(await page.waitForFunction(() => /stored in MongoDB/.test(document.body.innerText), { timeout: 15_000 }).catch(() => null)));

  section("Replace and remove");
  await type("ANTHROPIC_API_KEY", KEY2);
  await save();
  await go(page, "/admin/settings/api-keys");
  check("replaced: page shows ••••ZZ99", (await text()).includes("••••ZZ99") && !(await text()).includes("••••QA42"));
  await page.$eval("#k-INTERVIEW_BASE_URL", (el) => (el.value = ""));
  await page.evaluate(() => document.querySelector('input[name="rm.ANTHROPIC_API_KEY"]')?.click());
  await save();
  const d2 = await keysDoc();
  check("removed: the Anthropic key and the link address are gone", !d2?.values?.ANTHROPIC_API_KEY && !d2?.values?.INTERVIEW_BASE_URL);
  check("other keys untouched", d2?.values?.WHATSAPP_PHONE_NUMBER_ID && d2?.values?.AI_INTERVIEW_PROVIDER);
  await go(page, "/admin/settings/api-keys");
  check("history lists the changes (never the values)", /Recent key changes/.test(await text()) && /removed/.test(await text()) && !(await text()).includes(KEY2));

  section("Recording key lock");
  await db.collection("aiInterviewRecordings").insertOne({ _id: "qa-fake-chunk", interviewId: "qa", segment: 0, seq: 0, size: 1, mime: "video/webm", storage: "gridfs", ref: "x", at: new Date() });
  await go(page, "/admin/settings/api-keys");
  check("recording key locked while recordings exist", /Locked: recordings are stored/.test(await text()) && !(await page.$("#k-RECORDING_ENCRYPTION_KEY")));
  await db.collection("aiInterviewRecordings").deleteOne({ _id: "qa-fake-chunk" });
  await go(page, "/admin/settings/api-keys");
  check("unlocked when none are stored", !!(await page.$("#k-RECORDING_ENCRYPTION_KEY")));

  const unexpected = page.problems.filter((p) => !/\/media\//.test(p) && !/status of 404/.test(p));
  check("no errors on the page", unexpected.length === 0, unexpected.join(" | "));
} catch (e) {
  check("suite ran to the end", false, e instanceof Error ? e.stack : String(e));
} finally {
  await browser?.close().catch(() => {});
  await db.collection("aiInterviewRecordings").deleteOne({ _id: "qa-fake-chunk" }).catch(() => {});
  await client.close();
  summary();
}
