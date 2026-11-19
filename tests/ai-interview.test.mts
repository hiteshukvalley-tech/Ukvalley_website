// Unit tests for the AI interview module's pure logic. Run: npm test
// (Node's built-in test runner; Node strips the TypeScript types itself.)
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_CRITERIA_WEIGHTS, DEFAULT_SECTION_WEIGHTS, DEFAULT_SETTINGS, allocateQuestions, classifyExperience,
  consistentRecommendation, effectiveSettings, experienceYears, formatInZone, nextWorkingSlot, overallScore, safeTimeZone,
} from "../src/lib/ai-interview/types.ts";
import { DEFAULT_TEMPLATES, renderTemplate, unknownPlaceholders } from "../src/lib/ai-interview/templates.ts";
import { buildIcs, icsEscape } from "../src/lib/ai-interview/ics.ts";

test("experience: form answers map to years and fresher/experienced", () => {
  assert.equal(experienceYears("Fresher (0–1 year)"), 0);
  assert.equal(experienceYears("1–2 years"), 1);
  assert.equal(experienceYears("10+ years"), 10);
  assert.equal(experienceYears(""), 0);
  assert.equal(classifyExperience("Fresher (0–1 year)", 1), "fresher");
  assert.equal(classifyExperience("1–2 years", 1), "experienced");
  assert.equal(classifyExperience("1–2 years", 2), "fresher");
  assert.equal(classifyExperience("2–4 years", 2), "experienced");
});

test("questions are shared out by section weight and add up to the total", () => {
  for (const total of [3, 6, 10, 13, 30]) {
    const a = allocateQuestions(total, DEFAULT_SECTION_WEIGHTS);
    const sum = Object.values(a).reduce((s, n) => s + n, 0);
    assert.equal(sum, Math.max(total, 6), `total ${total}`);
    for (const n of Object.values(a)) assert.ok(n >= 1, "every weighted section gets a question");
  }
  const ten = allocateQuestions(10, DEFAULT_SECTION_WEIGHTS);
  assert.equal(ten.technical, 3);
  assert.equal(ten.intro, 1);
  const noBehavioral = allocateQuestions(8, { ...DEFAULT_SECTION_WEIGHTS, behavioral: 0, intro: 20 });
  assert.equal(noBehavioral.behavioral, 0);
});

test("overall score is the weighted mean, with the test counted only when weighted", () => {
  const all70 = Object.fromEntries(Object.keys(DEFAULT_CRITERIA_WEIGHTS).map((k) => [k, 70]));
  assert.equal(overallScore(all70, DEFAULT_CRITERIA_WEIGHTS), 70);
  assert.equal(overallScore(all70, DEFAULT_CRITERIA_WEIGHTS, { score: 100, weight: 0 }), 70);
  assert.equal(overallScore(all70, DEFAULT_CRITERIA_WEIGHTS, { score: 100, weight: 100 }), 85);
  assert.equal(overallScore({ ...all70, technical: 100 }, DEFAULT_CRITERIA_WEIGHTS), 79);
  assert.equal(overallScore({ technical: 150 }, DEFAULT_CRITERIA_WEIGHTS), 100, "scores are clamped");
  assert.equal(overallScore({}, DEFAULT_CRITERIA_WEIGHTS), 0);
});

test("recommendation never contradicts the score", () => {
  assert.equal(consistentRecommendation("strongly_recommended", 50, 60), "hold");
  assert.equal(consistentRecommendation("recommended", 59.9, 60), "hold");
  assert.equal(consistentRecommendation("recommended", 60, 60), "recommended");
  assert.equal(consistentRecommendation("not_recommended", 80, 60), "hold");
  assert.equal(consistentRecommendation("not_recommended", 70, 60), "not_recommended");
  assert.equal(consistentRecommendation("hold", 95, 60), "hold");
});

const IST = (iso: string) => new Date(`${iso}+05:30`);
const slot = (from: string, delayHours = 24) =>
  nextWorkingSlot(IST(from), { delayHours, startHour: 10, endHour: 18, skipSundays: true, durationMinutes: 25 }).toISOString();

