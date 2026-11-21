import { expect, test } from "@playwright/test";
import {
  createPatientAs,
  createTestUser,
  signInViaUi,
  userClient,
} from "./helpers/users";
import { newInviteToken } from "../src/lib/auth/invite-token";
import { strings } from "../src/strings/en";

test.describe("accounts and access", () => {
  test("FR-1.1 sign-up shows the check-email message", async ({ page }) => {
    const email = `signup-${Date.now()}@example.test`;
    await page.goto("/sign-up");
    await page.getByLabel(strings.auth.fullName).fill("New Caregiver");
    await page.getByLabel(strings.auth.email).fill(email);
    await page.getByLabel(strings.auth.password).fill("Test-password-123");
    await page.getByRole("button", { name: strings.auth.createAccount }).click();
    await expect(page.getByText(strings.auth.checkEmail)).toBeVisible();
  });

  test("FR-1.2 password sign-in lands on the patient list", async ({ page }) => {
    const user = await createTestUser("owner");
    await signInViaUi(page, user);
    await expect(page).toHaveURL("/patients");
    await expect(page.getByRole("heading", { name: strings.patients.listTitle })).toBeVisible();
  });

  test("FR-2.1 owner creates a patient through the form", async ({ page }) => {
    const user = await createTestUser("owner-patient");
    await signInViaUi(page, user);
    await page.goto("/patients/new");
    await page.getByLabel(strings.patients.fields.fullName).fill("Ramesh Demo");
    await page.getByLabel(strings.patients.fields.dateOfBirth).fill("1957-03-04");
    await page.getByRole("button", { name: strings.patients.create }).click();
    await page.waitForURL(/\/patients\/[0-9a-f-]+$/);
    await expect(page.getByRole("heading", { name: "Ramesh Demo" })).toBeVisible();
    await expect(page.getByText(`${strings.patients.yourRole}: ${strings.roles.OWNER}`)).toBeVisible();
  });

  test("FR-3.1 FR-3.2 owner invites a caregiver who accepts", async ({ browser, page }) => {
    const owner = await createTestUser("inv-owner");
    const caregiver = await createTestUser("inv-caregiver");
    const patientId = await createPatientAs(owner, "Invited Care");

    await signInViaUi(page, owner, `/patients/${patientId}/people`);
    await page.getByLabel(strings.people.inviteEmail).fill(caregiver.email);
    await page.getByLabel(strings.people.inviteRole).selectOption("CAREGIVER");
    await page.getByRole("button", { name: strings.people.createInvite }).click();

    await expect(page.getByText(strings.people.inviteReady)).toBeVisible();
    const linkInput = page.getByLabel(strings.people.inviteTitle);
    const link = await linkInput.inputValue();

    const caregiverContext = await browser.newContext();
    const caregiverPage = await caregiverContext.newPage();
    await signInViaUi(caregiverPage, caregiver, link);
    await caregiverPage.goto(link);

    await caregiverPage.waitForURL(/\/patients\/[0-9a-f-]+$/);
    await expect(caregiverPage.getByRole("heading", { name: "Invited Care" })).toBeVisible();
    await expect(caregiverPage.getByText(`${strings.patients.yourRole}: ${strings.roles.CAREGIVER}`)).toBeVisible();
    await caregiverContext.close();
  });

  test("FR-3.2 a different signed-in user cannot accept", async ({ browser, page }) => {
    const owner = await createTestUser("diff-owner");
    const caregiver = await createTestUser("target-user");
    const outsider = await createTestUser("outsider-user");
    const patientId = await createPatientAs(owner, "Private Care");

    await signInViaUi(page, owner, `/patients/${patientId}/people`);
    await page.getByLabel(strings.people.inviteEmail).fill(caregiver.email);
    await page.getByLabel(strings.people.inviteRole).selectOption("CAREGIVER");
    await page.getByRole("button", { name: strings.people.createInvite }).click();

    const linkInput = page.getByLabel(strings.people.inviteTitle);
    const link = await linkInput.inputValue();

    const outsiderContext = await browser.newContext();
    const outsiderPage = await outsiderContext.newPage();
    await signInViaUi(outsiderPage, outsider);
    await outsiderPage.goto(link);

    await expect(outsiderPage.getByText(strings.invite.wrongEmail)).toBeVisible();
    await outsiderContext.close();
  });

  test("FR-2.2 viewer cannot edit", async ({ page }) => {
    const owner = await createTestUser("view-owner");
    const viewer = await createTestUser("view-viewer");
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

    await signInViaUi(page, viewer, `/patients/${patientId}`);
    await expect(page.getByRole("link", { name: strings.common.edit })).toHaveCount(0);

    const patchRes = await page.request.patch(`/api/patients/${patientId}`, {
      data: { notes: "x" },
    });
    expect(patchRes.status()).toBe(403);
  });

  test("FR-3.3 revoked caregiver loses access", async ({ browser, page }) => {
    const owner = await createTestUser("rev-owner");
    const caregiver = await createTestUser("rev-care");
    const patientId = await createPatientAs(owner, "Revoke Patient");

    const ownerClient = await userClient(owner);
    const { hash } = newInviteToken();
    await ownerClient.rpc("create_invite", {
      p_patient: patientId,
      p_email: caregiver.email,
      p_role: "CAREGIVER",
      p_token_hash: hash,
    });
    const caregiverClient = await userClient(caregiver);
    await caregiverClient.rpc("accept_invite", { p_token_hash: hash });

    const caregiverContext = await browser.newContext();
    const caregiverPage = await caregiverContext.newPage();
    await signInViaUi(caregiverPage, caregiver, `/patients/${patientId}`);
    await expect(caregiverPage.getByRole("heading", { name: "Revoke Patient" })).toBeVisible();

    await signInViaUi(page, owner, `/patients/${patientId}/people`);
    page.once("dialog", (d) => d.accept());
    await page.getByRole("button", { name: strings.people.revoke }).click();
    await expect(page.getByText(strings.people.revoked)).toBeVisible();

    await caregiverPage.reload();
    await expect(caregiverPage.getByText("404")).toBeVisible();
    await caregiverContext.close();
  });

  test("FR-1.4 sign-out ends the session", async ({ page }) => {
    const user = await createTestUser("signout-user");
    await signInViaUi(page, user);
    await expect(page).toHaveURL("/patients");
    await page.getByRole("button", { name: strings.nav.signOut }).click();
    await expect(page).toHaveURL("/");
    await page.goto("/patients");
    await page.waitForURL((url) => url.pathname.startsWith("/sign-in"));
  });
});
