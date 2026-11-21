# CareCircle — Enhanced PRD (v1.2.0-MVP)

Status: approved for build. Source: "CareCircle – Project Documentation | Team 999" (v1.0.0-MVP).

Scope rule: the eleven MVP modules from v1.0 are unchanged. Items marked **[E]** are small enhancements that make the MVP usable or safe. Items marked **[S]** are stretch goals, built only after every MVP acceptance test passes.

This document is the single source of truth. The phase plans in `phases/` implement it. If a phase plan and this document disagree, this document wins and the phase plan must be corrected.

---

## 0. Safety disclaimer (kept from v1.0)

CareCircle is an administrative coordination, schedule tracking, and document organisation tool for patients and family caregivers.

- It is not a medical device, diagnostic tool, or clinical decision support system.
- It does not prescribe, change doses, change timing, or advise on missed doses.
- Every AI-extracted medicine is an unverified draft until a person approves it.
- A dose acknowledgement is a patient-reported confirmation. It is not clinical monitoring.

The disclaimer appears on the landing page, on the sign-up page, on the review screen, and in the footer of every patient screen.

---

## 1. Summary

CareCircle lets a remote family caregiver manage an elderly patient's medicines and checkups. The caregiver uploads a prescription. Gemini proposes a structured medicine list. The caregiver checks and approves it. The patient sees today's doses on a phone and taps to acknowledge them. The caregiver sees compliance live and keeps an audit trail.

### 1.1 Example persona

