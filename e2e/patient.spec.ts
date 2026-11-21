import { expect, test } from "@playwright/test";
import { setupPatientScenario } from "./helpers/scenario";
import { adminClient, signInViaUi } from "./helpers/users";
import { strings } from "../src/strings/en";

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
