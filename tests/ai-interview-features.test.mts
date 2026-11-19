// Unit tests for the AI interview features added in Nov 2026 (seeking, CSV
// export, must-ask questions, candidate-picked times). Run: npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import { parseRange } from "../src/lib/ai-interview/range.ts";
import { csvCell, toCsv } from "../src/lib/ai-interview/csv.ts";
import {
  ATTENTION_QUEUES, BULK_ACTIONS, DEFAULT_SETTINGS, attentionQueueInfo, bulkActionLabel, isBulkAction, isWorkingSlot, parseMustAsk, workingSlots,
} from "../src/lib/ai-interview/types.ts";

test("seeking: byte ranges are read like a browser sends them", () => {
  assert.equal(parseRange(null, 1000), undefined); // whole file
  assert.deepEqual(parseRange("bytes=0-", 1000), { start: 0, end: 999 });
  assert.deepEqual(parseRange("bytes=100-199", 1000), { start: 100, end: 199 });
  assert.deepEqual(parseRange("bytes=900-5000", 1000), { start: 900, end: 999 }); // clipped to the end
  assert.deepEqual(parseRange("bytes=-100", 1000), { start: 900, end: 999 }); // the last 100 bytes
  assert.equal(parseRange("bytes=1000-", 1000), null); // past the end: 416
  assert.equal(parseRange("bytes=500-100", 1000), null);
  assert.equal(parseRange("bytes=0-1,5-9", 1000), undefined); // multiple ranges: send it all
  assert.equal(parseRange("items=0-1", 1000), undefined);
});

test("CSV export: quoting, and formulas can't run in a spreadsheet", () => {
  assert.equal(csvCell("Asha Rao"), "Asha Rao");
  assert.equal(csvCell('Rao, "Asha"'), '"Rao, ""Asha"""');
  assert.equal(csvCell("line\nbreak"), '"line\nbreak"');
  assert.equal(csvCell("=HYPERLINK(\"x\")"), `"'=HYPERLINK(""x"")"`);
  assert.equal(csvCell("+91 98000"), "'+91 98000");
  assert.equal(csvCell("@cmd"), "'@cmd");
  assert.equal(csvCell(-5), "-5"); // a real number stays a number
  assert.equal(csvCell(null), "");
  const out = toCsv([["a", "b"], [1, "x,y"]]);
  assert.ok(out.startsWith("﻿"));
  assert.equal(out.slice(1), 'a,b\r\n1,"x,y"\r\n');
});

test("must-ask questions: sections are read from the line, others are job-specific", () => {
  const q = parseMustAsk([
    "behavioral: Tell me about a deadline you missed.",
    "Behavioural: How do you handle feedback?",
    "technical:   Explain how an index speeds up a query.",
    "Why do you want this job?",
    "nonsense: What is this?",
    "   ",
    "hi",
  ]);
  assert.deepEqual(q.map((x) => x.section), ["behavioral", "behavioral", "technical", "job_specific", "job_specific"]);
  assert.equal(q[2].text, "Explain how an index speeds up a query.");
  assert.equal(q[4].text, "nonsense: What is this?"); // unknown section: the whole line is the question
  assert.equal(parseMustAsk(Array.from({ length: 40 }, (_, n) => `Question number ${n}?`)).length, 15);
  assert.deepEqual(DEFAULT_SETTINGS.mustAskQuestions, []);
});

test("candidate-picked times: working slots only, spread out, never too soon", () => {
  const rules = { startHour: 10, endHour: 18, skipSundays: true, durationMinutes: 25 };
  // Saturday 21 Nov 2026, 17:10 India time.
  const from = new Date("2026-11-21T17:10:00+05:30");
  const slots = workingSlots(from, rules, 6, { minLeadHours: 2, gapHours: 3, maxDays: 14 });
  assert.equal(slots.length, 6);
  for (const s of slots) {
    assert.ok(isWorkingSlot(s, rules), s.toISOString());
    assert.ok(s.getTime() >= from.getTime() + 2 * 3600_000);
    const ist = new Date(s.getTime() + 330 * 60_000);
    assert.notEqual(ist.getUTCDay(), 0, "no Sundays");
  }
  for (let n = 1; n < slots.length; n++) assert.ok(slots[n].getTime() - slots[n - 1].getTime() >= 3 * 3600_000);
  // The first one is Monday 10:00 (Saturday evening is past working hours, Sunday is skipped).
  assert.equal(slots[0].toISOString(), new Date("2026-11-23T10:00:00+05:30").toISOString());
  assert.ok(!isWorkingSlot(new Date("2026-11-23T10:15:00+05:30"), rules), "not on the half hour");
  assert.ok(!isWorkingSlot(new Date("2026-11-23T17:45:00+05:30"), rules), "would end after 18:00");
  assert.ok(!isWorkingSlot(new Date("2026-11-22T11:00:00+05:30"), rules), "Sunday");
});

test("bulk actions and work queues have labels", () => {
  for (const a of BULK_ACTIONS) assert.ok(bulkActionLabel[a]);
  for (const q of ATTENTION_QUEUES) assert.ok(attentionQueueInfo[q].label && attentionQueueInfo[q].hint);
  assert.ok(isBulkAction("remind"));
  assert.ok(!isBulkAction("constructor"));
  assert.equal(DEFAULT_SETTINGS.candidateReschedules, 1);
});
