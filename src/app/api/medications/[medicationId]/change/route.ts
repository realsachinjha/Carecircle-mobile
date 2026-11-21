import { handleRoute, jsonOk } from "@/lib/api";
import { requireApiUser } from "@/lib/auth/session";
import { appError, fromDb } from "@/lib/db-errors";
import { isUuid } from "@/lib/ids";
import { medicineSchema } from "@/lib/medicines/schema";
import type { Json } from "@/lib/supabase/database.types";
import { parseInput, readJsonBody } from "@/lib/validation";

export const POST = handleRoute<{ medicationId: string }>(async (request, { params }) => {
  const { medicationId } = await params;
  if (!isUuid(medicationId)) {
    throw appError("NOT_FOUND");
  }
  const { supabase } = await requireApiUser();
  const medicine = parseInput(medicineSchema, await readJsonBody(request));
  const { data, error } = await supabase.rpc("change_medication", {
    p_medication: medicationId,
    p_medicine: medicine as unknown as Json,
  });
  if (error) {
    throw fromDb(error);
  }
  return jsonOk({ medicationId: data }, 201);
});
