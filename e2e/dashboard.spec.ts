import { expect, test } from "@playwright/test";
import { setupPatientScenario } from "./helpers/scenario";
import {
  adminClient,
  createPatientAs,
  createTestUser,
  signInViaUi,
  userClient,
} from "./helpers/users";
import { newInviteToken } from "../src/lib/auth/invite-token";
import { todayInZone } from "../src/lib/time/local-date";
import { strings } from "../src/strings/en";

const PNG_BYTES = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  "base64",
);

test("FR-10.2 the dashboard updates when the patient takes a dose", async ({ browser }) => {
  const { owner, patientUser, patientId } = await setupPatientScenario("p5-live");
  const ownerContext = await browser.newContext();
  const patientContext = await browser.newContext();

  const ownerPage = await ownerContext.newPage();
  const patientPage = await patientContext.newPage();

  await signInViaUi(ownerPage, owner);
  await ownerPage.goto(`/patients/${patientId}`);

  await signInViaUi(patientPage, patientUser);
  await patientPage.goto("/me");

  await expect(patientPage.getByRole("button", { name: strings.patient.tookIt })).toBeVisible();
  await patientPage.getByRole("button", { name: strings.patient.tookIt }).click();

  await expect(
    ownerPage.getByText(`1 ${strings.dashboard.takenOf} 1`).first(),
  ).toBeVisible({ timeout: 10000 });

  await ownerContext.close();
  await patientContext.close();
});

test("FR-10.1 no doses due shows the empty state", async ({ page }) => {
  const owner = await createTestUser("p5-empty-owner");
  const patientId = await createPatientAs(owner, "Empty Patient");
  await signInViaUi(page, owner);
  await page.goto(`/patients/${patientId}`);
  await expect(page.getByText(strings.dashboard.noDosesYet).first()).toBeVisible();
});

test("FR-10.5 a missed dose appears under Needs attention", async ({ page }) => {
  const { owner, patientId, dueReminderId } = await setupPatientScenario("p5-missed");
  await adminClient()
    .from("medication_reminders")
    .update({ status: "MISSED" })
    .eq("id", dueReminderId);

  await signInViaUi(page, owner);
  await page.goto(`/patients/${patientId}`);
  await expect(page.getByText(strings.dashboard.missedToday)).toBeVisible();
  await expect(page.locator("li", { hasText: "Due Pill" }).first()).toBeVisible();
});

test("FR-11.1 FR-11.3 the bell counts a new notification live", async ({ page }) => {
  const owner = await createTestUser("p5-bell-owner");
  const patientId = await createPatientAs(owner, "Bell Patient");

  await signInViaUi(page, owner);
  await page.goto(`/patients/${patientId}`);
  await page.waitForTimeout(500);

  await adminClient()
    .from("notifications")
    .insert({
      user_id: owner.id,
      patient_id: patientId,
      kind: "DOSE_MISSED",
      data: { medicationName: "Due Pill", dosage: "500 mg" },
    });

  const bellBadge = page.locator('span[aria-label="1 unread"]');
  await expect(bellBadge).toBeVisible({ timeout: 10000 });

  await page.getByRole("link", { name: strings.notifications.bellLabel }).click();
  await expect(page.getByRole("heading", { name: strings.notifications.title })).toBeVisible();

  await page.getByRole("button", { name: strings.notifications.markAllRead }).click();
  await expect(bellBadge).not.toBeVisible();
});

