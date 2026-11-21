import { z } from "zod";
import { handleRoute, jsonOk } from "@/lib/api";
import { requireApiUser } from "@/lib/auth/session";
import { appError, fromDb } from "@/lib/db-errors";
import { isUuid } from "@/lib/ids";
import { parseInput, readJsonBody } from "@/lib/validation";

const ackSchema = z.object({ action: z.enum(["ACKNOWLEDGED", "SKIPPED"]) });

export const POST = handleRoute<{ reminderId: string }>(async (request, { params }) => {
  if (!isUuid(params.reminderId)) {
    throw appError("NOT_FOUND");
  }
  const { supabase } = await requireApiUser();
  const { action } = parseInput(ackSchema, await readJsonBody(request));
  const { data, error } = await supabase.rpc("acknowledge_dose", { p_reminder: params.reminderId, p_action: action });
  if (error) {
    throw fromDb(error);
  }
  const row = data as { status: string; acknowledged_at: string | null };
  return jsonOk({ status: row.status, acknowledgedAt: row.acknowledged_at });
});
