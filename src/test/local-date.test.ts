import { describe, expect, it } from "vitest";
import { addDays, timeInZone, todayInZone } from "@/lib/time/local-date";

describe("local-date helpers", () => {
  it("computes today in zone across UTC boundaries", () => {
    const instant = new Date("2026-03-09T20:00:00Z");
    expect(todayInZone("Asia/Kolkata", instant)).toBe("2026-03-10");
    expect(todayInZone("America/Los_Angeles", instant)).toBe("2026-03-09");
  });

  it("adds days handling leap years and month ends", () => {
    expect(addDays("2026-02-27", 2)).toBe("2026-03-01");
    expect(addDays("2028-02-28", 1)).toBe("2028-02-29");
    expect(addDays("2026-03-10", 29)).toBe("2026-04-08");
  });

  it("formats time in zone", () => {
    expect(timeInZone("2026-03-10T02:30:00Z", "Asia/Kolkata")).toBe("08:00");
  });
});
