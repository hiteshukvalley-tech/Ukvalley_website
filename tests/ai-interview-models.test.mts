// Unit tests for the normalized data models (src/lib/ai-interview/models.ts). Run: npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_SETTINGS } from "../src/lib/ai-interview/types.ts";
import {
  MODEL_COLLECTIONS, MODEL_INDEXES, MODEL_VALIDATORS, buildModels, candidateIdFor, configIdFor, jobIdFor, stableJson,
} from "../src/lib/ai-interview/models.ts";
import type { InterviewRecord } from "../src/lib/ai-interview/store.ts";

const t0 = new Date("2026-11-24T05:30:00Z");
const at = (min: number) => new Date(t0.getTime() + min * 60_000);

function sample(over: Partial<InterviewRecord> = {}): InterviewRecord {
  return {
    id: "int-1",
    applicationId: "app-1",
    careerSlug: "mern-developer",
    attempt: 1,
    candidate: {
      name: "Asha Rao", email: " Asha.Rao@Example.com ", phone: "+919800000000", location: "Pune", experience: "2-4 years",
      currentCompany: "Acme", skills: "React, Node.js; MongoDB", education: "B.E.", whatsappOptIn: true, timeZone: "Asia/Kolkata",
    },
    position: "MERN Stack Developer",
    experienceType: "experienced",
    config: DEFAULT_SETTINGS,
    status: "completed",
    mode: "video",
    schedule: { startsAt: t0, closesAt: at(24 * 60), version: 2 },
    tokenHash: "h", tokenEnc: "e", device: null,
    consent: { at: at(-2), ip: "1.2.3.4", userAgent: "UA", items: ["audio", "video"], version: "1" },
    calendar: { status: "created", eventId: "ev1" },
    questions: [
      { id: "q1", section: "intro", text: "Introduce yourself.", intent: "clear summary", askedAt: at(1) },
      { id: "q2", section: "technical", text: "How do you index MongoDB?", intent: "compound indexes", askedAt: at(3) },
      { id: "q3", section: "technical", text: "Follow-up: which index?", intent: "ESR rule", followUpOf: "q2", askedAt: at(5) },
      { id: "q4", section: "behavioral", text: "Not asked yet", intent: "x" },
    ],
    answers: [
      { questionId: "q1", text: "I build web apps", input: "speech", startedAt: at(1), endedAt: at(2), offsetMs: 60_000 },
      { questionId: "q2", text: "", input: "typed", startedAt: at(3), endedAt: at(4), skipped: true },
      { questionId: "q3", text: "Equality, sort, range", input: "speech_edited", startedAt: at(5), endedAt: at(6), offsetMs: 300_000 },
    ],
    followUpsUsed: 1,
    mcq: {
      questions: [{ id: "m1", question: "2+2?", options: ["3", "4"], correctIndex: 1, topic: "math" }],
      submittedAt: at(10), answers: { m1: 1 }, score: 100,
    },
    flags: [{ kind: "tab_hidden", at: at(2) }, { kind: "tab_hidden", at: at(4) }],
    resumes: 0,
    startedAt: at(0),
    completedAt: at(11),
    recording: { segments: 1, chunks: 12, bytes: 1000, storage: "gridfs" },
    evaluation: {
      state: "done", attempts: 1, model: "claude-opus-5-5", at: at(15),
      result: {
        overall: 72, passingScore: 60,
        criteria: {
          technical: { score: 70, evidence: "q3" }, problem_solving: { score: 75, evidence: "" }, communication: { score: 80, evidence: "" },
          job_knowledge: { score: 65, evidence: "" }, practical_experience: { score: 70, evidence: "" }, behavioral: { score: 70, evidence: "" },
        },
        sections: { intro: 80, technical: 60 },
        questions: [{ questionId: "q3", score: 85, comment: "good", evidence: "Equality, sort, range" }],
        technicalAssessment: "", communicationAssessment: "", problemSolvingAssessment: "",
        strengths: ["indexing"], weaknesses: [], skillGaps: [], training: [], summary: "Solid.",
        recommendation: "recommended", aiRecommendation: "recommended", recommendationReason: "", caveats: [], testScore: 100,
      },
    },
    hr: {
      comments: [],
      decisions: [{ kind: "shortlist", by: "hr@x", at: at(20), note: "" }],
      recommendationOverride: "strongly_recommended",
      overrideReason: "great test",
    },
    createdAt: at(-60 * 24),
    updatedAt: at(20),
    createdBy: "system",
    ...over,
  };
}

