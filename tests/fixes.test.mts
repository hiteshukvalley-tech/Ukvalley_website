// Unit tests for fixes found in the code read-through (Nov 2026). Run: npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import { ACCESS_KEYS, canUseArea, effectiveAccess } from "../src/lib/admin-access.ts";
import { icsMail, icsParam } from "../src/lib/ai-interview/ics.ts";
import { renderTemplate, unknownPlaceholders } from "../src/lib/ai-interview/templates.ts";
import { CONSENT_ITEMS, isCheatFlag } from "../src/lib/ai-interview/types.ts";

test("users: an older team member's form ticks exactly what they can open (no applicants, leads or AI interviews)", () => {
  const ticked = effectiveAccess(undefined);
  for (const key of ACCESS_KEYS) {
    assert.equal(ticked.includes(key), canUseArea("editor", undefined, key), key);
  }
  for (const sensitive of ["applications", "leads", "ai-interviews"]) assert.ok(!ticked.includes(sensitive), sensitive);
  // A stored list is kept as it is (cleaned, in checklist order).
  assert.deepEqual(effectiveAccess(["leads", "nope", "home", "leads"]), ["home", "leads"]);
});

test("calendar file: names are quoted and addresses can't break the line", () => {
  assert.equal(icsParam('Asha; "A":B,C'), '"Asha;  A :B,C"');
  assert.equal(icsParam("Line\r\nATTENDEE:evil"), '"Line  ATTENDEE:evil"');
  assert.equal(icsMail("asha@example.com"), "asha@example.com");
  assert.equal(icsMail("a@b.com\r\nATTENDEE:mailto:x@y.z"), "a@b.comATTENDEEmailtox@y.z");
});

test("templates: Object properties are not placeholders", () => {
  assert.equal(renderTemplate("{{constructor}}{{toString}}x", {}), "x");
  assert.deepEqual(unknownPlaceholders("{{constructor}} {{hasOwnProperty}} {{candidateName}}"), ["constructor", "hasOwnProperty"]);
});

test("integrity flags: only the known kinds are accepted", () => {
  assert.ok(isCheatFlag("fullscreen_exit"));
  assert.ok(!isCheatFlag("constructor"));
  assert.ok(!isCheatFlag("toString"));
});

test("consent: one list of texts for the portal and the server", () => {
  assert.deepEqual(Object.keys(CONSENT_ITEMS), ["audio", "video", "transcription", "ai", "storage"]);
});
