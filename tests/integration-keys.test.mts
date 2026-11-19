// Unit tests for the API keys page's definitions (src/lib/integration-keys-shared.ts). Run: npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import { KEY_DEFS, KEY_GROUPS, keyDef, mask } from "../src/lib/integration-keys-shared.ts";

const ok = (name: string, v: string) => assert.equal(keyDef(name)!.check(v), null, `${name} should accept ${v}`);
const bad = (name: string, v: string) => assert.notEqual(keyDef(name)!.check(v), null, `${name} should refuse ${v}`);

test("api keys: every key has a group, a label, a hint and a unique name", () => {
  const names = new Set<string>();
  const groups = new Set(KEY_GROUPS.map((g) => g.key));
  for (const d of KEY_DEFS) {
    assert.ok(!names.has(d.name), `duplicate ${d.name}`);
    names.add(d.name);
    assert.ok(groups.has(d.group), d.name);
    assert.ok(d.label && d.hint, d.name);
    // Dropdowns accept each of their own options.
    for (const o of d.options ?? []) assert.equal(d.check(o.value), null, `${d.name}=${o.value}`);
    if (d.defaultValue) assert.equal(d.check(d.defaultValue), null, `${d.name} default`);
  }
  // Values the site needs before it can read the database never move to the admin.
  for (const n of ["MONGODB_URI", "AUTH_SECRET", "ADMIN_PASSWORD", "SITE_URL"]) assert.equal(keyDef(n), undefined, n);
});

test("api keys: values are checked before saving", () => {
  ok("ANTHROPIC_API_KEY", "sk-ant-api03-" + "x".repeat(40));
  bad("ANTHROPIC_API_KEY", "sk-ant with space " + "x".repeat(20));
  bad("ANTHROPIC_API_KEY", "short");
  ok("AI_INTERVIEW_MODEL", "claude-opus-5-5");
  bad("AI_INTERVIEW_MODEL", "claude opus");
  ok("GOOGLE_CLIENT_ID", "1234-abc.apps.googleusercontent.com");
  bad("GOOGLE_CLIENT_ID", "1234-abc.example.com");
  ok("WHATSAPP_PHONE_NUMBER_ID", "123456789012345");
  bad("WHATSAPP_PHONE_NUMBER_ID", "+91 98000 00000");
  ok("WHATSAPP_API_VERSION", "v21.0");
  bad("WHATSAPP_API_VERSION", "21");
  ok("S3_RECORDINGS_BUCKET", "ukvalley-recordings");
  bad("S3_RECORDINGS_BUCKET", "UK_Recordings");
  ok("AWS_REGION", "ap-south-1");
  ok("AWS_REGION", "us-gov-west-1");
  bad("AWS_REGION", "mumbai");
  ok("AWS_ACCESS_KEY_ID", "AKIAABCDEFGHIJKLMNOP");
  bad("AWS_ACCESS_KEY_ID", "akia-lower");
  ok("RECORDING_ENCRYPTION_KEY", "a-long-random-recording-key");
  bad("RECORDING_ENCRYPTION_KEY", "short");
  ok("INTERVIEW_BASE_URL", "https://www.ukvalley.com");
  ok("INTERVIEW_BASE_URL", "http://localhost:3000");
  bad("INTERVIEW_BASE_URL", "http://www.ukvalley.com");
  bad("INTERVIEW_BASE_URL", "https://www.ukvalley.com/interview");
  bad("INTERVIEW_BASE_URL", "not a url");
  ok("AI_INTERVIEW_PROVIDER", "mock");
  bad("AI_INTERVIEW_PROVIDER", "openai");
});

test("api keys: secrets are masked to their last four characters", () => {
  assert.equal(mask("sk-ant-abcdWXYZ"), "••••WXYZ");
  assert.equal(mask(""), "");
});
