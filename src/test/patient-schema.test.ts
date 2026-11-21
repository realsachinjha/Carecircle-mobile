import { describe, expect, it } from "vitest";
import {
  patientFieldsSchema,
  patientPatchSchema,
  toPatientColumns,
} from "@/lib/patients/schema";

describe("patient-schema", () => {
  const valid = {
    fullName: "Ramesh Test",
    dateOfBirth: "1957-03-04",
    timezone: "Asia/Kolkata",
    missedAfterMinutes: 120,
    bloodGroup: "O+",
    primaryCondition: "",
    notes: "",
  };

  it("FR-2.1 a full valid object passes and turns empty optional strings into null", () => {
    const result = patientFieldsSchema.safeParse(valid);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.primaryCondition).toBeNull();
      expect(result.data.notes).toBeNull();
    }
  });

  it("FR-2.1 rejects invalid required fields, formats, and ranges", () => {
    expect(patientFieldsSchema.safeParse({ ...valid, fullName: "   " }).success).toBe(false);
    expect(patientFieldsSchema.safeParse({ ...valid, dateOfBirth: "04/03/1957" }).success).toBe(false);
    expect(patientFieldsSchema.safeParse({ ...valid, missedAfterMinutes: 29 }).success).toBe(false);
    expect(patientFieldsSchema.safeParse({ ...valid, missedAfterMinutes: 481 }).success).toBe(false);
    expect(patientFieldsSchema.safeParse({ ...valid, bloodGroup: "C+" }).success).toBe(false);
  });

  it("FR-2.2 patientPatchSchema accepts partial fields and maps columns correctly", () => {
    const patch = patientPatchSchema.safeParse({ notes: "x" });
    expect(patch.success).toBe(true);
    if (patch.success) {
      const columns = toPatientColumns(patch.data);
      expect(columns).toEqual({ notes: "x" });
    }
  });

  it("FR-2.2 toPatientColumns correctly maps null bloodGroup", () => {
    const columns = toPatientColumns({ bloodGroup: null });
    expect(columns).toEqual({ blood_group: null });
  });
});
