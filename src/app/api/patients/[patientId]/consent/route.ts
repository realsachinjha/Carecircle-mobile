import { handleRoute, jsonOk } from "@/lib/api";
import { requireApiUser } from "@/lib/auth/session";
import { appError, fromDb } from "@/lib/db-errors";
import { CONSENT_NOTICE_VERSION } from "@/lib/documents/constants";
import { isUuid } from "@/lib/ids";

export const POST = handleRoute<{ patientId: string }>(async (_request, { params }) => {
  const { patientId } = await params;
  if (!isUuid(patientId)) {
    throw appError("NOT_FOUND");
  }
  const { supabase } = await requireApiUser();
  const { data, error } = await supabase.rpc("give_consent", {
    p_patient: patientId,
    p_notice_version: CONSENT_NOTICE_VERSION,
  });
  if (error) {
    throw fromDb(error);
  }
  return jsonOk({ consentId: data }, 201);
});

export const DELETE = handleRoute<{ patientId: string }>(async (_request, { params }) => {
  const { patientId } = await params;
  if (!isUuid(patientId)) {
    throw appError("NOT_FOUND");
  }
  const { supabase } = await requireApiUser();
  const { error } = await supabase.rpc("withdraw_consent", { p_patient: patientId });
  if (error) {
    throw fromDb(error);
  }
  return jsonOk({ ok: true });
});
