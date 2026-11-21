import { expect, test } from "@playwright/test";
import {
  createPatientAs,
  createTestUser,
  signInViaUi,
  userClient,
} from "./helpers/users";
import { newInviteToken } from "../src/lib/auth/invite-token";
import { strings } from "../src/strings/en";

const PNG_BYTES = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0,
]);

test.describe("medicines, schedules, and doses", () => {
  test("FR-5.2 FR-6.1 caregiver approves the demo prescription", async ({ page }) => {
    const owner = await createTestUser("med-owner-1");
    const patientId = await createPatientAs(owner, "Med Patient 1");

    await signInViaUi(page, owner, `/patients/${patientId}/documents`);
    await page.getByRole("button", { name: strings.consent.agree }).click();
    await page.getByRole("link", { name: strings.documents.upload }).click();
    await page.waitForURL(`/patients/${patientId}/documents/upload`);

    await page.setInputFiles("#file", {
      name: "prescription.png",
      mimeType: "image/png",
      buffer: PNG_BYTES,
    });
    await page.getByRole("button", { name: strings.documents.uploadButton }).click();
    await page.waitForURL(/\/patients\/[0-9a-f-]+\/documents\/[0-9a-f-]+$/);

    await page.getByRole("button", { name: strings.documents.readWithAi }).click();
    await expect(page.getByText(strings.documents.statuses.PARSED).first()).toBeVisible({ timeout: 15_000 });

    const addTimeButtons = page.getByRole("button", { name: strings.medicines.addSchedule });
    await addTimeButtons.nth(2).click();

    await page.selectOption("#slot-2-0", "BEDTIME");

    await page.getByRole("button", { name: strings.medicines.approve }).click();
    await page.waitForURL(`/patients/${patientId}/medicines`);

    await expect(page.getByRole("heading", { name: "Metformin" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Amlodipine" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Atorvastatin" })).toBeVisible();

    await expect(page.getByText(/Morning at 08:00/).first()).toBeVisible();
    await expect(page.getByText(/Evening at 19:00/).first()).toBeVisible();
  });

  test("FR-5.2 approval without a time for every medicine is blocked", async ({ page }) => {
    const owner = await createTestUser("med-owner-2");
    const patientId = await createPatientAs(owner, "Med Patient 2");

    await signInViaUi(page, owner, `/patients/${patientId}/documents`);
    await page.getByRole("button", { name: strings.consent.agree }).click();
    await page.getByRole("link", { name: strings.documents.upload }).click();
    await page.waitForURL(`/patients/${patientId}/documents/upload`);

    await page.setInputFiles("#file", {
      name: "prescription.png",
      mimeType: "image/png",
      buffer: PNG_BYTES,
    });
    await page.getByRole("button", { name: strings.documents.uploadButton }).click();
    await page.waitForURL(/\/patients\/[0-9a-f-]+\/documents\/[0-9a-f-]+$/);

    await page.getByRole("button", { name: strings.documents.readWithAi }).click();
    await expect(page.getByText(strings.documents.statuses.PARSED).first()).toBeVisible({ timeout: 15_000 });

    await page.getByRole("button", { name: strings.medicines.approve }).click();

    await expect(page.getByText(strings.errors.VALIDATION_FAILED)).toBeVisible();
    await expect(page.getByText(strings.medicines.noSchedules)).toBeVisible();

    await page.goto(`/patients/${patientId}/medicines`);
    await expect(page.getByText(strings.medicines.empty)).toBeVisible();
  });

  test("FR-5.2 a document cannot be approved twice", async ({ page }) => {
    const owner = await createTestUser("med-owner-3");
    const patientId = await createPatientAs(owner, "Med Patient 3");

    await signInViaUi(page, owner, `/patients/${patientId}/documents`);
    await page.getByRole("button", { name: strings.consent.agree }).click();
    await page.getByRole("link", { name: strings.documents.upload }).click();
    await page.waitForURL(`/patients/${patientId}/documents/upload`);

    await page.setInputFiles("#file", {
      name: "prescription.png",
      mimeType: "image/png",
      buffer: PNG_BYTES,
    });
    await page.getByRole("button", { name: strings.documents.uploadButton }).click();
    await page.waitForURL(/\/patients\/[0-9a-f-]+\/documents\/[0-9a-f-]+$/);

    const docUrl = page.url();
    const documentId = docUrl.split("/").pop()!;

    await page.getByRole("button", { name: strings.documents.readWithAi }).click();
    await expect(page.getByText(strings.documents.statuses.PARSED).first()).toBeVisible({ timeout: 15_000 });

    const addTimeButtons = page.getByRole("button", { name: strings.medicines.addSchedule });
    await addTimeButtons.nth(2).click();
    await page.selectOption("#slot-2-0", "BEDTIME");

    await page.getByRole("button", { name: strings.medicines.approve }).click();
    await page.waitForURL(`/patients/${patientId}/medicines`);

    const secondApprove = await page.request.post(`/api/documents/${documentId}/approve`, {
      data: {
        medicines: [
          {
            name: "Duplicate Test",
            dosage: "1",
            instructions: null,
            schedules: [
              {
                slot: "MORNING",
                target_time: "08:00",
                frequency_type: "DAILY",
                start_date: "2026-03-01",
                end_date: null,
              },
            ],
          },
        ],
      },
    });

    expect(secondApprove.status()).toBe(409);
  });

  test("FR-6.4 manual add", async ({ page }) => {
    const owner = await createTestUser("med-owner-4");
    const patientId = await createPatientAs(owner, "Med Patient 4");

    await signInViaUi(page, owner, `/patients/${patientId}/medicines`);
    await page.getByRole("link", { name: strings.medicines.add }).click();
    await page.waitForURL(`/patients/${patientId}/medicines/new`);

    await page.locator("#name-0").fill("Vitamin D 1000 IU");
    await page.locator("#dosage-0").fill("1 capsule");
    await page.selectOption("#frequency-0-0", "EVERY_N_DAYS");
    await page.locator("#interval-0-0").fill("3");

    await page.getByRole("button", { name: strings.medicines.save }).click();
    await page.waitForURL(`/patients/${patientId}/medicines`);

    await expect(page.getByRole("heading", { name: "Vitamin D 1000 IU" })).toBeVisible();
    await expect(page.getByText(/every 3 days/)).toBeVisible();
  });

  test("FR-6.2 stop", async ({ page }) => {
    const owner = await createTestUser("med-owner-5");
    const patientId = await createPatientAs(owner, "Med Patient 5");

    await signInViaUi(page, owner, `/patients/${patientId}/documents`);
    await page.getByRole("button", { name: strings.consent.agree }).click();
    await page.getByRole("link", { name: strings.documents.upload }).click();
    await page.waitForURL(`/patients/${patientId}/documents/upload`);

    await page.setInputFiles("#file", {
      name: "prescription.png",
      mimeType: "image/png",
      buffer: PNG_BYTES,
    });
    await page.getByRole("button", { name: strings.documents.uploadButton }).click();
    await page.waitForURL(/\/patients\/[0-9a-f-]+\/documents\/[0-9a-f-]+$/);

    await page.getByRole("button", { name: strings.documents.readWithAi }).click();
    await expect(page.getByText(strings.documents.statuses.PARSED).first()).toBeVisible({ timeout: 15_000 });

    const addTimeButtons = page.getByRole("button", { name: strings.medicines.addSchedule });
    await addTimeButtons.nth(2).click();
    await page.selectOption("#slot-2-0", "BEDTIME");

    await page.getByRole("button", { name: strings.medicines.approve }).click();
    await page.waitForURL(`/patients/${patientId}/medicines`);

    page.on("dialog", (dialog) => dialog.accept());

    const amlodipineCard = page.locator('[data-medicine="Amlodipine"]');
    await amlodipineCard
      .getByRole("button", { name: strings.medicines.stop })
      .click();

    await expect(page.locator('[data-medicine="Amlodipine"]')).toHaveCount(0);

    await page.locator("summary").click();
    await expect(
      page.locator('[data-medicine-stopped="Amlodipine"]')
    ).toBeVisible();
  });

  test("FR-6.3 change", async ({ page }) => {
    const owner = await createTestUser("med-owner-6");
    const patientId = await createPatientAs(owner, "Med Patient 6");

    await signInViaUi(page, owner, `/patients/${patientId}/documents`);
    await page.getByRole("button", { name: strings.consent.agree }).click();
    await page.getByRole("link", { name: strings.documents.upload }).click();
    await page.waitForURL(`/patients/${patientId}/documents/upload`);

    await page.setInputFiles("#file", {
      name: "prescription.png",
      mimeType: "image/png",
      buffer: PNG_BYTES,
    });
    await page.getByRole("button", { name: strings.documents.uploadButton }).click();
    await page.waitForURL(/\/patients\/[0-9a-f-]+\/documents\/[0-9a-f-]+$/);

    await page.getByRole("button", { name: strings.documents.readWithAi }).click();
    await expect(page.getByText(strings.documents.statuses.PARSED).first()).toBeVisible({ timeout: 15_000 });

    const addTimeButtons = page.getByRole("button", { name: strings.medicines.addSchedule });
    await addTimeButtons.nth(2).click();
    await page.selectOption("#slot-2-0", "BEDTIME");

    await page.getByRole("button", { name: strings.medicines.approve }).click();
    await page.waitForURL(`/patients/${patientId}/medicines`);

    const metforminCard = page.locator('[data-medicine="Metformin"]');
    await metforminCard
      .getByRole("link", { name: strings.medicines.change })
      .click();

    await page.waitForURL(/\/patients\/[0-9a-f-]+\/medicines\/[0-9a-f-]+\/change$/);

    await page.locator("#dosage-0").fill("1000 mg");
    await page.getByRole("button", { name: strings.medicines.save }).click();
    await page.waitForURL(`/patients/${patientId}/medicines`);

    const activeSection = page
      .locator("section")
      .filter({ has: page.getByRole("heading", { name: strings.medicines.active }) });

    await expect(activeSection.getByRole("heading", { name: "Metformin" })).toBeVisible();
    await expect(activeSection.getByText("1000 mg")).toBeVisible();
    await expect(activeSection.getByText(strings.medicines.replaces)).toBeVisible();

    await page.locator("summary").click();
    await expect(page.locator("details").getByText("500 mg")).toBeVisible();
  });

  test("FR-6.2 viewer has no action buttons", async ({ page }) => {
    const owner = await createTestUser("med-owner-7");
    const viewer = await createTestUser("med-viewer-7");
    const patientId = await createPatientAs(owner, "Med Patient 7");

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

    await ownerClient.rpc("add_medication", {
      p_patient: patientId,
      p_medicine: {
        name: "Metformin",
        dosage: "500 mg",
        instructions: null,
        schedules: [
          {
            slot: "MORNING",
            target_time: "08:00",
            frequency_type: "DAILY",
            start_date: "2026-03-01",
            end_date: null,
          },
        ],
      },
    });

    await signInViaUi(page, viewer, `/patients/${patientId}/medicines`);

    await expect(page.getByRole("heading", { name: strings.medicines.title, level: 1 })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Metformin" })).toBeVisible();
    await expect(
      page.getByRole("link", { name: strings.medicines.add })
    ).toHaveCount(0);
    await expect(
      page.getByRole("link", { name: strings.medicines.change })
    ).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: strings.medicines.stop })
    ).toHaveCount(0);
  });
});
