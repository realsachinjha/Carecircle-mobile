import { describe, expect, it } from "vitest";
import fixture from "../../fixtures/gemini/prescription-1.json";
import type { Extraction } from "@/lib/gemini/schema";
import { draftsFromExtraction, draftToInput, newScheduleDraft } from "@/lib/medicines/defaults";
import { medicineSchema } from "@/lib/medicines/schema";

describe("medicine-defaults", () => {
  it("FR-6.1 FR-6.6 converts extraction into drafts with calculated end dates and schedules", () => {
    const drafts = draftsFromExtraction(fixture as unknown as Extraction, "2026-03-10");
    expect(drafts).toHaveLength(3);

    const metformin = drafts[0]!;
    expect(metformin.name).toBe("Metformin");
    expect(metformin.dosage).toBe("500 mg");
    expect(metformin.instructions).toBe("After food");
    expect(metformin.schedules).toHaveLength(2);
    expect(metformin.schedules[0]!.slot).toBe("MORNING");
    expect(metformin.schedules[0]!.target_time).toBe("08:00");
    expect(metformin.schedules[0]!.start_date).toBe("2026-03-10");
    expect(metformin.schedules[0]!.end_date).toBe("2026-04-08");
    expect(metformin.schedules[1]!.slot).toBe("EVENING");
    expect(metformin.schedules[1]!.target_time).toBe("19:00");
    expect(metformin.schedules[1]!.start_date).toBe("2026-03-10");
    expect(metformin.schedules[1]!.end_date).toBe("2026-04-08");

    const atorvastatin = drafts[2]!;
    expect(atorvastatin.name).toBe("Atorvastatin");
    expect(atorvastatin.schedules).toHaveLength(0);
  });

  it("converts draft to input, normalizes empty strings to null, sorts weekdays, and passes validation", () => {
    const draft = {
      name: "Test Med",
      dosage: "10 mg",
      instructions: "   ",
      schedules: [
        {
          ...newScheduleDraft("MORNING", "2026-03-10"),
          end_date: "",
        },
        {
          ...newScheduleDraft("EVENING", "2026-03-10"),
          frequency_type: "SPECIFIC_DAYS" as const,
          weekdays: [5, 2, 7],
          end_date: "",
        },
      ],
    };

    const input = draftToInput(draft);
    expect(input.instructions).toBeNull();
    expect(input.schedules[0]!.end_date).toBeNull();
    expect((input.schedules[0] as unknown as { weekdays?: number[] }).weekdays).toBeUndefined();
    expect(input.schedules[1]!.frequency_type).toBe("SPECIFIC_DAYS");
    expect((input.schedules[1] as unknown as { weekdays: number[] }).weekdays).toEqual([2, 5, 7]);

    const result = medicineSchema.safeParse(input);
    expect(result.success).toBe(true);
  });
});
