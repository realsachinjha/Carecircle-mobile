# CareCircle — Build Plan (index)

This folder is the complete build plan for CareCircle v1.2.0-MVP.

- [PRD-ENHANCED.md](PRD-ENHANCED.md) is the requirements document and the single source of truth.
- `phases/P0` to `phases/P6` are step-by-step build instructions. Following them in order turns an empty folder into the finished, deployed app.

**Verification status.** The SQL and code in these plans were written carefully but have not been run. The exit checks in each phase are the first real run. If a statement fails, follow the "Blocked" rule in section 7. Do not change the plan's behaviour to make a check pass.

---

## 1. How to set up the build folder

1. Create a new empty folder named `carecircle` anywhere on your machine. This folder becomes the app and its git repository. Call it the **app root**.
2. Keep this plan folder outside the app root until Phase 0, task 2 is done (`create-next-app` refuses to run in a folder that already has files).
3. After Phase 0, task 2, copy this whole plan folder into the app root as `plan/`.

From then on, every path in the plans is relative to the app root. `src/lib/env.ts` means `carecircle/src/lib/env.ts`.

Commands are written for macOS, Linux, or Windows with Git Bash or WSL. On Windows, use Git Bash or WSL for every command.

## 2. Phase map

| Phase | File | Builds | Requirements |
|---|---|---|---|
| P0 | [phases/P0-foundation.md](phases/P0-foundation.md) | Next.js app, shared helpers, local Supabase, tests, CI, Amplify staging | foundation |
| P1 | [phases/P1-accounts-access.md](phases/P1-accounts-access.md) | Sign-up and sign-in, patients, invites, roles, audit log, notifications table | FR-1, FR-2.1, FR-2.2, FR-3 |
| P2 | [phases/P2-documents-ai.md](phases/P2-documents-ai.md) | Consent, uploads, signed URLs, Gemini parsing, demo mode, review screen | FR-4, FR-5.1, FR-11.2 (documents) |
| P3 | [phases/P3-medicines-doses.md](phases/P3-medicines-doses.md) | Approval, manual add, stop, change, dose generation, missed-dose job | FR-5.2, FR-5.3, FR-6, FR-7 |
| P4 | [phases/P4-patient-experience.md](phases/P4-patient-experience.md) | Patient today view, acknowledgement, connection-loss queue, installable app | FR-8 |
| P5 | [phases/P5-dashboard-notifications.md](phases/P5-dashboard-notifications.md) | Compliance, live updates, activity, checkups, notification centre | FR-9, FR-10, FR-11 |
| P6 | [phases/P6-hardening-submission.md](phases/P6-hardening-submission.md) | Rate limits, export, deletion and purge, security headers, demo data, final tests | FR-2.3, FR-2.4, FR-4.4, PRD sections 9 to 11 |

Never start a phase before every exit check of the previous phase passes.

## 3. Fixed technology choices

| Item | Choice |
|---|---|
| Language | TypeScript, `strict: true`, `noUncheckedIndexedAccess: true` |
| Framework | Next.js App Router, latest stable 16.x (pinned in P0) |
| Package manager | npm only |
| Node.js | 22 LTS or newer |
| Styling | Tailwind CSS (the version `create-next-app` installs), no component library |
| Backend | Supabase: Postgres, Auth, Storage, Realtime, `pg_cron` |
| Supabase libraries | `@supabase/supabase-js`, `@supabase/ssr`, and the `supabase` CLI as a dev dependency |
| Validation | `zod` |
| PDF checks | `pdf-lib` |
| Unit tests | Vitest (Node environment) |
| End-to-end tests | Playwright (Chromium) |
| Database tests | pgTAP through `npx supabase test db` |
| Scripts | `tsx` (added in P6) |
| Hosting | AWS Amplify Hosting |
| AI | Gemini REST API through `fetch`, no SDK |

Do not add any other dependency unless a phase says so.

## 4. Final layout of the app root

```
carecircle/
  plan/                              this plan (copied in after P0 task 2)
  package.json
  package-lock.json
  next.config.ts
  tsconfig.json
  eslint.config.mjs
  postcss.config.mjs
  vitest.config.ts
  playwright.config.ts
  amplify.yml
  .env.example
  .env.local                         never committed
  .gitignore
  .nvmrc
  .github/workflows/ci.yml           P0
  .github/workflows/purge.yml        P6
  public/
    icon.svg, icon-192.png, icon-512.png   P4
  fixtures/
    documents/                       synthetic prescriptions (P2)
    gemini/                          recorded Gemini answers (P2)
  scripts/
    seed-demo.ts                     P6
    purge-deleted.ts                 P6
  docs/
    demo-script.md                   P6
  supabase/
    config.toml                      from `supabase init` (P0)
    seed.sql                         empty (P0)
    migrations/
      20250101000100_accounts_access.sql      P1
      20250101000200_documents_consent.sql    P2
      20250101000300_medicines_doses.sql      P3
      20250101000400_patient_ack.sql          P4
      20250101000500_checkups_dashboard.sql   P5
      20250101000600_hardening.sql            P6
    tests/
      01_access.test.sql             P1
      02_documents.test.sql          P2
      03_medicines.test.sql          P3
      04_acknowledgement.test.sql    P4
      05_dashboard.test.sql          P5
      06_hardening.test.sql          P6
  e2e/
    helpers/                         P1
    *.spec.ts                        per phase
  src/
    proxy.ts or middleware.ts        P0
    app/                             pages and route handlers, per phase
    components/                      per phase
    lib/                             helpers, per phase
    strings/en.ts                    all user-visible text
    test/                            Vitest unit tests, per phase
```

