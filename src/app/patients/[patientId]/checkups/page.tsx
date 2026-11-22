import Link from "next/link";
import { CompleteCheckupForm, DeleteCheckupButton } from "@/components/checkups/checkup-actions";
import { Card } from "@/components/ui/card";
import { loadPatientContext } from "@/lib/patients/context";
import { dateInZone, timeInZone } from "@/lib/time/local-date";
import { strings } from "@/strings/en";

export default async function CheckupsPage({
  params,
}: {
  params: Promise<{ patientId: string }>;
}) {
  const { patientId } = await params;
  const { supabase, patient, role } = await loadPatientContext(
    patientId,
    `/patients/${patientId}/checkups`,
  );

  const { data: checkups } = await supabase
    .from("checkup_schedules")
    .select(
      "id, checkup_type, doctor_name, clinic_location, appointment_time, reminder_hours_before, notes, checkup_completions(id, completed_at, clinical_notes)",
    )
    .eq("patient_id", patientId)
    .order("appointment_time", { ascending: true });

  const now = new Date();
  type CheckupItem = NonNullable<typeof checkups>[number];
  const upcoming: CheckupItem[] = [];
  const past: CheckupItem[] = [];

  for (const c of checkups ?? []) {
    const comp = Array.isArray(c.checkup_completions)
      ? c.checkup_completions[0]
      : c.checkup_completions;
    if (!comp && new Date(c.appointment_time) > now) {
      upcoming.push(c);
    } else {
      past.push(c);
    }
  }

  past.sort(
    (a, b) =>
      new Date(b.appointment_time).getTime() - new Date(a.appointment_time).getTime(),
  );

  const canManage = role === "OWNER" || role === "CAREGIVER";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between rounded-2xl bg-forest-deep px-5 py-4 text-white shadow-sm">
        <h1 className="text-2xl font-bold tracking-tight">{strings.checkups.title}</h1>
        {canManage ? (
          <Link
            href={`/patients/${patientId}/checkups/new`}
            className="inline-flex min-h-10 items-center justify-center rounded-full bg-terracotta px-4 py-1.5 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-terracotta-dark"
          >
            {strings.checkups.add}
          </Link>
        ) : null}
      </div>

      <Card title={strings.checkups.upcoming}>
        {upcoming.length === 0 ? (
          <p className="text-sm text-muted">{strings.checkups.empty}</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {upcoming.map((c) => {
              const typeLabel =
                c.checkup_type in strings.checkups.types
                  ? strings.checkups.types[c.checkup_type as keyof typeof strings.checkups.types]
                  : c.checkup_type;
              return (
                <li key={c.id} className="rounded-2xl border border-line bg-surface/30 p-4 transition-colors hover:bg-white">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <span className="rounded-full bg-sage px-3 py-0.5 text-xs font-bold text-forest">
                        {typeLabel}
                      </span>
                      <h3 className="mt-1 text-lg font-bold text-ink">{c.doctor_name}</h3>
                      {c.clinic_location ? (
                        <p className="text-xs font-medium text-muted">{c.clinic_location}</p>
                      ) : null}
                      <p className="mt-1 text-sm font-semibold text-forest">
                        {dateInZone(c.appointment_time, patient.timezone)} at{" "}
                        {timeInZone(c.appointment_time, patient.timezone)}
                      </p>
                      {c.notes ? <p className="mt-2 text-xs text-muted">{c.notes}</p> : null}
                    </div>

                    {canManage ? (
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/patients/${patientId}/checkups/${c.id}/edit`}
                          className="inline-flex min-h-9 items-center justify-center rounded-full border border-forest/20 bg-sage-soft px-3 text-xs font-semibold text-forest hover:bg-sage"
                        >
                          {strings.common.edit}
                        </Link>
                        <DeleteCheckupButton checkupId={c.id} patientId={patientId} />
                      </div>
                    ) : null}
                  </div>

                  {canManage ? (
                    <div className="mt-3 pt-3 border-t border-line/60">
                      <CompleteCheckupForm checkupId={c.id} patientId={patientId} />
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      <Card title={strings.checkups.past}>
        {past.length === 0 ? (
          <p className="text-sm text-muted">{strings.checkups.empty}</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {past.map((c) => {
              const comp = Array.isArray(c.checkup_completions)
                ? c.checkup_completions[0]
                : c.checkup_completions;
              const typeLabel =
                c.checkup_type in strings.checkups.types
                  ? strings.checkups.types[c.checkup_type as keyof typeof strings.checkups.types]
                  : c.checkup_type;
              return (
                <li key={c.id} className="rounded-2xl border border-line bg-surface/20 p-4 opacity-80">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <span className="rounded-full bg-surface px-3 py-0.5 text-xs font-semibold text-muted">
                        {typeLabel}
                      </span>
                      <h3 className="mt-1 text-base font-bold text-ink">{c.doctor_name}</h3>
                      <p className="text-xs text-muted">
                        {dateInZone(c.appointment_time, patient.timezone)} at{" "}
                        {timeInZone(c.appointment_time, patient.timezone)}
                      </p>
                      {comp ? (
                        <div className="mt-2 rounded-xl bg-sage-light p-2.5 border border-line">
                          <p className="text-xs font-bold text-forest">
                            {strings.checkups.completedOn}{" "}
                            {dateInZone(comp.completed_at, patient.timezone)}
                          </p>
                          {comp.clinical_notes ? (
                            <p className="mt-1 text-xs text-muted">{comp.clinical_notes}</p>
                          ) : null}
                        </div>
                      ) : null}
                    </div>

                    {canManage ? (
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/patients/${patientId}/checkups/${c.id}/edit`}
                          className="inline-flex min-h-9 items-center justify-center rounded-full border border-line bg-white px-3 text-xs font-semibold text-muted hover:text-ink"
                        >
                          {strings.common.edit}
                        </Link>
                        <DeleteCheckupButton checkupId={c.id} patientId={patientId} />
                      </div>
                    ) : null}
                  </div>

                  {canManage && !comp ? (
                    <div className="mt-3 pt-3 border-t border-line/60">
                      <CompleteCheckupForm checkupId={c.id} patientId={patientId} />
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}
