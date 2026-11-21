import fs from "node:fs";
import path from "node:path";
import { expect, test } from "@playwright/test";
import { adminClient, createTestUser, signInViaUi } from "./helpers/users";
import { strings } from "../src/strings/en";

test.describe("golden path", () => {
  test("PRD 13.2 steps 1-10 end-to-end golden path", async ({ browser }) => {
    test.setTimeout(90_000);
    const rahul = await createTestUser("golden-rahul");
    const ramesh = await createTestUser("golden-ramesh");
    const priya = await createTestUser("golden-priya");

    const rahulContext = await browser.newContext();
    const rameshContext = await browser.newContext({ viewport: { width: 393, height: 852 } });
    const priyaContext = await browser.newContext();

    const rahulPage = await rahulContext.newPage();
    const rameshPage = await rameshContext.newPage();
    const priyaPage = await priyaContext.newPage();

    await signInViaUi(rahulPage, rahul);
    await rahulPage.waitForURL(/\/patients\/new|\/start/);
    if (!rahulPage.url().includes("/patients/new")) {
      await rahulPage.goto("/patients/new");
    }

    await rahulPage.getByLabel(strings.patients.fields.fullName).fill("Ramesh Kumar");
    await rahulPage.getByLabel(strings.patients.fields.dateOfBirth).fill("1957-03-04");
    await rahulPage.getByRole("button", { name: strings.patients.create }).click();

    await rahulPage.waitForURL(/\/patients\/[0-9a-f-]+$/);
    const patientId = rahulPage.url().split("/patients/")[1]!.split("/")[0]!.split("?")[0]!;

    await rahulPage.goto(`/patients/${patientId}/documents`);
    await rahulPage.getByRole("button", { name: strings.consent.agree }).click();
    await expect(rahulPage.getByText(strings.consent.given)).toBeVisible();

    await rahulPage.getByRole("link", { name: strings.documents.upload }).click();
    await rahulPage.waitForURL(`/patients/${patientId}/documents/upload`);

    const fixturePath = path.resolve(process.cwd(), "fixtures/documents/synthetic-prescription-1.jpg");
    const photoBuffer = fs.readFileSync(fixturePath);

    await rahulPage.setInputFiles("#file", {
      name: "synthetic-prescription-1.jpg",
      mimeType: "image/jpeg",
      buffer: photoBuffer,
    });
    await rahulPage.getByRole("button", { name: strings.documents.uploadButton }).click();

    await rahulPage.waitForURL(/\/patients\/[0-9a-f-]+\/documents\/[0-9a-f-]+$/);
    await expect(rahulPage.getByText(strings.documents.statuses.PENDING).first()).toBeVisible();

    await rahulPage.getByRole("button", { name: strings.documents.readWithAi }).click();
    await expect(rahulPage.getByText(strings.documents.statuses.PARSED).first()).toBeVisible({ timeout: 15_000 });

    const addTimeButtons = rahulPage.getByRole("button", { name: strings.medicines.addSchedule });
    await addTimeButtons.nth(2).click();
    await rahulPage.selectOption("#slot-2-0", "BEDTIME");

    await rahulPage.getByRole("button", { name: strings.medicines.approve }).click();
    await rahulPage.waitForURL(`/patients/${patientId}/medicines`);

    await rahulPage.goto(`/patients/${patientId}`);
    await expect(rahulPage.getByRole("heading", { name: strings.dashboard.todayDosesTitle })).toBeVisible();

    await rahulPage.goto(`/patients/${patientId}/people`);
    await rahulPage.getByLabel(strings.people.inviteEmail).fill(ramesh.email);
    await rahulPage.getByLabel(strings.people.inviteRole).selectOption("PATIENT");
    await rahulPage.getByRole("button", { name: strings.people.createInvite }).click();
    await expect(rahulPage.getByText(strings.people.inviteReady)).toBeVisible();
    const rameshInviteLink = await rahulPage.getByLabel(strings.people.inviteTitle).inputValue();

    await rahulPage.goto(`/patients/${patientId}/people`);
    await rahulPage.getByLabel(strings.people.inviteEmail).fill(priya.email);
    await rahulPage.getByLabel(strings.people.inviteRole).selectOption("CAREGIVER");
    await rahulPage.getByRole("button", { name: strings.people.createInvite }).click();
    await expect(rahulPage.getByText(strings.people.inviteReady)).toBeVisible();
    const priyaInviteLink = await rahulPage.getByLabel(strings.people.inviteTitle).inputValue();

    await signInViaUi(rameshPage, ramesh, rameshInviteLink);
    await rameshPage.goto(rameshInviteLink);
    await rameshPage.waitForURL("/me");
    await expect(rameshPage.getByRole("heading", { name: strings.patient.todayTitle })).toBeVisible();

    await signInViaUi(priyaPage, priya, priyaInviteLink);
    await priyaPage.goto(priyaInviteLink);
    await priyaPage.waitForURL(new RegExp(`/patients/${patientId}$`));
    await expect(priyaPage.getByRole("heading", { name: "Ramesh Kumar" })).toBeVisible();

    const tookItButton = rameshPage.getByRole("button", { name: strings.patient.tookIt }).first();
    if (await tookItButton.isVisible()) {
      await tookItButton.click();
    }

    const { data: reminderRow } = await adminClient()
      .from("medication_reminders")
      .select("id")
      .eq("patient_id", patientId)
      .limit(1)
      .single();

    if (reminderRow) {
      const { error: updErr } = await adminClient()
        .from("medication_reminders")
        .update({
          status: "MISSED",
          acknowledged_at: null,
          acknowledged_by: null,
        })
        .eq("id", reminderRow.id);
      expect(updErr).toBeNull();

      const { error: notifErr } = await adminClient().from("notifications").insert({
        user_id: rahul.id,
        patient_id: patientId,
        kind: "DOSE_MISSED",
        data: { reminderId: reminderRow.id, medicationName: "Metformin", dosage: "500 mg" },
      });
      expect(notifErr).toBeNull();
    }

    await rahulPage.goto(`/patients/${patientId}`);
    await expect(rahulPage.getByText(strings.dashboard.missedToday).first()).toBeVisible();
    await expect(rahulPage.locator('span[aria-label*="unread"]')).toBeVisible({ timeout: 10000 });

    await rahulPage.goto(`/patients/${patientId}/people`);
    rahulPage.once("dialog", (dialog) => dialog.accept());
    await rahulPage.getByRole("button", { name: strings.people.revoke }).click();
    await expect(rahulPage.getByText(strings.people.revoked)).toBeVisible();

    await priyaPage.goto(`/patients/${patientId}`);
    await expect(priyaPage.getByRole("heading", { name: strings.notFound.title })).toBeVisible();

    await rahulPage.goto(`/patients/${patientId}/edit`);
    const downloadPromise = rahulPage.waitForEvent("download");
    await rahulPage.getByRole("link", { name: strings.privacy.export }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/^carecircle-export-\d{4}-\d{2}-\d{2}\.json$/);

    await rahulPage.getByLabel(strings.privacy.typeNameToConfirm).fill("Ramesh Kumar");
    await rahulPage.getByRole("button", { name: strings.privacy.deletePatient }).click();
    await rahulPage.waitForURL("/patients");
    await expect(rahulPage.getByText("Ramesh Kumar")).not.toBeVisible();

    await rameshPage.goto("/me");
    await rameshPage.waitForURL(/\/patients$/);
    await expect(rameshPage.getByText("Ramesh Kumar")).not.toBeVisible();
    await expect(rameshPage.getByText(strings.patients.empty)).toBeVisible();

    await rahulContext.close();
    await rameshContext.close();
    await priyaContext.close();
  });
});
