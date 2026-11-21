import { handleRoute, jsonOk } from "@/lib/api";
import { requireApiUser } from "@/lib/auth/session";
import { checkupSchema } from "@/lib/checkups/schema";
import { appError, fromDb } from "@/lib/db-errors";
import { isUuid } from "@/lib/ids";
import { parseInput, readJsonBody } from "@/lib/validation";

export const POST = handleRoute<{ patientId: string }>(async (request, { params }) => {
  const { patientId } = await params;
  if (!isUuid(patientId)) {
    throw appError("NOT_FOUND");
  }
  const { supabase } = await requireApiUser();
  const input = parseInput(checkupSchema, await readJsonBody(request));
  const { data, error } = await supabase.rpc("save_checkup", {
    p_checkup: null as unknown as string,
    p_patient: patientId,
    p_checkup_type: input.checkupType,
    p_doctor_name: input.doctorName,
    p_clinic_location: input.clinicLocation ?? "",
    p_local_time: input.localTime.replace("T", " "),
    p_reminder_hours_before: input.reminderHoursBefore,
    p_notes: input.notes ?? "",
  });
  if (error) {
    throw fromDb(error);
  }
  return jsonOk({ checkupId: data }, 201);
});
