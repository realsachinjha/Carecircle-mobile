import { handleRoute } from "@/lib/api";
import { requireApiUser } from "@/lib/auth/session";
import { appError, fromDb } from "@/lib/db-errors";
import { isUuid } from "@/lib/ids";

export const GET = handleRoute<{ patientId: string }>(async (_request, { params }) => {
  const { patientId } = await params;
  if (!isUuid(patientId)) {
    throw appError("NOT_FOUND");
  }
  const { supabase } = await requireApiUser();
  const { data, error } = await supabase.rpc("export_patient", { p_patient: patientId });
  if (error) {
    throw fromDb(error);
  }
  const date = new Date().toISOString().slice(0, 10);
  return new Response(JSON.stringify(data, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="carecircle-export-${date}.json"`,
      "Cache-Control": "no-store",
    },
  });
});
