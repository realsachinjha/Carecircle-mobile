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
      <div className="flex items-center justify-between rounded-2xl bg-forest-deep px-5 py-4 text-white shadow-sm">
        <h1 className="text-2xl font-bold tracking-tight">{strings.activity.title}</h1>
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 9v7.5" />
          </svg>
        </div>
      </div>

      <div className="flex items-center gap-2 rounded-full border border-line bg-white px-4 py-2 text-xs font-semibold text-ink shadow-2xs w-fit">
        <svg className="h-4 w-4 text-forest" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
        </svg>
        <span>Last 7 Days</span>
      </div>

      <Card>
        {displayRows.length === 0 ? (
          <p className="text-sm text-muted">{strings.activity.empty}</p>
        ) : (
          <div className="relative flex flex-col pl-6">
            <div className="absolute bottom-3 left-2 top-3 w-0.5 bg-line" aria-hidden="true" />
            <ul className="flex flex-col gap-5">
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
                  <li key={row.id} className="relative flex flex-col gap-1">
                    <div className="absolute -left-6 top-1.5 h-3.5 w-3.5 rounded-full bg-forest ring-4 ring-sage-soft" />
                    <div className="text-base font-bold text-ink">{description}</div>
                    <div className="text-xs text-muted">
                      {when} · {strings.activity.by} {actorName}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        <div className="mt-4 flex items-center justify-between pt-2 border-t border-line">
          {page > 0 ? (
            <Link
              href={`/patients/${patientId}/activity?page=${page - 1}`}
              className="text-sm font-semibold text-forest hover:underline"
            >
              {strings.activity.newer}
            </Link>
          ) : (
            <div />
          )}

          {hasMore ? (
            <Link
              href={`/patients/${patientId}/activity?page=${page + 1}`}
              className="text-sm font-semibold text-forest hover:underline"
            >
              {strings.activity.older}
            </Link>
          ) : null}
        </div>
      </Card>
    </div>
  );
}
