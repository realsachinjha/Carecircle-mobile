import { handleRoute, jsonOk } from "@/lib/api";
import { requireApiUser } from "@/lib/auth/session";
import { appError, fromDb } from "@/lib/db-errors";
import { isUuid } from "@/lib/ids";
import { patientPatchSchema, toPatientColumns } from "@/lib/patients/schema";
import { parseInput, readJsonBody } from "@/lib/validation";

export const PATCH = handleRoute<{ patientId: string }>(async (request, { params }) => {
  if (!isUuid(params.patientId)) {
    throw appError("NOT_FOUND");
  }
  const { supabase } = await requireApiUser();
  const patch = parseInput(patientPatchSchema, await readJsonBody(request));
  const columns = toPatientColumns(patch);
  if (Object.keys(columns).length === 0) {
    throw appError("VALIDATION_FAILED");
  }
  const { data: role } = await supabase.rpc("my_role", { p_patient: params.patientId });
  if (!role) {
    throw appError("NOT_FOUND");
  }
  if (role !== "OWNER" && role !== "CAREGIVER") {
    throw appError("FORBIDDEN");
  }
  const { error } = await supabase.from("patients").update(columns).eq("id", params.patientId);
  if (error) {
    throw fromDb(error);
  }
  return jsonOk({ ok: true });
});

export const DELETE = handleRoute<{ patientId: string }>(async (_request, { params }) => {
  const { patientId } = await params;
  if (!isUuid(patientId)) {
    throw appError("NOT_FOUND");
  }
  const { supabase } = await requireApiUser();
  const { error } = await supabase.rpc("soft_delete_patient", { p_patient: patientId });
  if (error) {
    throw fromDb(error);
  }
  return jsonOk({ ok: true });
});
