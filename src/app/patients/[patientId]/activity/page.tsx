import Link from "next/link";
import { notFound } from "next/navigation";
import { Card } from "@/components/ui/card";
import { describeActivity } from "@/lib/activity/describe";
import { loadPatientContext } from "@/lib/patients/context";
import { dateInZone, timeInZone } from "@/lib/time/local-date";
import { strings } from "@/strings/en";

export default async function ActivityPage({
  params,
  searchParams,
}: {
  params: Promise<{ patientId: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { patientId } = await params;
  const sp = await searchParams;
  const page = Math.max(0, Math.min(1000, parseInt(sp.page ?? "0", 10) || 0));

  const { supabase, patient, role } = await loadPatientContext(
    patientId,
    `/patients/${patientId}/activity`,
  );

  if (role !== "OWNER" && role !== "CAREGIVER") {
    notFound();
  }

  const { data: rawRows } = await supabase
    .from("audit_logs")
    .select("id, action, target_table, before, after, created_at, actor_id")
    .eq("patient_id", patientId)
    .order("created_at", { ascending: false })
    .range(page * 50, page * 50 + 50);

  const rows = rawRows ?? [];
  const hasMore = rows.length > 50;
  const displayRows = hasMore ? rows.slice(0, 50) : rows;

  const actorIds = Array.from(
    new Set(displayRows.map((r) => r.actor_id).filter((id): id is string => Boolean(id))),
  );

  const actorMap = new Map<string, string>();
  if (actorIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", actorIds);
    for (const p of profiles ?? []) {
      actorMap.set(p.id, p.full_name);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">{strings.activity.title}</h1>

      <Card>
        {displayRows.length === 0 ? (
          <p className="text-muted">{strings.activity.empty}</p>
        ) : (
          <ul className="flex flex-col divide-y divide-line">
            {displayRows.map((row) => {
              const actorName = row.actor_id
                ? actorMap.get(row.actor_id) ?? strings.activity.someone
                : strings.activity.system;
              const description = describeActivity(row);
              const when = `${dateInZone(row.created_at, patient.timezone)} at ${timeInZone(
                row.created_at,
                patient.timezone,
              )}`;

              return (
                <li key={row.id} className="flex flex-col gap-1 py-3">
                  <div className="text-base font-medium">{description}</div>
                  <div className="text-xs text-muted">
                    {when} · {strings.activity.by} {actorName}
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        <div className="mt-4 flex items-center justify-between">
          {page > 0 ? (
            <Link
              href={`/patients/${patientId}/activity?page=${page - 1}`}
              className="font-semibold underline"
            >
              {strings.activity.newer}
            </Link>
          ) : (
            <div />
          )}

          {hasMore ? (
            <Link
              href={`/patients/${patientId}/activity?page=${page + 1}`}
              className="font-semibold underline"
            >
              {strings.activity.older}
            </Link>
          ) : null}
        </div>
      </Card>
    </div>
  );
}
