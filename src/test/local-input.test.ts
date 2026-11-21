import { describe, expect, it } from "vitest";
import { toLocalInputValue } from "@/lib/time/local-input";

describe("toLocalInputValue", () => {
  it("converts UTC instant to local input format", () => {
    expect(toLocalInputValue("2026-03-12T05:00:00Z", "Asia/Kolkata")).toBe("2026-03-12T10:30");
  });
});
