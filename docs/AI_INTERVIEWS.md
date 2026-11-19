# AI interviews: setup, data models, HR API, testing and deployment

The AI interview module runs the first interview round for every job application:
it schedules the interview, sends the invitation and reminders (email, WhatsApp,
Google Calendar), runs a spoken, job-specific interview in the candidate's browser
with Claude as the interviewer, records it, scores it against the job's rubric,
and gives HR one place to review, compare and decide.

AI scores are recommendations only. HR makes every hiring decision and can
override the AI with a reason, and every action is kept in an audit trail.

- Admin panel: **Admin → AI interviews** (dashboard, schedule, candidate details, compare, notifications, settings).
- Candidate portal: `/interview/<token>` (the link in the invitation).
- HR REST API: `/admin/api/ai-interviews/…` (below).

## 1. How it fits the existing project

The project is Next.js (App Router) with the native MongoDB driver. The module
follows the same conventions as the rest of the admin: server components and
server actions for the panel, route handlers for the portal and the API, and the
existing admin login.

| Need | Where it lives |
|---|---|
| Who may use it | Admin → Users. Admins always; a team member needs the **AI interviews** section. **Use HR team access** ticks Job openings, Job applications and AI interviews. |
| Trigger | `src/lib/ai-interview/lifecycle.ts` `onApplicationCreated()`, called when the careers form saves an application |
| Fresher / experienced | `classifyExperience()` in `types.ts`; threshold **fresherBelowYears** (settings, default 1 year) |
| Questions and evaluation | `ai.ts` (Claude API through `@anthropic-ai/sdk`; `AI_INTERVIEW_PROVIDER=mock` for tests) |
| Background work | `jobs.ts`: a MongoDB-backed job queue (invites, reminders, calendar, question prep, evaluation, link expiry, recording purge; up to 4 at once per server, leases renewed while a job runs). The model sync runs on the same timer. It starts with the server (`src/instrumentation.ts`), so no Redis is needed. |
| Recordings | `recordings.ts`: chunked upload, AES-GCM encrypted, GridFS (default) or a private S3 bucket |
| Candidate portal | `src/app/interview/[token]/` |
| Admin pages | `src/app/admin/(panel)/ai-interviews/` |
| HR REST API | `src/app/admin/api/ai-interviews/` |
| Data models | `src/lib/ai-interview/models.ts`, `models-store.ts` |

## 2. Data models (MongoDB collections)

Every interview is linked to its **candidate ID, application ID, job ID,
interview (session) ID and configuration ID**.

| Model | Collection | Key | Notes |
|---|---|---|---|
| Users | `users` | id | existing admin users |
| Jobs | `careers` | slug | existing job openings (`jobId` = slug) |
| Applications | `applications` | id | existing; the interview moves its stage (shortlisted, rejected…) |
| Candidates | `aiCandidates` | `cand_<hash of email>` | one per person across applications |
| InterviewConfigurations | `aiInterviewConfigurations` | `cfg_<hash of settings>` | the exact settings an interview ran with; candidates for the same job share one rubric |
| InterviewSessions | `aiInterviews` | interviewId | **source of truth** for the live interview (status, link, device lock, consent, plan, answers, test, flags) |
| InterviewSchedules | `aiInterviewSchedules` | interviewId | start, link window, time zone, reminders, calendar event |
| InterviewQuestions | `aiInterviewQuestions` | `interviewId:questionId` | spoken questions (section, follow-up of, asked at, scoring intent) and test (MCQ) questions |
| InterviewAnswers | `aiInterviewAnswers` | `interviewId:questionId` | text, speech/typed, start/end, recording offset, per-question AI score and evidence; MCQ choice and correctness |
| InterviewTranscripts | `aiInterviewTranscripts` | interviewId | interviewer and candidate turns with timestamps and recording offsets |
| InterviewRecordings | `aiInterviewRecordingSets` | interviewId | storage, size, segments, consent, deletion date; the encrypted chunks are in `aiInterviewRecordings` and the `aiRecordings` GridFS bucket |
| InterviewEvaluations ("Score") | `aiInterviewEvaluations` | interviewId | overall, per-criterion and per-section scores with evidence, test score, strengths, weaknesses, skill gaps, training, AI and final (HR) recommendation, integrity-flag counts |
| HRInterviewReviews | `aiHrInterviewReviews` | interviewId | comments, decisions, override and reason |
| NotificationTemplates | `aiInterviewSettings` (`_id: "global"`, `templates`) | | edited in Settings |
| NotificationLogs | `aiNotificationLogs` | | type, recipient, sent time, delivery status, failure reason, attempts |
| CalendarIntegrations | `aiIntegrations` (`_id: "google-calendar"`) | | refresh token encrypted |
| InterviewAuditLogs | `aiInterviewAudit` | | append-only |
| (jobs) | `aiInterviewJobs` | | the background queue |

