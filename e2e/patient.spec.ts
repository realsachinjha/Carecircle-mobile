import { expect, test } from "@playwright/test";
import {
  adminClient,
  createPatientAs,
  createTestUser,
  signInViaUi,
  userClient,
  type TestUser,
} from "./helpers/users";
import { newInviteToken } from "../src/lib/auth/invite-token";
import { timeInZone, todayInZone } from "../src/lib/time/local-date";
import { strings } from "../src/strings/en";

type SetupResult = {
  owner: TestUser;
  patientUser: TestUser;
  patientId: string;
  dueReminderId: string;
  laterReminderId: string;
  laterFallsNextDay: boolean;
};

async function setupPatientScenario(label: string): Promise<SetupResult> {
  const owner = await createTestUser(`${label}-owner`);
  const patientUser = await createTestUser(`${label}-patient`);
  const patientId = await createPatientAs(owner, `${label} Patient`);

  const ownerClient = await userClient(owner);
  const { hash } = newInviteToken();
  await ownerClient.rpc("create_invite", {
    p_patient: patientId,
    p_email: patientUser.email,
    p_role: "PATIENT",
    p_token_hash: hash,
  });

  const patientClient = await userClient(patientUser);
  await patientClient.rpc("accept_invite", { p_token_hash: hash });

  const now = new Date();
  const today = todayInZone("Asia/Kolkata", now);
  const dueTime = timeInZone(new Date(now.getTime() - 10 * 60_000), "Asia/Kolkata");

  const laterDate = new Date(now.getTime() + 3 * 3600_000);
  const laterTime = timeInZone(laterDate, "Asia/Kolkata");
  const laterDay = todayInZone("Asia/Kolkata", laterDate);
  const laterFallsNextDay = laterDay !== today;

  await ownerClient.rpc("add_medication", {
    p_patient: patientId,
    p_medicine: {
      name: "Due Pill",
      dosage: "500 mg",
      instructions: null,
      schedules: [
        {
          slot: "MORNING",
          target_time: dueTime,
          frequency_type: "DAILY",
          start_date: today,
          end_date: null,
        },
      ],
    },
  });

  await ownerClient.rpc("add_medication", {
    p_patient: patientId,
    p_medicine: {
      name: "Later Pill",
      dosage: "10 mg",
      instructions: null,
      schedules: [
        {
          slot: "EVENING",
          target_time: laterTime,
          frequency_type: "DAILY",
          start_date: today,
          end_date: null,
        },
      ],
    },
  });

  const { data: doses } = await adminClient().rpc("doses_for_day", { p_patient: patientId });

  let dueReminderId = "";
  let laterReminderId = "";

  for (const d of (doses ?? []) as unknown as { reminder_id: string; medication_name: string }[]) {
    if (d.medication_name === "Due Pill") {
      dueReminderId = d.reminder_id;
    } else if (d.medication_name === "Later Pill") {
      laterReminderId = d.reminder_id;
    }
  }

  return {
    owner,
    patientUser,
    patientId,
    dueReminderId,
    laterReminderId,
    laterFallsNextDay,
  };
}