test("models: ids are stable and every document is linked", () => {
  assert.equal(candidateIdFor("a@b.com"), candidateIdFor("  A@B.com "));
  assert.notEqual(candidateIdFor("a@b.com"), candidateIdFor("c@b.com"));
  // Same settings in a different key order: same configuration.
  const reordered = Object.fromEntries(Object.entries(DEFAULT_SETTINGS).reverse()) as typeof DEFAULT_SETTINGS;
  assert.equal(configIdFor(reordered), configIdFor(DEFAULT_SETTINGS));
  assert.notEqual(configIdFor({ ...DEFAULT_SETTINGS, passingScore: 70 }), configIdFor(DEFAULT_SETTINGS));
  assert.equal(stableJson({ b: 1, a: [2, { d: 1, c: undefined }] }), `{"a":[2,{"d":1}],"b":1}`);
  assert.equal(jobIdFor({ careerSlug: null, position: " QA Lead " }), "position:qa lead");

  const m = buildModels(sample());
  for (const doc of [m.schedule, m.transcript, m.recording, m.evaluation, m.review, ...m.questions, ...m.answers]) {
    assert.equal(doc.interviewId, "int-1");
    assert.equal(doc.applicationId, "app-1");
    assert.equal(doc.candidateId, m.candidate._id);
    assert.equal(doc.jobId, "mern-developer");
    assert.equal(doc.configId, m.configuration._id);
    assert.equal(doc.sourceUpdatedAt.getTime(), at(20).getTime());
  }
  assert.equal(m.candidate.email, "asha.rao@example.com");
  assert.deepEqual(m.candidate.skills, ["React", "Node.js", "MongoDB"]);
});

test("models: questions, answers and transcript", () => {
  const m = buildModels(sample());
  assert.deepEqual(
    m.questions.map((q) => [q.questionId, q.kind, q.order]),
    [["q1", "spoken", 0], ["q2", "spoken", 1], ["q3", "spoken", 2], ["q4", "spoken", 3], ["m1", "mcq", 4]]
  );
  assert.equal(m.questions[2].followUpOf, "q2");
  const a3 = m.answers.find((a) => a.questionId === "q3")!;
  assert.equal(a3.score, 85);
  assert.equal(a3.durationMs, 60_000);
  assert.equal(m.answers.find((a) => a.kind === "mcq")!.correct, true);
  // Transcript: only asked questions; a skipped answer carries no text.
  assert.deepEqual(m.transcript.entries.map((e) => e.speaker), ["interviewer", "candidate", "interviewer", "candidate", "interviewer", "candidate"]);
  assert.equal(m.transcript.entries[3].skipped, true);
  assert.equal(m.transcript.entries[3].text, "");
  assert.equal(m.transcript.wordCount, 4 + 3);
});

test("models: evaluation, HR review, recording, schedule", () => {
  const m = buildModels(sample());
  assert.equal(m.evaluation.overall, 72);
  assert.equal(m.evaluation.passed, true);
  assert.equal(m.evaluation.recommendation, "recommended");
  assert.equal(m.evaluation.finalRecommendation, "strongly_recommended"); // HR's override wins
  assert.equal(m.evaluation.criteria.length, 6);
  assert.deepEqual(m.evaluation.sections.map((s) => s.key), ["intro", "technical"]);
  assert.deepEqual(m.evaluation.flags, [{ kind: "tab_hidden", count: 2 }]);
  assert.equal(m.review.latestDecision?.kind, "shortlist");
  assert.equal(m.recording.status, "stored");
  assert.equal(
    buildModels(sample({ recording: { segments: 0, chunks: 0, bytes: 0, storage: "s3", deletedAt: at(30) } })).recording.status,
    "deleted"
  );
  assert.equal(m.schedule.reminders.length, DEFAULT_SETTINGS.reminders.length);
  assert.equal(m.schedule.reminders[0].dueAt.getTime(), t0.getTime() - 1440 * 60_000);

  const fresh = buildModels(sample({ schedule: null, evaluation: { state: "none", attempts: 0 }, mcq: null, questions: [], answers: [] }));
  assert.equal(fresh.schedule.startsAt, null);
  assert.equal(fresh.evaluation.overall, null);
  assert.equal(fresh.transcript.entries.length, 0);
  assert.equal(fresh.questions.length, 0);
});

test("models: every collection has a validator and indexes, and built documents satisfy it", () => {
  type K = keyof typeof MODEL_COLLECTIONS;
  for (const k of Object.keys(MODEL_COLLECTIONS) as K[]) {
    assert.ok(MODEL_VALIDATORS[k].$jsonSchema, k);
    assert.ok(MODEL_INDEXES[k].length > 0, k);
  }
  const m = buildModels(sample());
  const required = (k: K) => (MODEL_VALIDATORS[k].$jsonSchema as { required: string[] }).required;
  const pairs: [K, object][] = [
    ["schedules", m.schedule], ["questions", m.questions[0]], ["answers", m.answers[0]], ["transcripts", m.transcript],
    ["recordings", m.recording], ["evaluations", m.evaluation], ["reviews", m.review], ["candidates", m.candidate], ["configurations", m.configuration],
  ];
  for (const [k, doc] of pairs) for (const f of required(k)) assert.ok(f in doc, `${k}.${f}`);
});
