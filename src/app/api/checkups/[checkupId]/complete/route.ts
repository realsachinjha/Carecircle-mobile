import { handleRoute, jsonOk } from "@/lib/api";
import { requireApiUser } from "@/lib/auth/session";
import { completeSchema } from "@/lib/checkups/schema";
import { appError, fromDb } from "@/lib/db-errors";
import { isUuid } from "@/lib/ids";
import { parseInput, readJsonBody } from "@/lib/validation";

export const POST = handleRoute<{ checkupId: string }>(async (request, { params }) => {
  const { checkupId } = await params;
  if (!isUuid(checkupId)) {
    throw appError("NOT_FOUND");
  }
  const { supabase } = await requireApiUser();
  const input = parseInput(completeSchema, await readJsonBody(request));
  const { data, error } = await supabase.rpc("complete_checkup", {
    p_checkup: checkupId,
    p_notes: input.notes ?? "",
  });
  if (error) {
    throw fromDb(error);
  }
  return jsonOk({ completionId: data });
});