Migration file names start with a timestamp because the Supabase CLI applies them in name order. Use the exact names above.

## 5. Rules every builder follows

### 5.1 Code rules

1. **No code comments.** Not in TypeScript, SQL, CSS, YAML, or config. Names, types, and tests explain the code.
2. **All user-visible text lives in `src/strings/en.ts`.** Components and routes import it. The only exceptions are the `strings` file itself and test assertions.
3. **Every route handler** is wrapped with `handleRoute` from `src/lib/api.ts` (P0), validates input with `zod` through `parseInput` (P1), and returns errors in the shape `{ "error": { "code", "message", "requestId" } }`.
4. **The database is the guard.** Pages and routes may check roles to show a clear message, but access is decided by row-level security and database functions.
5. **Secrets stay on the server.** Client components may read only `NEXT_PUBLIC_*` variables. Files that read `GEMINI_API_KEY` start with `import "server-only";`.
6. **The service-role key** is read only in `scripts/` and in `e2e/helpers/`. Never in `src/`.
7. **Dates.** Store `timestamptz`. Convert to the patient's timezone only to display or to work out "today".
8. **Route parameters are Promises.** In Next.js 16, `params` and `searchParams` passed to pages, layouts, and route handlers are Promises. Always write `const { patientId } = await params;`.
9. **Server components only read cookies.** Only route handlers and the proxy file change cookies.
10. **Check the official docs** for any library call you are not sure about, for the version in `package.json`. Do not invent method names or options. If the docs differ from the plan, follow the docs and write the difference in the phase's "Notes" section.

### 5.2 Database rules

1. **Migrations are append-only.** Never edit a migration after it has been applied. Add a new one.
2. Every new table: `alter table ... enable row level security;`, then `revoke all on table ... from anon, authenticated;`, then grant only what the phase says.
3. Every new function: `set search_path = ''`, fully qualified names (`public.patients`, `auth.uid()`), then `revoke all on function ... from public, anon;`. Functions the app calls get `grant execute ... to authenticated;`. Internal functions get `revoke all ... from authenticated;` too.
4. Functions report errors with `raise exception 'CODE';` where `CODE` is one of the codes in `src/lib/errors.ts`. The app maps that message back to an HTTP status.
5. Test-first for every bug: write a failing pgTAP or Vitest test, see it fail, fix, see it pass.

### 5.3 Git

- One commit per numbered task, one-line subject, for example `feat(p1): invite acceptance`.
- `.env.local` and `.env` are never committed. `.env.example` (names only) is.

## 6. Prompt for a coding assistant

Start a new chat for each phase. Paste this prompt, then attach or paste `plan/README.md`, `plan/PRD-ENHANCED.md`, and the phase file.

```
You are building the CareCircle app in this folder, one phase at a time.

Read these three files completely before doing anything:
1. plan/README.md (rules for every phase)
2. plan/PRD-ENHANCED.md (requirements; it wins any disagreement)
3. plan/phases/<PHASE FILE> (the phase to build now)

Then do the phase's tasks in order. For each task:
- Create or change exactly the files the task names, with the exact content given.
  Where the plan gives a specification instead of full code, write code that meets
  every bullet of the specification and nothing more.
- Run the task's check command and show me its real output.
- If the check fails, fix the cause and run it again. Do not change a test to make it pass.
  Do not skip a task.

Rules you must follow:
- No code comments anywhere.
- All user-visible text goes in src/strings/en.ts.
- Do not add dependencies the plan does not list.
- If a library call in the plan does not match the installed version's documentation,
  follow the documentation and note the change in the phase file's "Notes" section.
- If you cannot complete a task, stop and write the task number, the exact error,
  and what you tried into the phase file's "Blocked" section. Then tell me.

When all tasks are done, run every command in the phase's "Exit checks" table and show the output.
Fill the "Exit log" section of the phase file with the results.
```

## 7. Running a phase

1. Read the whole phase file first.
2. Do the numbered tasks in order. Each task names its files and ends with a check.
3. After all tasks, run every exit check. All must pass.
4. Write the results into the phase's "Exit log".
5. If a task cannot be done as written, stop. Write the task number, the exact error text, and what was tried into "Blocked". Do not work around it silently.

## 8. Definition of done (whole project)

- `npm run build`, `npm run lint`, `npm run typecheck`, `npm test`, `npm run db:test`, and `npm run test:e2e` all pass.
- The golden path in PRD section 13.2 passes in Playwright and by hand on the staging URL.
- Every requirement ID from FR-1.1 to FR-11.3 appears in at least one passing test name.
- `docs/demo-script.md` runs from start to finish on staging with synthetic data.

## 9. Error codes (shared by database and app)

`UNAUTHENTICATED`, `FORBIDDEN`, `NOT_FOUND`, `VALIDATION_FAILED`, `CONFLICT`, `EXPIRED`, `ALREADY_USED`, `CONSENT_REQUIRED`, `TOO_EARLY`, `FILE_TOO_LARGE`, `FILE_EMPTY`, `UNSUPPORTED_FILE_TYPE`, `PDF_TOO_LONG`, `PDF_ENCRYPTED`, `AI_UNAVAILABLE`, `AI_INVALID_OUTPUT`, `AI_BLOCKED`, `AI_NOT_CONFIGURED`, `RATE_LIMITED`, `INTERNAL`.

The list in `src/lib/errors.ts` (P0) must match this list exactly.
