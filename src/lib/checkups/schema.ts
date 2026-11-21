import { z } from "zod";

export const CHECKUP_TYPES = ["CONSULTATION", "LAB_TEST", "DIAGNOSTIC", "OTHER"] as const;

export const checkupSchema = z.object({
  checkupType: z.enum(CHECKUP_TYPES),
  doctorName: z.string().trim().min(1).max(128),
  clinicLocation: z.string().trim().max(500).optional(),
  localTime: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/),
  reminderHoursBefore: z.number().int().min(1).max(168),
  notes: z.string().trim().max(2000).optional(),
});

export const completeSchema = z.object({ notes: z.string().trim().max(4000).optional() });