test("FR-9.1 FR-9.2 checkups", async ({ page }) => {
  const owner = await createTestUser("p5-checkup-owner");
  const patientId = await createPatientAs(owner, "Checkup Patient");

  await signInViaUi(page, owner);
  await page.goto(`/patients/${patientId}/checkups`);

  await page.getByRole("link", { name: strings.checkups.add }).click();
  await page.locator("#checkupType").selectOption("LAB_TEST");
  await page.locator("#doctorName").fill("Dr Lab");

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = todayInZone("Asia/Kolkata", tomorrow);
  await page.locator("#localTime").fill(`${tomorrowStr}T10:30`);
  await page.getByRole("button", { name: strings.checkups.save }).click();

  await expect(page.getByRole("heading", { name: "Dr Lab" })).toBeVisible();
  await expect(page.getByText("10:30")).toBeVisible();

  await page.getByRole("link", { name: strings.common.edit }).click();
  await page.locator("#localTime").fill(`${tomorrowStr}T11:00`);
  await page.getByRole("button", { name: strings.checkups.save }).click();

  await expect(page.getByText("11:00")).toBeVisible();

  await page.locator("summary", { hasText: strings.checkups.complete }).click();
  await page.locator('textarea[id^="clinicalNotes-"]').fill("All clear");
  await page.getByRole("button", { name: strings.checkups.complete }).click();

  await expect(page.getByText(strings.checkups.completedOn)).toBeVisible();
  await expect(page.getByText("All clear")).toBeVisible();
});

test("FR-9.1 viewer cannot add checkups", async ({ page }) => {
  const owner = await createTestUser("p5-viewer-owner");
  const viewer = await createTestUser("p5-viewer-user");
  const patientId = await createPatientAs(owner, "Viewer Patient");

  const ownerClient = await userClient(owner);
  const { hash } = newInviteToken();
  await ownerClient.rpc("create_invite", {
    p_patient: patientId,
    p_email: viewer.email,
    p_role: "VIEWER",
    p_token_hash: hash,
  });

  const viewerClient = await userClient(viewer);
  await viewerClient.rpc("accept_invite", { p_token_hash: hash });

  await signInViaUi(page, viewer);
  await page.goto(`/patients/${patientId}/checkups`);

  await expect(
    page.getByRole("heading", { name: strings.checkups.title, exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: strings.checkups.add })).not.toBeVisible();
  await expect(page.getByRole("link", { name: strings.common.edit })).not.toBeVisible();
  await expect(page.getByRole("button", { name: strings.checkups.delete })).not.toBeVisible();
});

test("FR-10.3 activity lists recent changes", async ({ page }) => {
  const owner = await createTestUser("p5-act-owner");
  const patientId = await createPatientAs(owner, "Activity Patient");

  const ownerClient = await userClient(owner);
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = todayInZone("Asia/Kolkata", tomorrow);

  await ownerClient.rpc("save_checkup", {
    p_checkup: null as unknown as string,
    p_patient: patientId,
    p_checkup_type: "CONSULTATION",
    p_doctor_name: "Dr Timeline",
    p_clinic_location: "",
    p_local_time: `${tomorrowStr} 10:00`,
    p_reminder_hours_before: 24,
    p_notes: "",
  });

  await signInViaUi(page, owner);
  await page.goto(`/patients/${patientId}/activity`);

  await expect(
    page.getByRole("heading", { name: strings.activity.title, exact: true }),
  ).toBeVisible();
  await expect(page.getByText("added checkup").first()).toBeVisible();
});

test("FR-10.4 a parsed document is flagged", async ({ page }) => {
  const owner = await createTestUser("p5-doc-owner");
  const patientId = await createPatientAs(owner, "Doc Patient");
  const ownerClient = await userClient(owner);

  await ownerClient.rpc("give_consent", {
    p_patient: patientId,
    p_notice_version: "2025-01-01",
  });

  await signInViaUi(page, owner);
  await page.goto(`/patients/${patientId}/documents/upload`);

  const fileInput = page.locator("#file");
  await fileInput.setInputFiles({
    name: "prescription.png",
    mimeType: "image/png",
    buffer: PNG_BYTES,
  });
  await page.getByRole("button", { name: strings.documents.uploadButton }).click();

  await page.waitForURL(new RegExp(`/patients/${patientId}/documents/[0-9a-f-]+$`));
  await page.getByRole("button", { name: strings.documents.readWithAi }).click();
  await expect(page.getByRole("button", { name: strings.medicines.approve })).toBeVisible();

  await page.goto(`/patients/${patientId}`);
  await expect(page.getByText(strings.dashboard.documentsToCheck)).toBeVisible();
});
