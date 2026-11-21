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

test.describe("documents and consent", () => {
  test("FR-4.2 upload is not offered before consent", async ({ page }) => {
    const owner = await createTestUser("doc-owner-1");
    const patientId = await createPatientAs(owner, "No Consent Patient");

    await signInViaUi(page, owner, `/patients/${patientId}/documents`);
    await expect(page.getByText(strings.consent.title)).toBeVisible();
    await expect(
      page.getByRole("link", { name: strings.documents.upload })
    ).toHaveCount(0);
  });

  test("FR-4.2 FR-4.1 FR-5.1 owner consents, uploads, and reads with AI", async ({
    page,
  }) => {
    const owner = await createTestUser("doc-owner-2");
    const patientId = await createPatientAs(owner, "Consented Patient");

    await signInViaUi(page, owner, `/patients/${patientId}/documents`);
    await page.getByRole("button", { name: strings.consent.agree }).click();
    await expect(page.getByText(strings.consent.given)).toBeVisible();

    await page
      .getByRole("link", { name: strings.documents.upload })
      .click();
    await page.waitForURL(`/patients/${patientId}/documents/upload`);

    await page.setInputFiles("#file", {
      name: "prescription.png",
      mimeType: "image/png",
      buffer: PNG_BYTES,
    });
    await page
      .getByRole("button", { name: strings.documents.uploadButton })
      .click();

    await page.waitForURL(/\/patients\/[0-9a-f-]+\/documents\/[0-9a-f-]+$/);
    await expect(
      page.getByText(strings.documents.statuses.PENDING).first()
    ).toBeVisible();

    await page
      .getByRole("button", { name: strings.documents.readWithAi })
      .click();
    await expect(
      page.getByText(strings.documents.statuses.PARSED).first()
    ).toBeVisible({ timeout: 15_000 });

    await expect(page.getByText(strings.documents.demoBadge)).toBeVisible();
    await expect(
      page
        .getByRole("cell", { name: "Metformin" })
        .or(page.getByRole("heading", { name: "Metformin" }))
    ).toBeVisible();
    await expect(
      page
        .getByRole("cell", { name: "Amlodipine" })
        .or(page.getByRole("heading", { name: "Amlodipine" }))
    ).toBeVisible();
    await expect(
      page
        .getByRole("cell", { name: "Atorvastatin" })
        .or(page.getByRole("heading", { name: "Atorvastatin" }))
    ).toBeVisible();
    await expect(
      page.getByText(strings.documents.flags.lowConfidence).first()
    ).toBeVisible();
  });

  test("FR-4.1 a renamed text file is refused", async ({ page }) => {
    const owner = await createTestUser("doc-owner-3");
    const patientId = await createPatientAs(owner, "Bad File Patient");

    await signInViaUi(page, owner, `/patients/${patientId}/documents`);
    await page.getByRole("button", { name: strings.consent.agree }).click();

    await page
      .getByRole("link", { name: strings.documents.upload })
      .click();
    await page.waitForURL(`/patients/${patientId}/documents/upload`);

    await page.setInputFiles("#file", {
      name: "not-image.png",
      mimeType: "image/png",
      buffer: Buffer.from("hello world plain text"),
    });
    await page
      .getByRole("button", { name: strings.documents.uploadButton })
      .click();

    await expect(
      page.getByText(strings.errors.UNSUPPORTED_FILE_TYPE)
    ).toBeVisible();
    await page.goto(`/patients/${patientId}/documents`);
    await expect(page.getByText(strings.documents.empty)).toBeVisible();
  });

  test("FR-4.1 an oversize file is refused", async ({ page }) => {
    const owner = await createTestUser("doc-owner-4");
    const patientId = await createPatientAs(owner, "Oversize Patient");

    await signInViaUi(page, owner, `/patients/${patientId}/documents`);
    await page.getByRole("button", { name: strings.consent.agree }).click();

    await page
      .getByRole("link", { name: strings.documents.upload })
      .click();
    await page.waitForURL(`/patients/${patientId}/documents/upload`);

    const oversize = Buffer.alloc(10 * 1024 * 1024 + 1);
    oversize[0] = 0x89;
    oversize[1] = 0x50;
    oversize[2] = 0x4e;
    oversize[3] = 0x47;
    oversize[4] = 0x0d;
    oversize[5] = 0x0a;
    oversize[6] = 0x1a;
    oversize[7] = 0x0a;

    await page.setInputFiles("#file", {
      name: "big.png",
      mimeType: "image/png",
      buffer: oversize,
    });
    await page
      .getByRole("button", { name: strings.documents.uploadButton })
      .click();

    await expect(page.getByText(strings.errors.FILE_TOO_LARGE)).toBeVisible();
  });

  test("FR-4.3 a viewer can open the signed link and an outsider cannot", async ({
    browser,
    page,
  }) => {
    const owner = await createTestUser("doc-owner-5");
    const viewer = await createTestUser("doc-viewer-5");
    const outsider = await createTestUser("doc-outsider-5");
    const patientId = await createPatientAs(owner, "Doc Perms Patient");

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

    await signInViaUi(page, owner, `/patients/${patientId}/documents`);
    await page.getByRole("button", { name: strings.consent.agree }).click();
    await page.goto(`/patients/${patientId}/documents/upload`);

    await page.setInputFiles("#file", {
      name: "prescription.png",
      mimeType: "image/png",
      buffer: PNG_BYTES,
    });
    await page
      .getByRole("button", { name: strings.documents.uploadButton })
      .click();
    await page.waitForURL(/\/patients\/[0-9a-f-]+\/documents\/([0-9a-f-]+)$/);

    const match = page.url().match(/\/documents\/([0-9a-f-]+)$/);
    expect(match).toBeTruthy();
    const documentId = match![1];

    const viewerContext = await browser.newContext();
    const viewerPage = await viewerContext.newPage();
    await signInViaUi(viewerPage, viewer);
    const viewerRes = await viewerPage.request.get(
      `/api/documents/${documentId}/url`
    );
    expect(viewerRes.status()).toBe(200);
    const viewerJson = await viewerRes.json();
    expect(viewerJson.expiresInSeconds).toBe(60);
    await viewerContext.close();

    const outsiderContext = await browser.newContext();
    const outsiderPage = await outsiderContext.newPage();
    await signInViaUi(outsiderPage, outsider);
    const outsiderRes = await outsiderPage.request.get(
      `/api/documents/${documentId}/url`
    );
    expect(outsiderRes.status()).toBe(404);
    await outsiderContext.close();
  });

  test("FR-4.6 owner edits the document details", async ({ page }) => {
    const owner = await createTestUser("doc-owner-6");
    const patientId = await createPatientAs(owner, "Edit Doc Patient");

    await signInViaUi(page, owner, `/patients/${patientId}/documents`);
    await page.getByRole("button", { name: strings.consent.agree }).click();
    await page.goto(`/patients/${patientId}/documents/upload`);

    await page.setInputFiles("#file", {
      name: "prescription.png",
      mimeType: "image/png",
      buffer: PNG_BYTES,
    });
    await page
      .getByRole("button", { name: strings.documents.uploadButton })
      .click();
    await page.waitForURL(/\/patients\/[0-9a-f-]+\/documents\/[0-9a-f-]+$/);

    await page
      .getByLabel(strings.documents.doctorName)
      .fill("Dr. Updated Test");
    const patchPromise = page.waitForResponse(
      (res) =>
        res.url().includes("/api/documents/") &&
        res.request().method() === "PATCH" &&
        res.status() === 200
    );
    await page
      .getByRole("button", { name: strings.documents.saveDetails })
      .click();
    await patchPromise;

    await page.reload();
    await expect(page.getByLabel(strings.documents.doctorName)).toHaveValue(
      "Dr. Updated Test"
    );
  });

  test("FR-4.5 withdrawn consent hides upload", async ({ page }) => {
    const owner = await createTestUser("doc-owner-7");
    const patientId = await createPatientAs(owner, "Withdraw Patient");

    await signInViaUi(page, owner, `/patients/${patientId}/documents`);
    await page.getByRole("button", { name: strings.consent.agree }).click();
    await expect(
      page.getByRole("link", { name: strings.documents.upload })
    ).toBeVisible();

    page.once("dialog", (d) => d.accept());
    await page
      .getByRole("button", { name: strings.consent.withdraw })
      .click();

    await expect(
      page.getByRole("link", { name: strings.documents.upload })
    ).toHaveCount(0);
    await page.goto(`/patients/${patientId}/documents/upload`);
    await page.waitForURL(`/patients/${patientId}/documents`);
  });
});
