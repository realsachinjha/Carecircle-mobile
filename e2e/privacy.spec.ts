import { test, expect } from "@playwright/test";
import { setupPatientScenario } from "./helpers/scenario";
import { createTestUser, signInViaUi, userClient } from "./helpers/users";
import { newInviteToken } from "../src/lib/auth/invite-token";
import { CONSENT_NOTICE_VERSION } from "../src/lib/documents/constants";

test.describe("privacy and hardening", () => {
  test("FR-2.4 export downloads a JSON file", async ({ page }) => {
    const scenario = await setupPatientScenario("priv-exp");
    await signInViaUi(page, scenario.owner, `/patients/${scenario.patientId}/edit`);

    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("link", { name: "Download all data (JSON)" }).click();
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toMatch(/^carecircle-export-\d{4}-\d{2}-\d{2}\.json$/);
    const stream = await download.createReadStream();
    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(Buffer.from(chunk));
    }
    const json = JSON.parse(Buffer.concat(chunks).toString("utf-8"));
    expect(json.patient.full_name).toBe("priv-exp Patient");
    expect(Array.isArray(json.medications)).toBe(true);
    expect(Array.isArray(json.schedules)).toBe(true);
  });

  test("FR-2.3 delete patient needs the exact name", async ({ page }) => {
    const scenario = await setupPatientScenario("priv-del");
    const ownerClient = await userClient(scenario.owner);

    const caregiver = await createTestUser("priv-del-cg");
    const { hash } = newInviteToken();
    await ownerClient.rpc("create_invite", {
      p_patient: scenario.patientId,
      p_email: caregiver.email,
      p_role: "CAREGIVER",
      p_token_hash: hash,
    });
    const cgClient = await userClient(caregiver);
    await cgClient.rpc("accept_invite", { p_token_hash: hash });

    await signInViaUi(page, scenario.owner, `/patients/${scenario.patientId}/edit`);

    const deleteBtn = page.getByRole("button", { name: "Delete this person" });
    await expect(deleteBtn).toBeDisabled();

    const confirmInput = page.getByLabel("Type the person's full name to confirm");
    await confirmInput.fill("Wrong Name");
    await expect(deleteBtn).toBeDisabled();

    await confirmInput.fill("priv-del Patient");
    await expect(deleteBtn).toBeEnabled();

    await deleteBtn.click();
    await page.waitForURL("/patients");
    await expect(page.getByText("priv-del Patient")).not.toBeVisible();

    await signInViaUi(page, caregiver, `/patients/${scenario.patientId}`);
    await expect(page.getByRole("heading", { name: "We could not find that page" })).toBeVisible();
  });

  test("FR-4.4 delete document", async ({ page }) => {
    const scenario = await setupPatientScenario("priv-doc");
    const ownerClient = await userClient(scenario.owner);
    await ownerClient.rpc("give_consent", {
      p_patient: scenario.patientId,
      p_notice_version: CONSENT_NOTICE_VERSION,
    });

    const viewer = await createTestUser("priv-doc-view");
    const { hash } = newInviteToken();
    await ownerClient.rpc("create_invite", {
      p_patient: scenario.patientId,
      p_email: viewer.email,
      p_role: "VIEWER",
      p_token_hash: hash,
    });
    const viewerClient = await userClient(viewer);
    await viewerClient.rpc("accept_invite", { p_token_hash: hash });

    const docId = crypto.randomUUID();
    await ownerClient.storage
      .from("medical-documents")
      .upload(`${scenario.patientId}/${docId}.jpg`, new Uint8Array([0xff, 0xd8, 0xff, 0xe0]), {
        contentType: "image/jpeg",
      });

    await ownerClient.rpc("register_document", {
      p_document: docId,
      p_patient: scenario.patientId,
      p_mime_type: "image/jpeg",
      p_size_bytes: 4,
      p_sha256: "1".repeat(64),
      p_document_type: "PRESCRIPTION",
    });

    await signInViaUi(page, viewer, `/patients/${scenario.patientId}/documents/${docId}`);
    await expect(page.getByRole("button", { name: "Delete document" })).not.toBeVisible();

    await signInViaUi(page, scenario.owner, `/patients/${scenario.patientId}/documents/${docId}`);
    page.once("dialog", (dialog) => dialog.accept());
    await page.getByRole("button", { name: "Delete document" }).click();

    await page.waitForURL(`/patients/${scenario.patientId}/documents`);

    await signInViaUi(page, viewer, `/patients/${scenario.patientId}/documents`);
    await expect(page.getByRole("cell", { name: "Prescription" })).not.toBeVisible();

    const urlRes = await page.request.get(`/api/documents/${docId}/url`);
    expect(urlRes.status()).toBe(404);
  });

  test("parse is rate-limited", async ({ page }) => {
    const scenario = await setupPatientScenario("priv-rate");
    const ownerClient = await userClient(scenario.owner);
    await ownerClient.rpc("give_consent", {
      p_patient: scenario.patientId,
      p_notice_version: CONSENT_NOTICE_VERSION,
    });

    const docId = crypto.randomUUID();
    await ownerClient.storage
      .from("medical-documents")
      .upload(`${scenario.patientId}/${docId}.jpg`, new Uint8Array([0xff, 0xd8, 0xff, 0xe0]), {
        contentType: "image/jpeg",
      });

    await ownerClient.rpc("register_document", {
      p_document: docId,
      p_patient: scenario.patientId,
      p_mime_type: "image/jpeg",
      p_size_bytes: 4,
      p_sha256: "2".repeat(64),
      p_document_type: "PRESCRIPTION",
    });

    await signInViaUi(page, scenario.owner, `/patients/${scenario.patientId}`);

    let lastStatus = 0;
    for (let i = 1; i <= 21; i++) {
      const res = await page.request.post(`/api/documents/${docId}/parse`);
      lastStatus = res.status();
      if (i === 1) {
        expect(res.status()).toBe(200);
      } else if (i < 21) {
        expect(res.status()).toBe(409);
      }
    }
    expect(lastStatus).toBe(429);
  });

  test("security headers are present", async ({ page }) => {
    const res = await page.request.get("/");
    expect(res.headers()["x-frame-options"]).toBe("DENY");
    expect(res.headers()["x-content-type-options"]).toBe("nosniff");
    expect(res.headers()["referrer-policy"]).toBe("strict-origin-when-cross-origin");
  });
});
