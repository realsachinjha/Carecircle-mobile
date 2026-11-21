import { describe, expect, it } from "vitest";
import fixture from "../../fixtures/gemini/prescription-1.json";
import {
  extractionSchema,
  flagsFor,
  type ExtractedMedicine,
} from "@/lib/gemini/schema";

describe("gemini-schema", () => {
  it("validates the demo fixture", () => {
    const result = extractionSchema.safeParse(fixture);
    expect(result.success).toBe(true);
  });

  it("fails on invalid fields", () => {
    const badFrequency = {
      medicines: [
        {
          name: "Metformin",
          dosage: "500 mg",
          frequency_per_day: 0,
          slots: ["MORNING"],
          confidence: "HIGH",
        },
      ],
    };
    expect(extractionSchema.safeParse(badFrequency).success).toBe(false);

    const badSlot = {
      medicines: [
        {
          name: "Metformin",
          dosage: "500 mg",
          frequency_per_day: 1,
          slots: ["NIGHT"],
          confidence: "HIGH",
        },
      ],
    };
    expect(extractionSchema.safeParse(badSlot).success).toBe(false);

    const badConfidence = {
      medicines: [
        {
          name: "Metformin",
          dosage: "500 mg",
          frequency_per_day: 1,
          slots: ["MORNING"],
          confidence: "SURE",
        },
      ],
    };
    expect(extractionSchema.safeParse(badConfidence).success).toBe(false);

    const thirtyOneMedicines = {
      medicines: Array.from({ length: 31 }, (_, i) => ({
        name: `Med ${i}`,
        dosage: "10 mg",
        frequency_per_day: 1,
        slots: ["MORNING" as const],
        confidence: "HIGH" as const,
      })),
    };
    expect(extractionSchema.safeParse(thirtyOneMedicines).success).toBe(false);
  });

  it("checks row flags correctly", () => {
    const med1 = fixture.medicines[0] as ExtractedMedicine;
    const flags1 = flagsFor(med1);
    expect(flags1.needsAttention).toBe(false);

    const med3 = fixture.medicines[2] as ExtractedMedicine;
    const flags3 = flagsFor(med3);
    expect(flags3.slotMismatch).toBe(true);
    expect(flags3.lowConfidence).toBe(true);
    expect(flags3.needsAttention).toBe(true);

    const emptyName: ExtractedMedicine = {
      name: " ",
      dosage: "10 mg",
      frequency_per_day: 1,
      slots: ["MORNING"],
      confidence: "HIGH",
    };
    expect(flagsFor(emptyName).missingField).toBe(true);

    const duplicateSlots: ExtractedMedicine = {
      name: "Med",
      dosage: "10 mg",
      frequency_per_day: 2,
      slots: ["MORNING", "MORNING"],
      confidence: "HIGH",
    };
    expect(flagsFor(duplicateSlots).slotMismatch).toBe(true);
  });
});
