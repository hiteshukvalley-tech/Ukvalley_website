// Checks the SMTP settings in .env.local and sends one test email.
//   node scripts/mail-check.mjs                 → sends to SMTP_USER
//   node scripts/mail-check.mjs you@example.com → sends to that address
import { readFileSync } from "node:fs";
import nodemailer from "nodemailer";

const env = Object.fromEntries(
  readFileSync(".env.local", "utf8")
    .split(/\r?\n/)
    .filter((l) => l.includes("=") && !l.startsWith("#"))
    .map((l) => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim()])
);
const host = env.SMTP_HOST;
const port = Number(env.SMTP_PORT) || 465;
const user = env.SMTP_USER;
const pass = (env.SMTP_PASS ?? "").replace(/\s+/g, "");
const to = process.argv[2] || user;

if (!host || !user || !pass) {
  console.log("SMTP_HOST, SMTP_USER and SMTP_PASS must all be set in .env.local.");
  if (!pass) console.log("SMTP_PASS is empty. For Gmail, create an App Password: Google Account → Security → 2-Step Verification → App passwords.");
  process.exit(1);
}

const transport = nodemailer.createTransport({ host, port, secure: port === 465, auth: { user, pass } });
try {
  await transport.verify();
  console.log(`✓ Signed in to ${host} as ${user}`);
  await transport.sendMail({
    from: env.MAIL_FROM || user,
    to,
    subject: "Ukvalley Admin: test email",
    text: "Email is set up. Forgot-password codes will arrive like this one.",
  });
  console.log(`✓ Test email sent to ${to} (check spam if it isn't in the inbox)`);
} catch (e) {
  console.log("✗ Failed:", e.response || e.message);
  if (/535|Username and Password not accepted|Application-specific password/i.test(String(e.response || e.message))) {
    console.log("  Gmail refused the login. SMTP_PASS must be a 16-letter App Password, not the normal Gmail password.");
  }
  process.exit(1);
}
