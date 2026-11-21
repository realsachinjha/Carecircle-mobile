import { handleRoute, jsonOk } from "@/lib/api";
import { requireApiUser } from "@/lib/auth/session";
import { appError, fromDb } from "@/lib/db-errors";
import { isUuid } from "@/lib/ids";
import { approvalSchema } from "@/lib/medicines/schema";
import type { Json } from "@/lib/supabase/database.types";
import { parseInput, readJsonBody } from "@/lib/validation";

export const POST = handleRoute<{ documentId: string }>(async (request, { params }) => {
  const { documentId } = await params;
  if (!isUuid(documentId)) {
    throw appError("NOT_FOUND");
  }
  const { supabase } = await requireApiUser();
  const { medicines } = parseInput(approvalSchema, await readJsonBody(request));
  const { data, error } = await supabase.rpc("approve_document", {
    p_document: documentId,
    p_medicines: medicines as unknown as Json,
  });
  if (error) {
    throw fromDb(error);
  }
  return jsonOk({ approved: data });
});