**How the models stay correct.** The live interview needs single-document,
atomic updates (the current question, the device lock, the test deadline), so
it runs on the session document. After every change the session is written out
to the model collections (changes within ¾ s are merged), and the background
worker re-syncs any session whose models are behind once a minute (after a
restart, for example). Each model document carries `sourceUpdatedAt`, so an
older write can never replace a newer one. **Settings → Data models → Rebuild**
rewrites all of them.

Each model collection is created with a MongoDB `$jsonSchema` validator and its
indexes on first use (`ensureModelCollections()`). No migration step is needed:
existing interviews are filled in by the first sync.

## 3. API keys and environment variables

**The easy way: Admin → Site settings → API keys** (admins only). Every key
in the table below except the first three rows can be added, replaced or removed
there, with no restart: Claude, Google Calendar, WhatsApp, S3 and the
recording key. Keys are encrypted (AES-256-GCM, key derived from `AUTH_SECRET`)
before they are stored in the `appIntegrationKeys` collection, shown only as
their last four characters, and every change is logged (who, when, which key,
never the value). Each service has a **Test saved keys** button.

A key saved in the admin is used instead of the same variable in `.env`;
removing it there falls back to `.env`, then to the built-in default. Other
servers pick up a change within 30 seconds. The recording encryption key can
only be set or changed while no recordings are stored. Changing the Google
client ID disconnects the calendar (connect it again). If `AUTH_SECRET`
changes, the saved keys can't be decrypted and must be entered again (the page
says which).

Alternatively, set them as environment variables (`.env.local`, or the host's
settings); see `.env.example`. Settings shows a missing integration as "not set
up", and that channel is skipped. Nothing pretends to work.

`MONGODB_URI`, `MONGODB_DB`, `AUTH_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`,
`SITE_URL`, `API_URL` and `NEXT_PUBLIC_*` must stay in the environment: the site
needs them before it can read the database, or they are fixed at build time.

