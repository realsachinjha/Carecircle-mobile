import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { setupPatientScenario } from "./helpers/scenario";
import { signInViaUi, userClient } from "./helpers/users";
import { CONSENT_NOTICE_VERSION } from "../src/lib/documents/constants";

test.describe("accessibility checks", () => {
  test("public landing page", async ({ page }) => {
    await page.goto("/");
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
    const severe = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
    expect(severe).toEqual([]);
  });

  test("sign-in page", async ({ page }) => {
    await page.goto("/sign-in");
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
    const severe = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
    expect(severe).toEqual([]);
  });

  test("sign-up page", async ({ page }) => {
    await page.goto("/sign-up");
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
    const severe = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
    expect(severe).toEqual([]);
  });

  test("authenticated dashboard and medicines pages", async ({ page }) => {
    const scenario = await setupPatientScenario("a11y-dash");
    await signInViaUi(page, scenario.owner, `/patients/${scenario.patientId}`);
    await expect(page.getByRole("heading", { name: "a11y-dash Patient" })).toBeVisible();

    const dashResults = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
    const dashSevere = dashResults.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
    expect(dashSevere).toEqual([]);

    await page.goto(`/patients/${scenario.patientId}/medicines`);
    await expect(page.getByRole("heading", { name: "Medicines" })).toBeVisible();

    const medResults = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
    const medSevere = medResults.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
    expect(medSevere).toEqual([]);
  });

  test("document review page", async ({ page }) => {
    const scenario = await setupPatientScenario("a11y-doc");
    const ownerClient = await userClient(scenario.owner);
    await ownerClient.rpc("give_consent", {
      p_patient: scenario.patientId,
      p_notice_version: CONSENT_NOTICE_VERSION,
    });

    const docId = crypto.randomUUID();
    const { error: upErr } = await ownerClient.storage
      .from("medical-documents")
      .upload(`${scenario.patientId}/${docId}.jpg`, new Uint8Array([0xff, 0xd8, 0xff, 0xe0]), {
        contentType: "image/jpeg",
      });
    expect(upErr).toBeNull();

    const { error: regErr } = await ownerClient.rpc("register_document", {
      p_document: docId,
      p_patient: scenario.patientId,
      p_mime_type: "image/jpeg",
      p_size_bytes: 4,
      p_sha256: "0".repeat(64),
      p_document_type: "PRESCRIPTION",
    });
    expect(regErr).toBeNull();

    await signInViaUi(page, scenario.owner, `/patients/${scenario.patientId}/documents/${docId}`);
    await expect(page.getByRole("heading", { name: "Not read yet", exact: true })).toBeVisible();

    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
    const severe = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
    expect(severe).toEqual([]);
  });

  test("patient today view /me", async ({ page }) => {
    const scenario = await setupPatientScenario("a11y-me");
    await signInViaUi(page, scenario.patientUser, "/me");
    await expect(page.getByRole("heading", { name: "Today's medicines" })).toBeVisible();

    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
    const severe = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
    expect(severe).toEqual([]);
  });
});
