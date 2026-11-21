import { z } from "zod";
import { handleRoute, jsonOk } from "@/lib/api";
import { requireApiUser } from "@/lib/auth/session";
import { fromDb } from "@/lib/db-errors";
import { uuidSchema } from "@/lib/ids";
import { parseInput, readJsonBody } from "@/lib/validation";

const readSchema = z.union([
  z.object({ all: z.literal(true) }),
  z.object({ ids: z.array(uuidSchema).min(1).max(100) }),
]);

export const POST = handleRoute(async (request) => {
  const { supabase, user } = await requireApiUser();
  const input = parseInput(readSchema, await readJsonBody(request));
  let query = supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", user.id)
    .is("read_at", null);
  if ("ids" in input) {
    query = query.in("id", input.ids);
  }
  const { error } = await query;
  if (error) {
    throw fromDb(error);
  }
  return jsonOk({ ok: true });
});