| Variable | Required | Purpose |
|---|---|---|
| `MONGODB_URI`, `MONGODB_DB` | yes | database (already used by the site) |
| `AUTH_SECRET` | yes | signs sessions and links; also part of the recording and OAuth-token encryption keys |
| `ANTHROPIC_API_KEY` | yes, for real interviews | Claude API: question writing, follow-ups, evaluation |
| `DEEPGRAM_API_KEY`, `DEEPGRAM_MODEL`, `DEEPGRAM_LANGUAGE` | recommended | Deepgram live speech-to-text (`src/lib/ai-interview/speech.ts`): the candidate's browser streams 16 kHz audio to Deepgram with a 60-second token from `POST /interview/<token>/api/speech_token`; the key stays on the server. Model default `nova-3`, language `auto` (from the interview language). Without a key, or if Deepgram fails twice, the browser's own recognition is used (Chrome/Edge). |
| `AI_INTERVIEW_MODEL` | no | default `claude-opus-5-5` |
| `AI_INTERVIEW_PROVIDER` | no | `mock` = fixed questions and scores (local testing, no API key) |
| `INTERVIEW_BASE_URL` | no | host of interview links; default `SITE_URL` |
| `RECORDING_STORAGE` | no | `gridfs` (default) or `s3` |
| `RECORDING_ENCRYPTION_KEY` | recommended | extra key for recordings (changing it makes existing recordings unreadable) |
| `S3_RECORDINGS_BUCKET`, `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` | for S3 | a **private** bucket (block all public access) |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | for Google Calendar | OAuth web client with the Calendar API enabled |
| `WHATSAPP_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_APP_SECRET`, `WHATSAPP_VERIFY_TOKEN`, `WHATSAPP_API_VERSION` | for WhatsApp | WhatsApp Business Cloud API (Meta) |
| SMTP | for email | the HR mail server in Admin → Site settings (or `SMTP_*` variables) |

### Google Calendar
1. Google Cloud Console → APIs & Services → enable **Google Calendar API**.
2. OAuth consent screen (internal or external), scope `calendar.events`.
3. Credentials → OAuth client ID → *Web application*. Authorised redirect URI:
   `<API_URL>/admin/ai-interviews/settings/google/callback`.
4. Set `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`, restart, then **Admin → AI interviews → Settings → Connect Google Calendar**.

Events are created when an interview is scheduled, moved on reschedule and
cancelled on cancel; the candidate is a guest, so Google sends them the
invitation. The event ID is stored on the session and the schedule model.
Without Google, the invitation email carries an `.ics` calendar file.

### WhatsApp
1. Meta Business → WhatsApp → API setup: a permanent token and the phone number ID.
2. Create and get approval for the message templates named in Settings (invite, reminder, rescheduled, cancelled).
3. Webhook: `<API_URL>/whatsapp/webhook`, verify token = `WHATSAPP_VERIFY_TOKEN`, subscribe to `messages` (delivery receipts).
4. Candidates get WhatsApp only when they ticked the WhatsApp consent on the form.

## 4. HR REST API

Same login as the admin panel (the session cookie). Admins, and team members with
the **AI interviews** section. Writes must come from the panel's own origin.
Responses are `{ "ok": true, "data": … }` or `{ "ok": false, "error": "…" }`.
Signed out: `401`; without the section: `403`. Link tokens, their hashes and the
device key are never returned.

