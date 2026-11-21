import { describe, expect, it } from "vitest";
import { notificationLink, renderNotification } from "@/lib/notifications/render";
import { strings } from "@/strings/en";

describe("renderNotification", () => {
  it("renders non-empty title and correct content for all known kinds", () => {
    const invite = renderNotification(
      "INVITE_ACCEPTED",
      { name: "Priya", role: "CAREGIVER" },
      "Asia/Kolkata",
    );
    expect(invite.title).toBeTruthy();
    expect(invite.body).toContain("Priya");

    const parsed = renderNotification("DOCUMENT_PARSED", {}, "Asia/Kolkata");
    expect(parsed.title).toBeTruthy();
    expect(parsed.body).toBe(strings.notifications.documentParsedBody);

    const failed = renderNotification("DOCUMENT_FAILED", { code: "FILE_TOO_LARGE" }, "Asia/Kolkata");
    expect(failed.title).toBeTruthy();
    expect(failed.body).toBe(strings.errors.FILE_TOO_LARGE);

    const dose = renderNotification(
      "DOSE_MISSED",
      { medicationName: "Metformin", dosage: "500 mg", scheduledFor: "2026-03-10T02:30:00Z" },
      "Asia/Kolkata",
    );
    expect(dose.title).toBeTruthy();
    expect(dose.body).toContain("Metformin");
    expect(dose.body).toContain("08:00");

    const checkup = renderNotification(
      "CHECKUP_SOON",
      { doctorName: "Dr. Sharma", appointmentTime: "2026-03-12T05:00:00Z" },
      "Asia/Kolkata",
    );
    expect(checkup.title).toBeTruthy();
    expect(checkup.body).toContain("Dr. Sharma");
  });

  it("formats DOSE_MISSED scheduledFor correctly in timezone", () => {
    const res = renderNotification(
      "DOSE_MISSED",
      { scheduledFor: "2026-03-10T02:30:00Z" },
      "Asia/Kolkata",
    );
    expect(res.body).toContain("08:00");
  });

  it("handles missing or non-string fields gracefully", () => {
    const invite = renderNotification("INVITE_ACCEPTED", { name: 123 }, "Asia/Kolkata");
    expect(invite.body).toContain(strings.notifications.someone);

    const failed = renderNotification("DOCUMENT_FAILED", { code: 999 }, "Asia/Kolkata");
    expect(failed.body).toBe(strings.errors.AI_UNAVAILABLE);

    const dose = renderNotification("DOSE_MISSED", {}, "Asia/Kolkata");
    expect(dose.title).toBe(strings.notifications.doseMissed);
  });

  it("returns generic title for unknown kinds", () => {
    const res = renderNotification("UNKNOWN_KIND", {}, "Asia/Kolkata");
    expect(res.title).toBe(strings.notifications.generic);
    expect(res.body).toBe("");
  });
});

describe("notificationLink", () => {
  it("returns correct links when IDs are present", () => {
    expect(
      notificationLink("DOCUMENT_PARSED", { documentId: "doc-123" }, "pat-123"),
    ).toBe("/patients/pat-123/documents/doc-123");
    expect(notificationLink("DOSE_MISSED", {}, "pat-123")).toBe("/patients/pat-123");
    expect(notificationLink("CHECKUP_SOON", {}, "pat-123")).toBe("/patients/pat-123/checkups");
    expect(notificationLink("INVITE_ACCEPTED", {}, "pat-123")).toBe("/patients/pat-123/people");
  });

  it("returns null when IDs are missing", () => {
    expect(notificationLink("DOCUMENT_PARSED", {}, "pat-123")).toBeNull();
    expect(notificationLink("DOSE_MISSED", {}, null)).toBeNull();
    expect(notificationLink("UNKNOWN", {}, "pat-123")).toBeNull();
  });
});
