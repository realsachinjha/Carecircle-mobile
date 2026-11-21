import { handleRoute, jsonOk } from "@/lib/api";
import { requireApiUser } from "@/lib/auth/session";
import { fromDb } from "@/lib/db-errors";
import { patientFieldsSchema } from "@/lib/patients/schema";
import { parseInput, readJsonBody } from "@/lib/validation";

export const POST = handleRoute(async (request) => {
  const { supabase } = await requireApiUser();
  const input = parseInput(patientFieldsSchema, await readJsonBody(request));
  const { data, error } = await supabase.rpc("create_patient", {
    p_full_name: input.fullName,
    p_date_of_birth: input.dateOfBirth,
    p_timezone: input.timezone,
    p_missed_after_minutes: input.missedAfterMinutes,
    p_blood_group: input.bloodGroup ?? undefined,
    p_primary_condition: input.primaryCondition ?? undefined,
    p_notes: input.notes ?? undefined,
    p_emergency_contact_name: input.emergencyContactName ?? undefined,
    p_emergency_contact_phone: input.emergencyContactPhone ?? undefined,
    p_physician_name: input.physicianName ?? undefined,
    p_physician_phone: input.physicianPhone ?? undefined,
  });
  if (error) {
    throw fromDb(error);
  }
  return jsonOk({ patientId: data }, 201);
});
