# CareCircle — 5-minute demo

## Before the demo (10 minutes earlier)
- Laptop: signed in as Rahul (demo) on the staging URL, dashboard of "Ramesh (demo)" open.
- Phone: signed in as Ramesh (demo), `/me` open, added to the home screen.
- The synthetic prescription photo is on the laptop.
- Check one dose for Ramesh is due now (seed data) or add a medicine 5 minutes in the past.
- Fallbacks ready: "Enter medicines by hand", and DEMO_MODE (redeploy time measured in P6 task 9).

## 1. The problem (40 s)
Rahul lives in Bangalore. His father Ramesh, 68, lives in Mysuru with diabetes and hypertension. Prescriptions are handwritten, medicines change, and Rahul has no way to know if doses are taken.

## 2. From paper to schedule (90 s)
- Documents → Add a document → upload the photo.
- Read with AI. Point at the side-by-side view: the scan on the left, the rows on the right, and the highlighted row the AI was unsure about.
- Fix the highlighted row, set times, Approve. "Nothing the AI reads is used until a person approves it."

## 3. Ramesh's phone (60 s)
- Show the phone: big cards, morning and evening, one button.
- Tap "I took it".
- Turn to the laptop: the dashboard updated without a reload.

## 4. Family coordination (40 s)
- People: Priya is a caregiver, Suresh can only view. Each person sees only what their role allows; the database enforces it.
- Notifications: a missed-dose alert and an upcoming lab test.

## 5. Safety and privacy (40 s)
- Not a medical device; no advice about missed doses.
- Consent before any document is sent to the AI; data in an Indian AWS region; export and delete in two clicks; everything audited.

## 6. Close (10 s)
"CareCircle turns a paper prescription into a routine the whole family can see, safely."
