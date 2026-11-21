# CareCircle

CareCircle turns handwritten paper prescriptions and medical documents into structured, verified schedules and accessible daily medication routines for families caring for aging relatives. Built with Next.js App Router, React 19, Supabase (Postgres, Row-Level Security, Auth, Storage, Realtime, pg_cron), and Google's Gemini Vision API with human-in-the-loop verification, CareCircle keeps family caregivers aligned in real time while offering patients a focused, high-contrast, offline-resilient mobile interface to track doses.

> **Medical Disclaimer**: CareCircle is not a medical device. It does not provide medical advice, diagnosis, or treatment recommendations. All AI-assisted document transcriptions require human review and confirmation by an authorized family caregiver or healthcare provider before activation. Never ignore or alter professional medical advice based on information in this application.

---

## Screenshots

- **Caregiver Dashboard**: Real-time adherence compliance breakdown, pending action cards, and scheduled dose timelines.
  `docs/screenshots/dashboard.png`
- **Side-by-Side Prescription Review**: Original scan side-by-side with Gemini AI extractions and uncertainty flags for caregiver verification.
  `docs/screenshots/review-screen.png`
- **Patient Today View**: Thumb-friendly, accessible interface with high contrast and one-tap dose logging.
  `docs/screenshots/patient-today.png`

---

## Technology Stack

| Item | Choice |
|---|---|
| Language | TypeScript, `strict: true`, `noUncheckedIndexedAccess: true` |
| Framework | Next.js App Router 16.4.6 with React 19 |
| Styling | Tailwind CSS v4, mobile-first responsive architecture |
| Backend & Database | Supabase (Postgres 17, Row-Level Security, GoTrue Auth, Private Storage, Realtime WebSocket, `pg_cron`) |
| Client Libraries | `@supabase/supabase-js`, `@supabase/ssr` |
| Validation | `zod` |
| PDF Verification | `pdf-lib` (page count, encryption, and structure validation) |
| Accessibility Testing | `@axe-core/playwright` (WCAG 2.1 AA certified) |
| Unit Testing | Vitest (Node runtime) |
| E2E Testing | Playwright (Chromium desktop and mobile viewports) |
| Database Testing | pgTAP via `supabase test db` |
| Task Runner | `tsx` |
| Hosting | AWS Amplify Hosting |
| AI Extraction | Google Gemini Vision REST API (`fetch`, structured JSON schema) |

---

## Run Locally

### Prerequisites
- Node.js 22 LTS or newer
- Docker Desktop or Docker Engine
- npm

### Steps

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start local Supabase stack**:
   ```bash
   npx supabase start
   ```

3. **Configure local environment**:
   Copy `.env.example` to `.env.local` and populate keys from `npx supabase status`:
   ```bash
   cp .env.example .env.local
   ```
   Add a demo password (at least 12 characters):
   ```bash
   DEMO_PASSWORD=DemoSecretPassword123!
   ```

4. **Initialize database schema and migrations**:
   ```bash
   npm run db:reset
   ```

5. **Load synthetic demo data**:
   ```bash
   npm run seed:demo
   ```

6. **Start local Next.js server**:
   ```bash
   npm run dev
   ```
   Open `http://localhost:3040` in your browser.

---

## Testing & Verification

Run the complete automated verification suite on a clean database:

```bash
npm run db:reset
npm run lint
npm run typecheck
npm test
npm run db:test
npm run build
npm run test:e2e
```

Run daily 30-day data purge simulation:
```bash
npm run purge
```

---

## Privacy, Consent, and Security

CareCircle implements strict data privacy principles in compliance with digital data protection standards:

- **Consent Before Processing**: Caregivers review a clear privacy notice prior to any document upload. Consents are versioned and audited in the database.
- **Immediate Withdrawal**: Owners can withdraw consent at any time, instantly halting new uploads and AI parsing across the entire care circle.
- **Row-Level Security (RLS)**: Public tables have RLS enabled with default table privileges explicitly revoked. All database writes enforce strict authorization via security-definer functions.
- **Role-Based Access Control**:
  - `OWNER`: Full administrative control, caregiver and patient invites, edits, and patient deletion.
  - `CAREGIVER`: Can upload documents, approve extracted medicines, schedule appointments, and log visits.
  - `VIEWER`: Read-only access to adherence logs and documents; all mutation endpoints blocked.
  - `PATIENT`: Streamlined mobile home `/me` displaying personal daily doses with one-tap logging.
- **Rate Limiting**: Rate limits enforced at the database level for document parsing, invite creation, and invite acceptance.
- **Comprehensive Audit Trail**: All mutations on medical documents, prescriptions, consents, and dose acknowledgements trigger immutable audit log entries.
- **Soft Deletion & 30-Day Purge**: Deletion immediately revokes access for all circle members, with automated scripts permanently purging expired files and database records after 30 days.
- **Security Headers**: Production responses enforce strict Content Security Policy (CSP), HTTP Strict Transport Security (HSTS), X-Frame-Options (DENY), nosniff, and strict referrer policy.
