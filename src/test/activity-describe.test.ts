import { describe, expect, it } from "vitest";
import { describeActivity } from "@/lib/activity/describe";
import { strings } from "@/strings/en";

describe("describeActivity", () => {
  it("describes reminder update to ACKNOWLEDGED", () => {
    const text = describeActivity({
      action: "UPDATE",
      target_table: "medication_reminders",
      before: { status: "PENDING" },
      after: { status: "ACKNOWLEDGED" },
    });
    expect(text).toContain("taken");
  });

  it("describes medication insert", () => {
    const text = describeActivity({
      action: "INSERT",
      target_table: "medications",
      before: null,
      after: { name: "Metformin" },
    });
    expect(text).toContain("Metformin");
  });

  it("describes caregiver link revoked", () => {
    const text = describeActivity({
      action: "UPDATE",
      target_table: "caregiver_links",
      before: { status: "ACTIVE" },
      after: { status: "REVOKED" },
    });
    expect(text).toBe(strings.activity.removedAccess);
  });

  it("describes unknown table with generic words", () => {
    const text = describeActivity({
      action: "INSERT",
      target_table: "unknown_table",
      before: null,
      after: null,
    });
    expect(text).toBe("added unknown_table");
  });
});