| Method | Path | What it does |
|---|---|---|
| GET | `/admin/api/ai-interviews` | list; `status, position, experienceType, recommendation, minScore, q, from, to, sort=schedule\|score\|created, page, pageSize` |
| POST | `/admin/api/ai-interviews` | `{ applicationId, startsAt?, mode? }`: create (and schedule) an interview |
| GET | `/admin/api/ai-interviews/dashboard` | cards (total, scheduled, pending, completed, cancelled, no-show, average score, recommended), completion rate, charts data, upcoming, recent activity |
| GET | `/admin/api/ai-interviews/compare?position=…` | candidates for one job ranked; `sort=overall\|technical\|communication\|problem_solving\|test\|experience, experienceType, completedOnly=1, minScore`; without `position`: the positions |
| GET | `/admin/api/ai-interviews/notifications` | notification log; `interviewId, channel, status, page` |
| GET | `/admin/api/ai-interviews/calendar` | Google Calendar connection status |
| GET | `/admin/api/ai-interviews/{id}` | the session plus every linked model (`?models=0` for the session only) |
| GET | `/admin/api/ai-interviews/{id}/evaluation` | scores, evidence, AI and final recommendation, integrity flags |
| GET | `/admin/api/ai-interviews/{id}/transcript` | transcript with timestamps |
| GET | `/admin/api/ai-interviews/{id}/questions` | questions and answers with per-question scores |
| GET | `/admin/api/ai-interviews/{id}/recordings` | segments with HR-only playback and download URLs |
| GET | `/admin/api/ai-interviews/{id}/audit` | audit trail |
| PUT | `/admin/api/ai-interviews/{id}/reschedule` | `{ startsAt: "2026-11-24T11:00:00+05:30" }`: new time, new link (old one stops working), calendar and reminders updated, candidate told |
| PUT | `/admin/api/ai-interviews/{id}/cancel` | `{ reason? }`: cancels, tells the candidate, cancels the calendar event |
| PUT | `/admin/api/ai-interviews/{id}/decision` | `{ decision: shortlist\|reject\|next_round\|move_stage\|reassess\|comment, note?, stage? }` and/or `{ override: <recommendation>\|null, reason }` |
| POST | `/admin/api/ai-interviews/{id}/evaluate` | queue an (re-)evaluation |
| POST | `/admin/api/ai-interviews/{id}/reminder` | send a reminder now |
| GET | `/admin/api/ai-interviews/{id}/link` | the candidate's link, to pass on another way (logged as `link_viewed`) |
| POST | `/admin/api/ai-interviews/{id}/resend` | send the invitation again with the current link |
| POST | `/admin/api/ai-interviews/{id}/auto-schedule` | schedule at the next free working time |
| POST | `/admin/api/ai-interviews/{id}/resume` | allow one more resume after the candidate used them up |
| POST | `/admin/api/ai-interviews/{id}/regenerate` | write new questions (only before anything is answered) |
| POST | `/admin/api/ai-interviews/{id}/message` | `{ subject, body }`: HR's own email to the candidate (in the notification log) |
| PUT | `/admin/api/ai-interviews/{id}/extend` | `{ hours: 2|6|24|48|72 }`: keep the link open longer; reopens a missed or expired interview |
| POST | `/admin/api/ai-interviews/bulk` | `{ ids: [≤100], action, reason? }`: `remind`, `resend_invite`, `auto_schedule`, `extend_24h`, `evaluate`, `shortlist`, `reject` or `cancel` on many at once; answers `{ done, skipped: [{ id, name, reason }] }` |