- Rahul (34, Bangalore) manages his father's care. He is the OWNER.
- Ramesh (68, Mysuru) has Type 2 diabetes and hypertension. He is the PATIENT.
- Priya (Rahul's sister, Pune) helps. She is a CAREGIVER.
- Uncle Suresh wants to see updates only. He is a VIEWER.

All demo data uses these synthetic people. No real patient data is used in demos.

### 1.2 Goals for the MVP

1. A caregiver goes from an uploaded prescription to an active, approved schedule in under 5 minutes.
2. No AI output reaches an active schedule without a person approving it.
3. Ramesh acknowledges a dose with at most two taps.
4. The caregiver sees an acknowledgement within 5 seconds while the dashboard is open.
5. Every change to a patient, medicine, schedule, document, consent, or access link is recorded in the audit log.

---

## 2. Module list

| # | Module | MVP content |
|---|---|---|
| 1 | Authentication | Caregiver sign-up with email and password. Sign-in by password, magic link, or 6-digit email code **[E]**. |
| 2 | Family and patient profile | Demographics, primary condition, notes, emergency contact, primary physician contact, timezone **[E]**, missed-dose grace period **[E]**. One account can manage many patients. |
| 3 | Invitation and access control | Email-bound invite links **[E]** for CAREGIVER, VIEWER, and PATIENT roles. Revoke access. |
| 4 | Medical document vault | Private uploads of JPEG, PNG, and PDF. Metadata: type, doctor, clinic, issue date. Consent required first **[E]**. |
| 5 | AI prescription parser | Gemini extracts medicines into a fixed JSON shape. Mandatory human review. Demo mode with recorded responses **[E]**. |
| 6 | Medication management | Approve parsed medicines, add medicines by hand, stop or change a medicine **[E]**. Schedules: daily, specific weekdays, or every N days. Time slots: morning, afternoon, evening, bedtime. |
| 7 | Patient acknowledgement | Statuses PENDING, ACKNOWLEDGED, SKIPPED, and MISSED **[E]**. |
| 8 | Checkup tracker | Consultations, lab tests, diagnostics. Reminder notification before the visit. Completion log with notes. |
| 9 | Caregiver dashboard | Compliance bars for today and 7 days, missed-dose markers, documents waiting for review, activity timeline. |
| 10 | Patient dashboard | Mobile-first today view, large buttons, slot icons, high contrast, keeps working if the connection drops while open **[E]**. |
| 11 | In-app notifications | Notification centre with unread count, live updates while the app is open. |

---

## 3. Users, roles, and access

### 3.1 Roles

One naming set is used everywhere: database, code, and screens.

| Role | Stored in | Meaning |
|---|---|---|
| `OWNER` | `caregiver_links.role` | Created the patient. Full control. Invites and removes people. Exactly one active OWNER per patient. |
| `CAREGIVER` | `caregiver_links.role` | Uploads, approves, edits schedules and checkups, views everything. Cannot invite or delete. |
| `VIEWER` | `caregiver_links.role` | Read-only: dashboard, medicines, schedules, checkups, document list. |
| `PATIENT` | `patient_links` (one row per patient) | The person cared for. Sees own medicines, doses, and checkups. Acknowledges own doses. |

A user can hold different roles for different patients. A user cannot be both PATIENT and a caregiver for the same patient.

### 3.2 Permission matrix

| Action | OWNER | CAREGIVER | VIEWER | PATIENT |
|---|---|---|---|---|
| View patient profile | Yes | Yes | Yes | Yes (own) |
| Edit patient profile | Yes | Yes | No | No |
| Invite people, revoke invites, remove people | Yes | No | No | No |
| Give consent for documents and AI | Yes | Yes | No | No |
| Withdraw consent | Yes | No | No | No |
| Upload a document, edit its details | Yes | Yes | No | No |
| View documents | Yes | Yes | Yes | No |
| Run AI parsing, approve medicines | Yes | Yes | No | No |
| Add, stop, change medicines | Yes | Yes | No | No |
| View medicines and today's doses | Yes | Yes | Yes | Yes (own) |
| Acknowledge or skip a dose | No | No | No | Yes (own) |
| Create, edit, complete, delete checkups | Yes | Yes | No | No |
| View checkups | Yes | Yes | Yes | Yes (own) |
| View audit log and activity | Yes | Yes | No | No |
| Export patient data | Yes | Yes | No | No |
| Delete a patient | Yes | No | No | No |

### 3.3 Sign-in **[E]**

- Caregivers sign up with full name, email, and password, then confirm their email.
- Everyone can sign in with any of: password, magic link, or the 6-digit code in the same email.
- The 6-digit code exists because a magic link opened in a different browser from the one that asked for it fails. This is common on Android when the mail app opens links in its own browser. The code works in any case.
- Patients usually never set a password. They sign in by code.
- Contact method is email only. SMS sign-in needs an SMS provider and is out of MVP.
- The session stays signed in on that device until the person signs out.

### 3.4 Invitations **[E]**

- The OWNER enters the invitee's email and role (CAREGIVER, VIEWER, or PATIENT).
- The app shows an invite link with a copy button and a share button. The OWNER sends it by WhatsApp, SMS, or email themselves. CareCircle does not send invite emails.
- The link has the form `APP_URL/invite#t=<token>`. The token is in the URL fragment, so it never reaches server logs.
- The token is 32 random bytes, encoded base64url. Only its SHA-256 hash (hex) is stored.
- Expiry: 72 hours. Single use. The OWNER can revoke an unused invite.
- Accepting requires signing in with the invited email. A forwarded link does not work for anyone else.
- A patient can have only one PATIENT login. A PATIENT invite for a patient who already has one is refused.
- A revoked caregiver can be invited again. Accepting restores access with the new role.

### 3.5 Out of scope for access

- Transferring OWNER to another person.
- Organisation or clinic accounts.

---

## 4. Architecture

### 4.1 Stack

| Layer | Choice | Notes |
|---|---|---|
| Database, auth, storage, realtime, scheduled jobs | Supabase (Postgres 15+, `pg_cron`) | Project in the AWS region closest to India that Supabase offers (Mumbai if listed). |
| Web app and API | Next.js App Router, TypeScript strict | Latest stable 16.x, confirmed in Phase 0. |
| Hosting | AWS Amplify Hosting | Next.js server rendering. Server-side environment variables written at build time (Phase 0). |
| UI | Tailwind CSS | WCAG 2.1 AA contrast. No component library required. |
| AI | Google Gemini REST API | Billing-enabled project. Model ID from `GEMINI_MODEL`. Called only from server code. |
| Auth email | Supabase Auth email; Amazon SES as custom SMTP for staging **[E]** | Supabase's built-in email has low hourly limits. |
| Tests | Vitest, Playwright, pgTAP | |

### 4.2 Diagram

```
  Browser (phone or laptop; installable as a home-screen app)
            |  HTTPS
            v
  +--------------------------------------------------+
  |  AWS Amplify Hosting: Next.js                    |
  |  - pages (server components read through RLS)    |
  |  - /api route handlers (all writes, Gemini call) |
  +-----------+---------------------------+----------+
              | user's session            | server only
              | (RLS applies)             |
              v                           v
  +---------------------------+   +------------------------+
  | Supabase (AWS region)     |   | Google Gemini API      |
  | Postgres + RLS + functions|   | (billing-enabled key)  |
  | Auth (password, link,     |   +------------------------+
  |   code)                   |
  | Storage (private bucket)  |
  | Realtime (reminders,      |
  |   notifications)          |
  | pg_cron (reminders,       |
  |   missed doses, checkups) |
  +---------------------------+
            ^
            | service role (scripts only)
  +---------------------------+
  | scripts/seed-demo.ts      |
  | scripts/purge-deleted.ts  |
  |   (scheduled GitHub       |
  |    Actions workflow)      |
  +---------------------------+
```

### 4.3 Rules

- The browser never holds the Gemini key or the Supabase service-role key.
- Every page and route uses the signed-in user's session, so row-level security applies.
- All writes go through `/api` route handlers, which call database functions or write through row-level security. The database is the real guard.
- The service-role key is used only by the two scripts in `scripts/` and by the browser-test helpers on the builder's machine. It is never used while serving a user request, and never appears in `src/`.
- Scheduled jobs run inside Postgres with `pg_cron`. They are not reachable over HTTP.

---

## 5. Data model

All tables live in the `public` schema. Phase plans hold the exact SQL.

### 5.1 Tables

| Table | Created in | Purpose |
|---|---|---|
| `profiles` | P1 | One row per auth user: full name, email (lowercase), phone. Created by a trigger on sign-up. |
| `patients` | P1 | The person cared for: name, date of birth, blood group, primary condition, notes, emergency contact name and phone, physician name and phone, timezone, missed-dose grace minutes, soft delete. |
| `patient_links` | P1 | The patient's own login. At most one per patient. |
| `caregiver_links` | P1 | OWNER, CAREGIVER, VIEWER links, status ACTIVE or REVOKED. |
| `invites` | P1 | Email-bound, hashed, expiring invite tokens. |
| `notifications` | P1 | Per-user notification rows: `kind`, `data` (JSON), `read_at`. Text is rendered by the app from `kind`. |
| `audit_logs` | P1 | Append-only change log: actor, patient, operation, table, row id, before, after, IP. |
| `consents` | P2 | Consent to store documents and process them with AI. At most one active per patient. |
| `medical_documents` | P2 | File metadata, extraction status (PENDING, PARSING, PARSED, FAILED, VERIFIED), raw AI output, soft delete. |
| `medications` | P3 | Approved or hand-entered medicines. Status ACTIVE or STOPPED. Link to the medicine it replaces. |
| `medication_schedules` | P3 | Slot, time, frequency (DAILY, SPECIFIC_DAYS, EVERY_N_DAYS), weekdays, interval, start and end date. |
| `medication_reminders` | P3 | One row per dose: time, status (PENDING, ACKNOWLEDGED, SKIPPED, MISSED), who acknowledged and when. |
| `checkup_schedules` | P5 | Type, doctor, location, time, reminder lead time, whether the reminder was sent. |
| `checkup_completions` | P5 | One completion per checkup with notes. |
| `rate_limits` | P6 | Counters for rate-limited actions. |

### 5.2 Integrity rules

- `medication_schedules` and `medication_reminders` carry `patient_id`. Composite foreign keys make it impossible for a schedule or reminder to point at another patient's medicine.
- A patient's `timezone` must be a valid IANA name (checked by trigger).
- `medical_documents.file_path` must equal `<patient_id>/<document_id>.<jpg|png|pdf>` (check constraint).
- Exactly one active OWNER per patient (partial unique index).
- A reminder is unique per schedule and time, so the generation job can run any number of times.
- Every `patient_id` foreign key cascades on hard delete, so the 30-day purge removes everything.

### 5.3 Access rules (row-level security)

Every table has row-level security on, and access is denied unless a policy allows it. Supabase gives `anon` and `authenticated` full table privileges by default. Every migration takes these away first, then grants only what is listed here.

Helper functions:

- `my_role(patient_id)` returns `OWNER`, `CAREGIVER`, `VIEWER`, `PATIENT`, or null. It returns null for soft-deleted patients, so a deleted patient disappears everywhere at once.
- `has_role(patient_id, roles[])` returns true if `my_role` is in the list.

| Table | Read | Write |
|---|---|---|
| `profiles` | own row, and people who share a patient with you | function `update_my_profile` |
| `patients` | any role | update of profile columns by OWNER or CAREGIVER; create, delete by function |
| `patient_links` | any role on that patient | functions only |
| `caregiver_links` | any role on that patient | functions only |
| `invites` | OWNER | functions only |
| `notifications` | own rows | update `read_at` on own rows |
| `audit_logs` | OWNER, CAREGIVER | triggers only |
| `consents` | any role on that patient | functions only |
| `medical_documents` | OWNER, CAREGIVER, VIEWER | update of metadata columns by OWNER or CAREGIVER; everything else by function |
| `medications`, `medication_schedules` | any role | functions only |
| `medication_reminders` | any role | patient acknowledgement by function; jobs |
| `checkup_schedules` | any role | insert, update, delete by OWNER or CAREGIVER |
| `checkup_completions` | any role | insert, update by OWNER or CAREGIVER |
| `rate_limits` | nobody | function only |
| Storage bucket `medical-documents` | OWNER, CAREGIVER, VIEWER of the patient in the first path segment | upload by OWNER or CAREGIVER with active consent; delete by purge script only |

Every database function that changes data:

- is `security definer` with `search_path` set to empty and fully qualified names;
- checks the caller's role itself, and raises `NOT_FOUND` when the caller has no role on the patient (so it does not reveal whether the patient exists) and `FORBIDDEN` when the role is too low;
- has `execute` revoked from `public` and `anon`, and granted to `authenticated` only if the app calls it.

---

## 6. AI prescription parser

### 6.1 Flow

1. The caregiver picks a JPEG, PNG, or PDF of up to 10 MB. The browser checks the size and the file's first bytes.
2. The browser uploads the file straight to the private bucket at `<patient_id>/<document_id>.<ext>`. Storage rules allow this only for OWNER or CAREGIVER with active consent. Large files never pass through the app server, which keeps requests within Amplify's limits.
3. The browser asks the server to register the document. The server downloads the stored file and checks the size and real type from its first bytes (the file name and the browser's reported type are ignored). For a PDF it checks there are at most 5 pages and no encryption.
4. The server computes SHA-256.
5. The server registers the document row. Status: PENDING. If any check fails, no row is created, and the stored file is removed by the daily purge.
6. The caregiver presses "Read with AI". The server claims the document by moving it to PARSING. A second press while it is PARSING is refused. A PARSING document older than 2 minutes can be claimed again, in case the server stopped mid-call.
7. The server sends the file and the fixed output schema to Gemini (model from `GEMINI_MODEL`). PDFs are sent as PDF; images as images.
8. The response is validated. Valid output: status PARSED, raw output saved. Invalid output or an error: status FAILED with a short error code. The caregiver can try again or enter medicines by hand.
9. Doctor name, clinic name, and issue date from the output fill the document's empty metadata fields.
10. The review screen shows the scan beside an editable table. Rows with LOW confidence, empty fields, or a slot count that does not match the frequency are highlighted.
11. The caregiver edits, deletes, or adds rows and sets times, then approves. Approval writes all medicines and schedules in one transaction and sets the document to VERIFIED. Today's doses are generated at once.

Nothing is written to `medications` before step 11.

### 6.2 Model

- `gemini-1.5-flash` must not be used. Google retired it in 2025.
- The builder picks a current stable Gemini Flash model from Google's official models page, sets `GEMINI_MODEL`, and records the ID in the Phase 2 exit log.

### 6.3 Output shape

Each extracted medicine has:

| Field | Type | Rule |
|---|---|---|
| `name` | string | required, may be empty if unreadable |
| `dosage` | string | required, may be empty if unreadable |
| `frequency_per_day` | integer | 1 to 6 |
| `slots` | array of MORNING, AFTERNOON, EVENING, BEDTIME | may be empty if not stated |
| `duration_days` | integer or null | 1 to 365 |
| `instructions` | string or null | for example "after food" |
| `confidence` | HIGH, MEDIUM, LOW | the model's own rating |

Top level: `doctor_name`, `clinic_name`, `issue_date` (YYYY-MM-DD), each nullable, and `medicines` (array). The server never guesses a missing slot or time.

### 6.4 Failure handling

| Case | Behaviour |
|---|---|
| Gemini error or no answer in 30 s | FAILED with code `AI_UNAVAILABLE`. Retry allowed. |
| Output does not match the shape | FAILED with code `AI_INVALID_OUTPUT`. Raw text kept for the reviewer. |
| Blocked by Gemini's safety filter | FAILED with code `AI_BLOCKED`. |
| Blurry or cropped scan | LOW confidence rows, highlighted, plus a "check the photo" notice. |
| Unsupported type, too large, PDF too long or encrypted | Refused before upload. |
| Too many parse calls | Refused with `RATE_LIMITED` (Phase 6: 20 per hour per user). |

### 6.5 Demo mode **[E]**

When `DEMO_MODE=true`, the Gemini call is replaced by a recorded response from `fixtures/gemini/`. The demo then works with no key, no quota, and no network. Demo mode shows a visible "Demo mode" badge on the review screen.

---

## 7. Functional requirements

Each requirement has an ID. Every ID has at least one test named after it.

### FR-1 Authentication (P1)

- FR-1.1 Caregiver sign-up with full name, email, password (at least 8 characters). The account works after email confirmation.
- FR-1.2 Sign-in by password.
- FR-1.3 Sign-in by magic link or 6-digit code from one email. Code and link expire after 1 hour (Supabase default) and work once.
- FR-1.4 Sign-out ends the session on that device.
- FR-1.5 After sign-in, people with caregiver links land on their patient list. People with only a PATIENT link land on their today view.

### FR-2 Patient profile (P1, P6)

- FR-2.1 Create a patient. The creator becomes OWNER in the same transaction.
- FR-2.2 OWNER and CAREGIVER edit profile fields. VIEWER and PATIENT cannot.
- FR-2.3 OWNER soft-deletes a patient. It disappears for everyone at once. Hard delete after 30 days (P6).
- FR-2.4 OWNER or CAREGIVER exports all of a patient's data as one JSON file. The export is audited (P6).

### FR-3 Invitations and access (P1)

- FR-3.1 OWNER creates an invite for an email and a role. Link shown once, with copy and share buttons.
- FR-3.2 Accepting while signed in with the invited email creates the link. Expired, used, revoked, or wrong-email invites are refused, and nothing changes.
- FR-3.3 OWNER revokes a CAREGIVER or VIEWER. Their next request shows nothing for that patient.
- FR-3.4 The OWNER cannot be revoked.
- FR-3.5 OWNER removes the patient's login (for example, a lost phone) and can invite a new one.
- FR-3.6 OWNER sees pending invites and revokes them.

### FR-4 Documents and consent (P2)

- FR-4.1 Upload with real-type check, size limit, PDF page and encryption check.
- FR-4.2 Upload and parsing are refused until the patient has active consent. This is enforced in the database and in storage.
- FR-4.3 Viewing a document uses a signed URL valid for 60 seconds.
- FR-4.4 OWNER soft-deletes a document. Its file is removed from storage after 30 days (P6).
- FR-4.5 OWNER withdraws consent. New uploads and parsing stop at once.
- FR-4.6 OWNER or CAREGIVER edits a document's type, doctor, clinic, and issue date.

### FR-5 Parser and review (P2, P3)

- FR-5.1 Parsing produces rows in the shape of section 6.3, or a FAILED status with a code.
- FR-5.2 Approval is all or nothing. Nothing is in `medications` before approval. A document can be approved once.
- FR-5.3 Approval is audited: one audit row per medicine and per schedule.

### FR-6 Medicines and schedules (P3)

- FR-6.1 Each schedule has a slot label and a time set by the caregiver. Defaults: morning 08:00, afternoon 13:00, evening 19:00, bedtime 22:00.
- FR-6.2 Stop a medicine. Future pending doses are removed. Past doses stay.
- FR-6.3 Change a medicine. The old one is stopped, a new one is created that points to it. History is kept.
- FR-6.4 Add a medicine by hand, without a document.
- FR-6.5 Frequencies: every day, chosen weekdays, or every N days (2 to 30) counted from the start date.
- FR-6.6 An end date can be set. If the parser gives a duration, the review screen pre-fills end date = start date + duration − 1.

### FR-7 Dose generation (P3)

- FR-7.1 A job every 15 minutes creates the doses for the next 24 hours, in the patient's timezone. Running it twice creates no duplicates. It never creates a dose more than 15 minutes in the past.
- FR-7.2 Approval and manual add generate doses at once.
- FR-7.3 A job every 5 minutes marks PENDING doses as MISSED once the grace period passes. Only this job sets MISSED.
- FR-7.4 Each MISSED dose notifies the OWNER and CAREGIVERs once.

### FR-8 Patient acknowledgement (P4)

- FR-8.1 Today's doses appear as large cards grouped by slot, with slot icons.
- FR-8.2 "I took it" records ACKNOWLEDGED. Repeating the same tap changes nothing.
- FR-8.3 "I did not take it" needs a second confirmation, then records SKIPPED.
- FR-8.4 A dose more than 2 hours in the future cannot be acknowledged yet. The card says "Later today" and shows no button.
- FR-8.5 A MISSED dose can still be marked "I took it" (taken late). It shows as "Not marked as taken" until then. The app gives no advice about it.
- FR-8.6 Only the PATIENT can acknowledge. Caregivers cannot.
- FR-8.7 If the connection drops while the page is open, the list stays visible and taps are queued and sent when the connection returns. Queued taps show "Waiting to send".

### FR-9 Checkups (P5)

- FR-9.1 OWNER and CAREGIVER create, edit, and delete checkups with type, doctor, location, time, notes, and reminder lead time (1 to 168 hours, default 24).
- FR-9.2 Log completion once, with notes.
- FR-9.3 A job sends one CHECKUP_SOON notification to every member and the patient when the lead time is reached. Changing the time re-arms the reminder.

### FR-10 Caregiver dashboard (P5)

- FR-10.1 Compliance for each of the last 7 days and in total. Compliance = ACKNOWLEDGED ÷ (ACKNOWLEDGED + SKIPPED + MISSED) for doses already due. Doses still PENDING are shown separately and not counted. When nothing is settled, show "No doses due yet" instead of a percentage.
- FR-10.2 The dashboard updates without reload within 5 seconds when a dose changes.
- FR-10.3 The activity timeline shows audit entries, newest first, 50 per page.
- FR-10.4 Documents waiting for review (PARSED) and failed ones (FAILED) are flagged.
- FR-10.5 Today's MISSED doses are listed.

### FR-11 Notifications (P1 to P5)

- FR-11.1 Notification centre with unread count in the header. Mark one or all as read.
- FR-11.2 Kinds: INVITE_ACCEPTED (to OWNER), DOCUMENT_PARSED and DOCUMENT_FAILED (to OWNER and CAREGIVERs except the person who ran it), DOSE_MISSED (to OWNER and CAREGIVERs), CHECKUP_SOON (to all members and the patient).
- FR-11.3 New notifications appear without reload while the app is open.

---

## 8. API surface

Pages read data through the signed-in Supabase client; row-level security decides what they see. Every write goes through a route handler below. Each handler validates input with `zod` and returns `{ "error": { "code", "message", "requestId" } }` on failure.

| Method | Route | Who | Requirement |
|---|---|---|---|
| POST | `/api/patients` | signed in | FR-2.1 |
| PATCH | `/api/patients/[patientId]` | OWNER, CAREGIVER | FR-2.2 |
| DELETE | `/api/patients/[patientId]` | OWNER | FR-2.3 |
| GET | `/api/patients/[patientId]/export` | OWNER, CAREGIVER | FR-2.4 |
| POST | `/api/patients/[patientId]/invites` | OWNER | FR-3.1 |
| DELETE | `/api/patients/[patientId]/invites/[inviteId]` | OWNER | FR-3.6 |
| POST | `/api/invites/accept` | signed in | FR-3.2 |
| DELETE | `/api/patients/[patientId]/caregivers/[userId]` | OWNER | FR-3.3 |
| DELETE | `/api/patients/[patientId]/patient-login` | OWNER | FR-3.5 |
| PATCH | `/api/account` | signed in | profile name and phone |
| POST | `/api/patients/[patientId]/consent` | OWNER, CAREGIVER | FR-4.2 |
| DELETE | `/api/patients/[patientId]/consent` | OWNER | FR-4.5 |
| POST | `/api/patients/[patientId]/documents` | OWNER, CAREGIVER | FR-4.1 |
| PATCH | `/api/documents/[documentId]` | OWNER, CAREGIVER | FR-4.6 |
| DELETE | `/api/documents/[documentId]` | OWNER | FR-4.4 |
| GET | `/api/documents/[documentId]/url` | OWNER, CAREGIVER, VIEWER | FR-4.3 |
| POST | `/api/documents/[documentId]/parse` | OWNER, CAREGIVER | FR-5.1 |
| POST | `/api/documents/[documentId]/approve` | OWNER, CAREGIVER | FR-5.2 |
| POST | `/api/patients/[patientId]/medications` | OWNER, CAREGIVER | FR-6.4 |
| POST | `/api/medications/[medicationId]/stop` | OWNER, CAREGIVER | FR-6.2 |
| POST | `/api/medications/[medicationId]/change` | OWNER, CAREGIVER | FR-6.3 |
| POST | `/api/reminders/[reminderId]/ack` | PATIENT | FR-8.2, FR-8.3 |
| POST | `/api/patients/[patientId]/checkups` | OWNER, CAREGIVER | FR-9.1 |
| PATCH | `/api/checkups/[checkupId]` | OWNER, CAREGIVER | FR-9.1 |
| DELETE | `/api/checkups/[checkupId]` | OWNER, CAREGIVER | FR-9.1 |
| POST | `/api/checkups/[checkupId]/complete` | OWNER, CAREGIVER | FR-9.2 |
| POST | `/api/notifications/read` | signed in | FR-11.1 |

---

## 9. Privacy, consent, and data handling

These rules follow the DPDP Act 2023 and DPDP Rules 2025 as summarised by secondary sources ([KPMG](https://kpmg.com/in/en/insights/2025/12/the-privacy-prescription-impact-of-dpdp-act-and-rules-in-healthcare-and-life-sciences-sector.html), [EY](https://www.ey.com/en_in/insights/cybersecurity/transforming-data-privacy-digital-personal-data-protection-rules-2025)). They must be checked against the official text before any real launch.

- **Consent before documents.** Before the first upload, the OWNER or a CAREGIVER reads a short notice: documents are stored privately, sent to Google's Gemini API to read the medicines, and can be deleted at any time. They confirm. The consent row stores who, when, and the notice version.
- **Withdrawal.** The OWNER withdraws consent at any time. New uploads and parsing stop at once. Existing documents stay until deleted.
- **Deletion.** Soft delete hides data at once. Hard delete of rows and files runs after 30 days.
- **Access and correction.** Export as JSON (FR-2.4). Corrections are edits, and every edit is audited.
- **Data location.** Supabase project in an AWS region near India.
- **Gemini terms.** Billing-enabled project only. The unpaid tier may use submitted content to improve Google's products ([Gemini API terms](https://ai.google.dev/terms)).
- **Demo data.** Only synthetic prescriptions and people.
- **Logs.** Server logs carry request IDs, routes, status codes, and durations. Never names, file contents, medicine names, or AI output.

---

## 10. Non-functional requirements

| Area | Requirement |
|---|---|
| Accessibility | WCAG 2.1 AA contrast. Touch targets at least 48 px. Base text 18 px; patient screens at least 20 px. Every control has a visible label. Focus is always visible. Main flows work with a screen reader. |
| Layout | Patient screens designed for 360 px wide phones first. Caregiver screens work from 360 px up. |
| Connection loss | Covered by FR-8.7. Full offline loading of a closed app (service worker) is a stretch goal. |
| Performance | Patient today view interactive in under 2 s on a mid-range Android phone with "Fast 4G" throttling (checked by hand in P6). |
| Security | Row-level security on every table. Default table privileges removed. No secrets in the client bundle. Real-type file check. 60 s signed URLs. Rate limits on invite acceptance, invite creation, and parsing. Security headers on every response. |
| Audit | Inserts, updates, and deletes on `patients`, `patient_links`, `caregiver_links`, `invites`, `consents`, `medical_documents`, `medications`, `medication_schedules`, `checkup_schedules`, `checkup_completions`, and updates on `medication_reminders`, record actor, time, best-effort IP, and before and after values. |
| Reliability | Approval, invite acceptance, stop, and change are single transactions. Jobs are idempotent. Acknowledgement is idempotent. |
| Language | English. All text in one strings file so Hindi can be added later. |

---

## 11. Operations

### 11.1 Environments

- `local`: Supabase CLI local stack. Demo mode on by default.
- `staging`: Supabase cloud project and Amplify branch `main`. Synthetic data only. Used for the hackathon demo.

### 11.2 Configuration (names only)

`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (scripts only), `GEMINI_API_KEY`, `GEMINI_MODEL`, `DEMO_MODE`, `APP_URL`.

Newer Supabase projects show a "publishable" key and a "secret" key instead of "anon" and "service_role". The publishable key goes in `NEXT_PUBLIC_SUPABASE_ANON_KEY`; the secret key goes in `SUPABASE_SERVICE_ROLE_KEY`.

### 11.3 Scheduled jobs

| Job | Runs | Where | Effect |
|---|---|---|---|
| `generate_reminders` | every 15 min | `pg_cron` | FR-7.1 |
| `mark_missed` | every 5 min | `pg_cron` | FR-7.3, FR-7.4 |
| `send_checkup_reminders` | every 15 min | `pg_cron` | FR-9.3 |
| purge | daily | GitHub Actions running `scripts/purge-deleted.ts` | FR-2.3, FR-4.4 (storage files can only be deleted through the storage API) |

### 11.4 Observability

- One structured JSON log line per API request: request ID, route, method, status, duration in ms.
- Error responses carry the request ID; the error page shows it so a user can quote it.

---

## 12. Stretch goals [S]

Only after every MVP exit check passes.

- Web Push dose reminders for the installed app.
- A service worker so the patient view opens with no connection.
- A printable weekly adherence page.
- Hindi strings.

---

## 13. Testing and acceptance

### 13.1 Layers

- **Database (pgTAP):** every row of section 5.3 has an allowed and a denied test. Every function has tests for success and each error code.
- **Unit (Vitest):** file-type detection, PDF checks, Gemini output validation, approval payload validation, slot defaults and end-date pre-fill, time-zone date helpers, offline queue, notification text rendering, compliance percentage.
- **End to end (Playwright):** the golden path on a phone-sized and a desktop-sized screen.
- **By hand:** magic link and code on a real Android phone; screen reader pass on the patient view; throttled load time.

### 13.2 Golden path (must pass before submission)

1. Rahul signs up, confirms his email, creates Ramesh, and gives consent.
2. Rahul uploads the synthetic prescription.
3. He presses "Read with AI". Three medicines appear with confidence flags (demo mode).
4. He sets times and approves. Today's doses appear on the dashboard.
5. Rahul invites Ramesh as PATIENT and Priya as CAREGIVER.
6. Ramesh opens the invite on a phone, signs in with the email code, and sees today's doses.
7. Ramesh taps "I took it" on a due dose. Rahul's dashboard changes within 5 seconds without reload.
8. A dose past its grace period shows as missed on the dashboard, and Rahul has a notification.
9. Rahul revokes Priya. Priya's next page load shows no access.
10. Rahul exports Ramesh's data, then deletes Ramesh. Ramesh disappears for everyone.

### 13.3 Edge cases that must have tests

- Upload: 0-byte file, exactly 10 MB, 10 MB + 1 byte, `.exe` renamed `.jpg`, PNG named `.pdf`, 6-page PDF, encrypted PDF, upload with no consent, upload after consent withdrawn.
- Parse: two parse calls at once, Gemini timeout, safety block, invalid JSON, empty medicine list, unknown slot name, slot count different from frequency.
- Approval: two approvals at once (one succeeds), approve a FAILED or VERIFIED document, one bad row in five (nothing saved), VIEWER approves.
- Invites: used twice by the same person (second is a no-op), used by another person, expired, revoked, wrong email, PATIENT invite when a patient login exists, caregiver accepting a PATIENT invite for the same patient, OWNER accepting an invite to their own patient.
- Doses: schedule ending today, starting tomorrow, weekdays only, every 3 days, patient in a time zone far from India, schedule created after its first time today, generation run twice, stop with future and past doses.
- Acknowledgement: second identical tap, skip after acknowledge, acknowledge after missed, too early, by a caregiver, on another patient's dose, from the offline queue after the dose became MISSED.
- Access: a user removed while signed in, a user who is OWNER of one patient and VIEWER of another, a soft-deleted patient, a PATIENT reading documents.

---

## 14. Phase plan

| Phase | Name | Ends with |
|---|---|---|
| P0 | Foundation | Running app, local database, CI, staging deploy |
| P1 | Accounts and access | Sign-up and sign-in, patients, invites, roles, audit, notifications table |
| P2 | Documents and AI | Consent, uploads, signed URLs, Gemini parsing, demo mode, review screen |
| P3 | Medicines and doses | Approval, manual add, stop, change, dose generation, missed-dose job |
| P4 | Patient experience | Today view, acknowledgement, connection-loss queue, installable app |
| P5 | Dashboard and notifications | Compliance, live updates, activity, checkups, notification centre |
| P6 | Hardening and submission | Rate limits, export, deletion and purge, security headers, demo data, final tests |

---

## 15. Out of scope

- SMS, WhatsApp, and voice reminders.
- SMS sign-in.
- Vernacular languages (strings are ready for them).
- ABHA and ABDM integration.
- Smart pillbox hardware.
- Sharing records with doctors by link.
- OWNER transfer.
- Medical advice of any kind, including what to do after a missed dose.
- Drug interaction or dose checks.

---

## 16. Risks

| Risk | Severity | Mitigation |
|---|---|---|
| Gemini misreads handwriting | High | Side-by-side review, highlighted rows, nothing saved before approval. |
| Model ID retired or renamed | High | Set by environment variable; checked on Google's page at build time; demo mode as fallback. |
| Health data sent to the unpaid Gemini tier | High | Billing-enabled project required (Phase 2 checklist). |
| Access rule gap | Critical | Default privileges removed; one pgTAP test per rule; functions check roles themselves. |
| Signed link leaked | High | 60 s expiry, private bucket, no public URLs. |
| Auth emails throttled | Medium | Amazon SES as custom SMTP on staging; 6-digit code for patients. |
| Amplify server cannot read environment variables at runtime | Medium | Build step writes server variables to `.env.production` (Phase 0). |
| Scope overrun in 2 days | High | Strict phase order; stretch goals excluded; demo mode keeps the demo reliable. |
| Consent wording not legally reviewed | Medium | Labelled draft; reviewed before real use. |

---

## 17. Open items to confirm during build

1. Current stable Gemini Flash model ID (Phase 2).
2. Exact Next.js 16.x version and whether its request-interception file is named `proxy.ts` or `middleware.ts` (Phase 0).
3. Whether Supabase offers a Mumbai region for new projects (Phase 0).
4. Amplify Hosting's current Next.js build settings (Phase 0).
5. Whether the Supabase CLI prints legacy or new key names (Phase 0).
6. Final consent and disclaimer wording, reviewed by someone qualified (before real use).

---

## 18. Glossary

- **RLS:** Row Level Security. Postgres filters rows per user.
- **Security definer function:** a database function that runs with its owner's rights, so it can do a checked change the caller could not do directly.
- **HITL:** Human in the loop. A person approves AI output before it is used.
- **MISSED:** a dose not acknowledged within the grace period. A record, not advice.
- **Magic link / email code:** one-time sign-in by email.
- **pg_cron:** a Postgres extension that runs SQL on a schedule.
- **pgTAP:** a Postgres testing framework used for database tests.
- **DPDP:** India's Digital Personal Data Protection Act 2023 and Rules 2025.
