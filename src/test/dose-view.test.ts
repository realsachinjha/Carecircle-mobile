import { describe, expect, it } from "vitest";
import { doseView, groupBySlot, type Dose } from "@/lib/doses/view";

describe("dose-view helpers", () => {
  const baseDose: Dose = {
    reminder_id: "00000000-0000-0000-0000-000000000001",
    scheduled_for: "2026-03-10T08:00:00Z",
    status: "PENDING",
    acknowledged_at: null,
    slot: "MORNING",
    medication_name: "Metformin",
    dosage: "500 mg",
    instructions: null,
  };

  it("FR-8.4 determines due vs later based on 2-hour window", () => {
    const now = new Date("2026-03-10T06:00:00Z");

    const twoHoursOneMin = {
      ...baseDose,
      scheduled_for: new Date(now.getTime() + (2 * 60 + 1) * 60_000).toISOString(),
    };
    expect(doseView(twoHoursOneMin, now, false)).toBe("later");

    const exactlyTwoHours = {
      ...baseDose,
      scheduled_for: new Date(now.getTime() + 2 * 60 * 60_000).toISOString(),
    };
    expect(doseView(exactlyTwoHours, now, false)).toBe("due");

    const tenMinsAgo = {
      ...baseDose,
      scheduled_for: new Date(now.getTime() - 10 * 60_000).toISOString(),
    };
    expect(doseView(tenMinsAgo, now, false)).toBe("due");
  });

  it("FR-8.5 determines missed vs queued", () => {
    const now = new Date("2026-03-10T12:00:00Z");
    const missedDose: Dose = { ...baseDose, status: "MISSED" };

    expect(doseView(missedDose, now, false)).toBe("missed");
    expect(doseView(missedDose, now, true)).toBe("queued");
  });

  it("determines taken and skipped overriding queue state", () => {
    const now = new Date("2026-03-10T12:00:00Z");
    const ackDose: Dose = { ...baseDose, status: "ACKNOWLEDGED", acknowledged_at: now.toISOString() };
    const skipDose: Dose = { ...baseDose, status: "SKIPPED" };

    expect(doseView(ackDose, now, true)).toBe("taken");
    expect(doseView(ackDose, now, false)).toBe("taken");
    expect(doseView(skipDose, now, false)).toBe("skipped");
    expect(doseView(skipDose, now, true)).toBe("skipped");
  });

  it("FR-8.1 groupBySlot orders slots, omits empty, and sorts by time then name", () => {
    const doses: Dose[] = [
      {
        ...baseDose,
        reminder_id: "3",
        slot: "BEDTIME",
        scheduled_for: "2026-03-10T22:00:00Z",
        medication_name: "Atorvastatin",
      },
      {
        ...baseDose,
        reminder_id: "2",
        slot: "MORNING",
        scheduled_for: "2026-03-10T08:00:00Z",
        medication_name: "Metformin",
      },
      {
        ...baseDose,
        reminder_id: "1",
        slot: "MORNING",
        scheduled_for: "2026-03-10T08:00:00Z",
        medication_name: "Amlodipine",
      },
      {
        ...baseDose,
        reminder_id: "4",
        slot: "MORNING",
        scheduled_for: "2026-03-10T09:00:00Z",
        medication_name: "Vitamin C",
      },
    ];

    const groups = groupBySlot(doses);
    expect(groups.map((g) => g.slot)).toEqual(["MORNING", "BEDTIME"]);

    const morningDoses = groups[0]!.doses;
    expect(morningDoses[0]!.medication_name).toBe("Amlodipine");
    expect(morningDoses[1]!.medication_name).toBe("Metformin");
    expect(morningDoses[2]!.medication_name).toBe("Vitamin C");
  });
});