The list also takes `queue=awaiting_decision|accommodation|evaluation_failed|unfinished|missed|unscheduled` (the dashboard's *Needs attention* lists).

Recording playback: `GET /admin/ai-interviews/{id}/recording/{segment}` (add
`?download=1` to download; downloads are logged in the audit trail). It answers
byte ranges (`Range: bytes=…` → `206`), so the player can seek, and only the
chunks a range needs are decrypted. CSV export: `GET /admin/ai-interviews/export`
with the Schedule list's filters, or `?ids=a,b,c` (logged as `exported_csv`).

### HR tools in the admin

- **Needs attention** (dashboard): interviews waiting for HR (awaiting a decision, accommodation requests, failed evaluations, unfinished, missed, not scheduled), each opening the Schedule list filtered to it.
- **Schedule → select → action**: the bulk actions above, and *Export CSV* (these filters or the selected rows).
- **Quick actions** (an interview's page): copy the candidate's link, send the invitation again, next free time, allow one more resume, new questions, email the candidate, keep the link open longer.
- **Play from here**: each answer in the transcript jumps the recording to where it starts.
- **Must-ask questions** (Settings, and per job): asked word for word, in place of AI questions in their section (`behavioral: …`; no section = job-specific). Marked “HR's question” in the transcript.
- **Candidate picks a time** (Settings: *Candidate may pick a new time*, default once): before starting, or after missing it, the interview page offers working-hour times at least two hours away; choosing one issues a new link (emailed, and the page opens it). Only a time the page offered is accepted.
- **No-show follow-up**: when the link closes unused and the candidate may still pick a time, they get the *Missed interview: pick a new time* email (email only; template in Settings).
- **Evaluation history**: *Evaluate again* keeps the earlier results (last 5) under *Earlier evaluations*, with the change in score. Only one evaluation is queued or running at a time.
- **Failed background jobs** (Notifications page): question writing, evaluations, calendar updates and link closing that stopped after their retries, with *Run again*.

### Rules worth knowing (checked by `scripts/qa/16-ai-interviews.mjs`)

- *Auto-schedule* (one or bulk) only applies to interviews that are unscheduled, missed or expired: a scheduled candidate's link is never replaced by it.
- An open accommodation request must be answered (written interview or keep video) before the interview can get a new time. Answering it after the link closed marks the interview missed/unfinished, ready for a new time.
- *Evaluate* never closes an interview the candidate is taking right now.
- A test that was part of the interview but never taken counts as 0 (noted under *Things to keep in mind*).
- Compare shows each applicant once: their latest evaluated attempt.
- The candidate portal: a reload with nothing new answered never uses up a resume; once everything is answered, a reload goes straight to *Submit*; an interview already under way keeps a grace period past the link's close time (its length + the test + 30 minutes); if the page is closed with everything answered, the interview is completed and evaluated when the link closes. Typed answers and test choices are kept in the browser across reloads, and the test's automatic submit retries while offline. Consent must cover the current mode (switching written → video asks again).
- Deleting a recording stops further uploads for that interview.

How the spec's proposed routes map to these: `/api/interviews/*` and
`/api/hr/interviews/*` → `/admin/api/ai-interviews/*`; `/api/calendar/connect` →
the OAuth flow in Settings; `/api/calendar/events/*` → done by
reschedule/cancel (events are never edited on their own, so they can't
drift from the interview); `/api/notifications/send` → `…/{id}/reminder`
(other notifications are sent by the lifecycle itself); `/api/applications` →
the existing careers form (`POST /careers/apply`). The candidate's own calls
(`start`, `answer`, `test_start`, `test_submit`, `finish`, `recording`, `flag`…)
are `POST /interview/<token>/api/<action>`, authorised by the link token and the
browser it was started in.

## 5. Security and privacy

- Links: random 256-bit tokens; only a hash is stored for lookups (plus an encrypted copy for reminders). Valid from `earlyJoinMinutes` before the start until `joinWindowHours` after it; a reschedule issues a new link and revokes the old one.
- Once started, an interview is bound to that browser (httpOnly cookie); HR can release it.
- Reloading or reopening the page mid-interview pauses it (status *interrupted*) and the candidate continues where they stopped. A resume counts against **maxResumes** only when the candidate answered something since the last start, so reloads on the same question never lock them out. An interview can't be rescheduled while it is running (a new time means a new link).
- Recordings are deleted after the retention period however the interview ends: completed, cancelled, expired or missed. A reschedule clears the deletion date while the interview continues.
- Consent (audio, video, transcription, AI analysis, storage) is required before anything is recorded, and is stored with time, IP and browser. Candidates who can't use a camera or microphone can ask for an alternative (written interview) and are never rejected for it.
- Recordings are encrypted per chunk, never public, played only through the admin, and deleted after the retention period (Settings), or on request.
- Google OAuth refresh tokens are encrypted at rest. API keys exist only on the server.
- The evaluation is told to use job-related evidence only, never appearance, voice, accent, age, gender or other protected characteristics, and technical problems (camera/mic lost, offline, resumed) are passed as context so they never count against the answers.
- Integrity flags (tab switch, leaving the window, paste, more than one face or no face where the browser supports face detection, connection lost) are warnings for HR only: never sent to the AI and never an automatic rejection.
- Rate limits on the portal API and the careers form; same-origin checks on every write.

## 6. Testing

```bash
npm test     # unit tests: scoring, weights, scheduling, time zones, templates, calendar file, data models
npm run lint
npx tsc --noEmit
```

`scripts/qa/17-api-keys.mjs` checks the API keys page: validation, encrypted
storage, masking, replace and remove, history, the recording-key lock, and that
a value saved there is used at once (run it before 16 without
`AI_INTERVIEW_PROVIDER` set: 17 switches test mode on from the admin).

End to end (real browser, fake camera/microphone, mock AI, throwaway local
database, fake SMTP; its collections are emptied at the end, QA_DROP=1 drops the database):

```bash
mongod --dbpath <empty folder> --port 27099
npm run build      # or NEXT_DIST_DIR=.next-build npx next build --webpack
NEXT_DIST_DIR=.next-build MONGODB_URI=mongodb://127.0.0.1:27099 MONGODB_DB=ukvalley_ai_qa \
  AI_INTERVIEW_PROVIDER=mock SMTP_HOST=127.0.0.1 SMTP_PORT=2525 SMTP_SECURITY=none \
  SMTP_USER=qa@example.com SMTP_PASS=qa MAIL_FROM=qa@example.com npx next start -p 3100
node scripts/qa/16-ai-interviews.mjs
```

`scripts/qa/18-hr-panel-demo.mjs` (same server setup) is the A-to-Z demo: a
candidate applies, HR moves the interview to now, the candidate takes it in
Chrome (a reload mid-answer keeps the draft and uses no resume; a reload on the
last screen goes straight to Submit), HR opens every HR page on desktop and
phone width (no errors, nothing cut off), comments, shortlists and exports, and
an HR team member can open the HR sections and nothing else. It saves a
screenshot of every screen to `QA_SHOTS` (default `./qa-shots`).

Settings for the test server: `QA_ALLOW_LOCAL_SMTP=1` lets the suites' fake
mail server on 127.0.0.1 be saved in the admin (refused otherwise, as a private
address); for a server *without* email (suite 14), set the `SMTP_*` variables to
a single space so `.env.local`'s real mail server isn't picked up. Run the
suites with `QA_MONGODB_URI=mongodb://127.0.0.1:27099`, so their own database
checks use the same local throwaway database as the server, never the
`.env.local` cluster.

It applies through the careers form, checks the invitation, reschedules through
the API, takes the whole interview in Chrome (consent, device check, questions,
timed test, submit), waits for the evaluation, checks every model collection and
its validator, plays the recording as HR, records a decision and an override,
and checks access control (signed out, cross-site).

Manual checklist with real services: connect Google Calendar and confirm the
event appears, moves on reschedule and disappears on cancel; send a WhatsApp
template to a test number; take one interview with `ANTHROPIC_API_KEY` set and
read the evaluation; deny camera permission and confirm the portal explains how
to allow it.

## 7. Deployment

1. On the host (Render: Environment) set the database, `AUTH_SECRET` and the owner login. Then add the service keys in **Admin → Site settings → API keys** (or as environment variables): at minimum the Anthropic API key, plus a recording encryption key before the first interview. Set the HR mail server in Site settings.
2. Deploy as usual (`npm run build`, `npm start`). The job worker starts with the server; run **one** instance, or several: jobs are claimed with a lease, so they never run twice.
3. MongoDB: no migration. Collections, validators and indexes are created on first use. The database user needs `createCollection`, `createIndex` and (for validator updates) `collMod`. Atlas "readWrite" plus "dbAdmin" on the database covers this.
4. Recordings are about 3 MB per minute (≈ 60–90 MB for a 25-minute interview at 350 kbit/s video + 48 kbit/s audio). In MongoDB that fills an Atlas tier quickly: for more than a handful of interviews use S3 (`RECORDING_STORAGE=s3`, private bucket, server-side encryption on) and keep the retention period short.
5. Register the Google redirect URI and the WhatsApp webhook on the production address (section 3).
6. In **Admin → AI interviews → Settings**: switch AI interviews on, set duration, question count, weights, passing score, templates and reminders, and per-job settings where a role needs its own.
7. Give HR staff a team-member account with **Use HR team access** (Admin → Users).
