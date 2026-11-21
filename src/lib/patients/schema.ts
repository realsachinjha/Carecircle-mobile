import { z } from "zod";
import type { Database } from "@/lib/supabase/database.types";

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((value) => (value === "" ? null : value))
    .nullable()
    .optional();

export const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"] as const;

export const patientFieldsSchema = z.object({
  fullName: z.string().trim().min(1).max(128),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  timezone: z.string().trim().min(1).max(64),
  missedAfterMinutes: z.number().int().min(30).max(480),
  bloodGroup: z.enum(BLOOD_GROUPS).nullable().optional(),
  primaryCondition: optionalText(2000),
  notes: optionalText(4000),
  emergencyContactName: optionalText(128),
  emergencyContactPhone: optionalText(32),
  physicianName: optionalText(128),
  physicianPhone: optionalText(32),
});

export const patientPatchSchema = patientFieldsSchema.partial();

export type PatientFields = z.infer<typeof patientFieldsSchema>;
export type PatientPatch = z.infer<typeof patientPatchSchema>;
export type PatientUpdate = Database["public"]["Tables"]["patients"]["Update"];

export function toPatientColumns(patch: PatientPatch): PatientUpdate {
  const columns: PatientUpdate = {};
  if (patch.fullName !== undefined) columns.full_name = patch.fullName;
  if (patch.dateOfBirth !== undefined) columns.date_of_birth = patch.dateOfBirth;
  if (patch.timezone !== undefined) columns.timezone = patch.timezone;
  if (patch.missedAfterMinutes !== undefined) columns.missed_after_minutes = patch.missedAfterMinutes;
  if (patch.bloodGroup !== undefined) columns.blood_group = patch.bloodGroup;
  if (patch.primaryCondition !== undefined) columns.primary_condition = patch.primaryCondition;
  if (patch.notes !== undefined) columns.notes = patch.notes;
  if (patch.emergencyContactName !== undefined) columns.emergency_contact_name = patch.emergencyContactName;
  if (patch.emergencyContactPhone !== undefined) columns.emergency_contact_phone = patch.emergencyContactPhone;
  if (patch.physicianName !== undefined) columns.physician_name = patch.physicianName;
  if (patch.physicianPhone !== undefined) columns.physician_phone = patch.physicianPhone;
  return columns;
}
