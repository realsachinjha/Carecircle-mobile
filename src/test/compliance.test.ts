import { describe, expect, it } from "vitest";
import { compliancePercent } from "@/lib/dashboard/compliance";

describe("compliancePercent", () => {
  it("computes 33% for 1 taken, 1 skipped, 1 missed", () => {
    expect(compliancePercent({ taken: 1, skipped: 1, missed: 1, pending: 5 })).toBe(33);
  });

  it("returns null when no doses are settled", () => {
    expect(compliancePercent({ taken: 0, skipped: 0, missed: 0, pending: 3 })).toBeNull();
  });

  it("computes 100% when all settled doses are taken", () => {
    expect(compliancePercent({ taken: 2, skipped: 0, missed: 0, pending: 0 })).toBe(100);
  });

  it("rounds to nearest integer", () => {
    expect(compliancePercent({ taken: 2, skipped: 1, missed: 0, pending: 0 })).toBe(67);
  });
});
