import { describe, expect, it } from "vitest";
import { safeNextPath } from "@/lib/auth/next-path";

describe("next-path", () => {
  it("FR-1.2 preserves valid relative paths", () => {
    expect(safeNextPath("/patients/abc")).toBe("/patients/abc");
    expect(safeNextPath("/account")).toBe("/account");
  });

  it("FR-1.2 falls back to /start for invalid, external, or malformed paths", () => {
    expect(safeNextPath(null)).toBe("/start");
    expect(safeNextPath("")).toBe("/start");
    expect(safeNextPath("patients")).toBe("/start");
    expect(safeNextPath("//evil.example")).toBe("/start");
    expect(safeNextPath("https://evil.example")).toBe("/start");
    expect(safeNextPath("/\\evil")).toBe("/start");
  });
});
