import { describe, expect, it } from "vitest";
import { describeSchedule } from "@/lib/medicines/describe";

describe("describeSchedule", () => {
  it("formats daily schedule with start and end dates", () => {
    const text = describeSchedule({
      slot: "MORNING",
      target_time: "08:00",
      frequency_type: "DAILY",
      start_date: "2026-03-01",
      end_date: "2026-03-30",
    });
    expect(text).toBe("Morning at 08:00, every day, from 2026-03-01 until 2026-03-30");
  });

  it("formats specific days schedule", () => {
    const text = describeSchedule({
      slot: "EVENING",
      target_time: "19:00",
      frequency_type: "SPECIFIC_DAYS",
      weekdays: [1, 4],
    });
    expect(text).toBe("Evening at 19:00, on Mon, Thu");
  });

  it("formats every n days schedule", () => {
    const text = describeSchedule({
      slot: "MORNING",
      target_time: "10:00",
      frequency_type: "EVERY_N_DAYS",
      interval_days: 3,
    });
    expect(text).toBe("Morning at 10:00, every 3 days");
  });

  it("trims target_time from 08:00:00 to 08:00", () => {
    const text = describeSchedule({
      slot: "MORNING",
      target_time: "08:00:00",
      frequency_type: "DAILY",
    });
    expect(text).toBe("Morning at 08:00, every day");
  });
});
