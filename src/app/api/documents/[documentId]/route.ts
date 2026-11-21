import { z } from "zod";
import { handleRoute, jsonOk } from "@/lib/api";
import { requireApiUser } from "@/lib/auth/session";
import { appError, fromDb } from "@/lib/db-errors";
import { DOCUMENT_TYPES } from "@/lib/documents/constants";
import { isUuid } from "@/lib/ids";
import type { Database } from "@/lib/supabase/database.types";
import { parseInput, readJsonBody } from "@/lib/validation";

const updateSchema = z
  .object({
    documentType: z.enum(DOCUMENT_TYPES).optional(),
    doctorName: z
      .string()
      .trim()
      .max(128)
      .transform((val) => val || null)
      .optional(),
    clinicName: z
      .string()
      .trim()
      .max(128)
      .transform((val) => val || null)
      .optional(),
    issueDate: z
      .string()
      .trim()
      .regex(/^(\d{4}-\d{2}-\d{2})?$/)
      .transform((val) => val || null)
      .optional(),
  })
  .refine(
    (data) =>
      data.documentType !== undefined ||
      data.doctorName !== undefined ||
      data.clinicName !== undefined ||
      data.issueDate !== undefined,
    { message: "VALIDATION_FAILED" }
  );

export const PATCH = handleRoute<{ documentId: string }>(async (request, { params }) => {
  const { documentId } = await params;
  if (!isUuid(documentId)) {
    throw appError("NOT_FOUND");
  }
  const { supabase } = await requireApiUser();
  const input = parseInput(updateSchema, await readJsonBody(request));
  const { data: doc, error: fetchError } = await supabase
    .from("medical_documents")
    .select("patient_id")
    .eq("id", documentId)
    .is("deleted_at", null)
    .maybeSingle();
  if (fetchError || !doc) {
    throw appError("NOT_FOUND");
  }
  const { data: role, error: roleError } = await supabase.rpc("my_role", { p_patient: doc.patient_id });
  if (roleError || !role) {
    throw appError("NOT_FOUND");
  }
  if (role !== "OWNER" && role !== "CAREGIVER") {
    throw appError("FORBIDDEN");
  }
  const updatePayload: Database["public"]["Tables"]["medical_documents"]["Update"] = {};
  if (input.documentType !== undefined) {
    updatePayload.document_type = input.documentType;
  }
  if (input.doctorName !== undefined) {
    updatePayload.doctor_name = input.doctorName;
  }
  if (input.clinicName !== undefined) {
    updatePayload.clinic_name = input.clinicName;
  }
  if (input.issueDate !== undefined) {
    updatePayload.issue_date = input.issueDate;
  }
  const { error: updateError } = await supabase
    .from("medical_documents")
    .update(updatePayload)
    .eq("id", documentId);
  if (updateError) {
    throw fromDb(updateError);
  }
  return jsonOk({ ok: true });
});