test.describe("patient experience", () => {
  test("FR-8.1 the patient lands on today's medicines", async ({ page }) => {
    const scenario = await setupPatientScenario("p-lands");
    await signInViaUi(page, scenario.patientUser);

    await page.waitForURL("/me");
    await expect(page.getByText(strings.patient.todayTitle)).toBeVisible();

    const dueCard = page.locator("article").filter({ hasText: "Due Pill" });
    await expect(dueCard).toBeVisible();
    await expect(
      dueCard.getByRole("button", { name: strings.patient.tookIt })
    ).toBeVisible();
  });

  test("FR-8.2 I took it records the dose", async ({ page }) => {
    const scenario = await setupPatientScenario("p-took");
    await signInViaUi(page, scenario.patientUser, "/me");

    const dueCard = page.locator("article").filter({ hasText: "Due Pill" });
    await dueCard.getByRole("button", { name: strings.patient.tookIt }).click();

    await expect(dueCard.getByText(new RegExp(strings.patient.takenAt))).toBeVisible();

    await page.reload();
    const reloadedCard = page.locator("article").filter({ hasText: "Due Pill" });
    await expect(
      reloadedCard.getByText(new RegExp(strings.patient.takenAt))
    ).toBeVisible();
  });

  test("FR-8.3 skipping needs a second tap", async ({ page }) => {
    const scenario = await setupPatientScenario("p-skip");
    await signInViaUi(page, scenario.patientUser, "/me");

    const dueCard = page.locator("article").filter({ hasText: "Due Pill" });
    await dueCard.getByRole("button", { name: strings.patient.didNotTake }).click();

    await expect(dueCard.getByText(strings.patient.confirmSkip)).toBeVisible();
    await dueCard.getByRole("button", { name: strings.patient.noGoBack }).click();

    await expect(
      dueCard.getByRole("button", { name: strings.patient.tookIt })
    ).toBeVisible();
    await expect(
      dueCard.getByRole("button", { name: strings.patient.didNotTake })
    ).toBeVisible();

    await dueCard.getByRole("button", { name: strings.patient.didNotTake }).click();
    await dueCard.getByRole("button", { name: strings.patient.yesSkip }).click();

    await expect(dueCard.getByText(strings.patient.skipped)).toBeVisible();
  });

  test("FR-8.4 a later dose has no buttons", async ({ page }) => {
    const scenario = await setupPatientScenario("p-later");
    test.skip(
      scenario.laterFallsNextDay,
      "Later pill falls on the next local day (late evening test run)"
    );

    await signInViaUi(page, scenario.patientUser, "/me");

    const laterCard = page.locator("article").filter({ hasText: "Later Pill" });
    await expect(laterCard).toBeVisible();
    await expect(laterCard.getByText(strings.patient.later)).toBeVisible();
    await expect(laterCard.getByRole("button")).toHaveCount(0);
  });

  test("FR-8.7 a tap while offline is sent when back online", async ({
    page,
    context,
  }) => {
    const scenario = await setupPatientScenario("p-offline");
    await signInViaUi(page, scenario.patientUser, "/me");

    await context.setOffline(true);
    await expect(page.getByText(strings.patient.offlineBanner)).toBeVisible();

    const dueCard = page.locator("article").filter({ hasText: "Due Pill" });
    await dueCard.getByRole("button", { name: strings.patient.tookIt }).click();

    await expect(dueCard.getByText(strings.patient.queued)).toBeVisible();

    await context.setOffline(false);
    await expect(
      dueCard.getByText(new RegExp(strings.patient.takenAt))
    ).toBeVisible({ timeout: 15_000 });
  });

  test("FR-8.5 a missed dose can be marked taken late", async ({ page }) => {
    const scenario = await setupPatientScenario("p-missed");

    await adminClient()
      .from("medication_reminders")
      .update({ status: "MISSED" })
      .eq("id", scenario.dueReminderId);

    await signInViaUi(page, scenario.patientUser, "/me");

    const dueCard = page.locator("article").filter({ hasText: "Due Pill" });
    await expect(dueCard.getByText(strings.patient.missed)).toBeVisible();
    await expect(dueCard.getByText(strings.patient.noAdvice)).toBeVisible();
    await expect(
      dueCard.getByRole("button", { name: strings.patient.didNotTake })
    ).toHaveCount(0);

    await dueCard.getByRole("button", { name: strings.patient.tookIt }).click();
    await expect(dueCard.getByText(new RegExp(strings.patient.takenAt))).toBeVisible();
  });

  test("FR-8.6 a caregiver cannot acknowledge", async ({ page }) => {
    const scenario = await setupPatientScenario("p-perms");
    await signInViaUi(page, scenario.owner, "/patients");

    const response = await page.request.post(
      `/api/reminders/${scenario.dueReminderId}/ack`,
      {
        data: { action: "ACKNOWLEDGED" },
      }
    );

    expect(response.status()).toBe(403);
  });

  test("the patient is sent to /me from caregiver pages", async ({ page }) => {
    const scenario = await setupPatientScenario("p-redirect");
    await signInViaUi(page, scenario.patientUser, `/patients/${scenario.patientId}`);

    await page.waitForURL("/me");
    await expect(page.getByText(strings.patient.todayTitle)).toBeVisible();
  });
});
