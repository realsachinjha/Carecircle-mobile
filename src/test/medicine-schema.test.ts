import { describe, expect, it } from "vitest";
import { approvalSchema, medicineSchema, scheduleSchema } from "@/lib/medicines/schema";

describe("medicine-schema", () => {
  const validDailySchedule = {
    slot: "MORNING" as const,
    target_time: "08:00",
    frequency_type: "DAILY" as const,
    start_date: "2026-03-01",
    end_date: null,
  };

  const validMedicine = {
    name: "Metformin",
    dosage: "500 mg",
    instructions: "After meals",
    schedules: [validDailySchedule],
  };

  it("FR-6.1 a valid DAILY medicine passes", () => {
    const result = medicineSchema.safeParse(validMedicine);
    expect(result.success).toBe(true);
  });

  it("validates target_time format and boundaries", () => {
    expect(scheduleSchema.safeParse({ ...validDailySchedule, target_time: "8:00" }).success).toBe(false);
    expect(scheduleSchema.safeParse({ ...validDailySchedule, target_time: "24:00" }).success).toBe(false);
    expect(scheduleSchema.safeParse({ ...validDailySchedule, target_time: "12:60" }).success).toBe(false);
    expect(scheduleSchema.safeParse({ ...validDailySchedule, target_time: "00:00" }).success).toBe(true);
    expect(scheduleSchema.safeParse({ ...validDailySchedule, target_time: "23:59" }).success).toBe(true);
  });

  it("FR-6.5 validates SPECIFIC_DAYS weekdays constraints", () => {
    const base = {
      slot: "MORNING" as const,
      target_time: "08:00",
      frequency_type: "SPECIFIC_DAYS" as const,
      start_date: "2026-03-01",
    };
    expect(scheduleSchema.safeParse({ ...base, weekdays: [] }).success).toBe(false);
    expect(scheduleSchema.safeParse({ ...base, weekdays: [1, 1] }).success).toBe(false);
    expect(scheduleSchema.safeParse({ ...base, weekdays: [1, 4] }).success).toBe(true);
    expect(scheduleSchema.safeParse({ ...base, weekdays: [0] }).success).toBe(false);
    expect(scheduleSchema.safeParse({ ...base, weekdays: [8] }).success).toBe(false);
  });

  it("FR-6.5 validates EVERY_N_DAYS interval_days boundaries", () => {
    const base = {
      slot: "MORNING" as const,
      target_time: "08:00",
      frequency_type: "EVERY_N_DAYS" as const,
      start_date: "2026-03-01",
    };
    expect(scheduleSchema.safeParse({ ...base, interval_days: 1 }).success).toBe(false);
    expect(scheduleSchema.safeParse({ ...base, interval_days: 31 }).success).toBe(false);
    expect(scheduleSchema.safeParse({ ...base, interval_days: 2 }).success).toBe(true);
    expect(scheduleSchema.safeParse({ ...base, interval_days: 30 }).success).toBe(true);
  });

  it("FR-6.6 validates end_date relative to start_date", () => {
    expect(
      scheduleSchema.safeParse({
        ...validDailySchedule,
        start_date: "2026-03-10",
        end_date: "2026-03-09",
      }).success
    ).toBe(false);

    expect(
      scheduleSchema.safeParse({
        ...validDailySchedule,
        start_date: "2026-03-10",
        end_date: "2026-03-10",
      }).success
    ).toBe(true);
  });

  it("validates schedule list size boundaries (1 to 6)", () => {
    expect(medicineSchema.safeParse({ ...validMedicine, schedules: [] }).success).toBe(false);
    const sevenSchedules = Array(7).fill(validDailySchedule);
    expect(medicineSchema.safeParse({ ...validMedicine, schedules: sevenSchedules }).success).toBe(false);
  });

  it("validates approvalSchema medicine count boundaries (1 to 30)", () => {
    expect(approvalSchema.safeParse({ medicines: [] }).success).toBe(false);
    const thirtyOne = Array(31).fill(validMedicine);
    expect(approvalSchema.safeParse({ medicines: thirtyOne }).success).toBe(false);
  });
});