test("automatic slots fall in working hours, on the half hour, skipping Sundays", () => {
  // Applied Tue 14:10 → Wed 14:30.
  assert.equal(slot("2026-11-17T14:10:00"), IST("2026-11-18T14:30:00").toISOString());
  // Applied Tue 20:00 → Wed 20:00 is after hours → Thu 10:00.
  assert.equal(slot("2026-11-17T20:00:00"), IST("2026-11-19T10:00:00").toISOString());
  // Applied Fri 23:00 → Sat 23:00 → Sunday skipped → Mon 10:00.
  assert.equal(slot("2026-11-20T23:00:00"), IST("2026-11-23T10:00:00").toISOString());
  // Applied Sat 06:00 with no delay → Sat 10:00.
  assert.equal(slot("2026-11-21T06:00:00", 0), IST("2026-11-21T10:00:00").toISOString());
  // 17:45 leaves no room for a 25-minute interview before 18:00 → next day.
  assert.equal(slot("2026-11-17T17:45:00", 0), IST("2026-11-18T10:00:00").toISOString());
});

test("time zones: unknown zones fall back to India time", () => {
  assert.equal(safeTimeZone("Europe/London"), "Europe/London");
  assert.equal(safeTimeZone("Mars/Base"), "Asia/Kolkata");
  assert.equal(safeTimeZone(""), "Asia/Kolkata");
  assert.match(formatInZone(IST("2026-11-18T14:30:00"), "Asia/Kolkata"), /\(IST\)$/);
  assert.match(formatInZone(IST("2026-11-18T14:30:00"), "Europe/London"), /9:00/);
});

test("a job's overrides replace only what they set", () => {
  const s = effectiveSettings({ ...DEFAULT_SETTINGS, enabled: true }, { questionCount: 6, enabled: false });
  assert.equal(s.questionCount, 6);
  assert.equal(s.durationMinutes, DEFAULT_SETTINGS.durationMinutes);
  assert.equal(s.enabled, false);
  assert.equal(effectiveSettings({ ...DEFAULT_SETTINGS, enabled: true }, { enabled: true }).enabled, true);
});

test("templates: placeholders fill in, unknown ones are flagged and dropped", () => {
  const out = renderTemplate("Hi {{candidateName}}, {{jobTitle}} {{nope}}!", { candidateName: "Asha", jobTitle: "Developer" });
  assert.equal(out, "Hi Asha, Developer !");
  assert.deepEqual(unknownPlaceholders("{{candidateName}} {{nope}} {{ alsoNope }}"), ["nope", "alsoNope"]);
  for (const [kind, t] of Object.entries(DEFAULT_TEMPLATES.email)) {
    assert.deepEqual(unknownPlaceholders(t.subject + t.body), [], `default ${kind} template`);
  }
  assert.ok(DEFAULT_TEMPLATES.email.invite.body.includes("{{interviewLink}}"));
});

test("calendar file: valid structure, escaped text, folded lines", () => {
  const ics = buildIcs({
    uid: "ai-interview-1@ukvalley",
    sequence: 2,
    method: "REQUEST",
    start: new Date("2026-11-18T09:00:00Z"),
    end: new Date("2026-11-18T09:25:00Z"),
    summary: "AI interview: Developer, Ukvalley",
    description: "Line one; line two\nhttps://example.com/interview/" + "x".repeat(80),
    url: "https://example.com/interview/abc",
    organizer: { name: "HR", email: "hr@example.com" },
    attendee: { name: "Asha", email: "asha@example.com" },
  });
  assert.match(ics, /^BEGIN:VCALENDAR\r\n/);
  assert.match(ics, /METHOD:REQUEST\r\n/);
  assert.match(ics, /DTSTART:20261118T090000Z\r\n/);
  assert.match(ics, /SEQUENCE:2\r\n/);
  assert.ok(ics.includes("SUMMARY:AI interview: Developer\\, Ukvalley"));
  for (const line of ics.split("\r\n")) assert.ok(Buffer.byteLength(line) <= 75, `line too long: ${line}`);
  assert.equal(icsEscape("a,b;c\\d\ne"), "a\\,b\\;c\\\\d\\ne");
  const cancel = buildIcs({ uid: "u", sequence: 3, method: "CANCEL", start: new Date(), end: new Date(), summary: "s", description: "d", url: "u", organizer: { name: "o", email: "o@x" }, attendee: { name: "a", email: "a@x" } });
  assert.match(cancel, /STATUS:CANCELLED/);
  assert.doesNotMatch(cancel, /VALARM/);
});
