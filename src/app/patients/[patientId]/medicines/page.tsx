import Link from "next/link";
import { notFound } from "next/navigation";
import { MedicineCapsuleIcon } from "@/components/medicines/medicine-capsule-icon";
import { StopMedicineButton } from "@/components/medicines/medicine-actions";
import { Card } from "@/components/ui/card";
import { loadPatientContext } from "@/lib/auth/session";
import { describeSchedule } from "@/lib/medicines/describe";
import { strings } from "@/strings/en";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ patientId: string }>;
};

type ScheduleRow = {
  slot: string;
  target_time: string;
  frequency_type: string;
  weekdays: number[] | null;
  interval_days: number | null;
  start_date: string | null;
  end_date: string | null;
};

type MedicineRow = {
  id: string;
  name: string;
  dosage: string;
  instructions: string | null;
  status: "ACTIVE" | "STOPPED";
  stopped_at: string | null;
  document_id: string | null;
  replaces_id: string | null;
  created_at: string;
  medication_schedules: ScheduleRow[];
};

export default async function MedicinesPage({ params }: PageProps) {
  const { patientId } = await params;
  const context = await loadPatientContext(patientId);
  if (!context || context.role === "PATIENT") {
    notFound();
  }

  const { data } = await context.supabase
    .from("medications")
    .select(
      "id, name, dosage, instructions, status, stopped_at, document_id, replaces_id, created_at, medication_schedules(slot, target_time, frequency_type, weekdays, interval_days, start_date, end_date)"
    )
    .eq("patient_id", patientId)
    .order("created_at", { ascending: false });

  const medications = (data ?? []) as unknown as MedicineRow[];
  const activeMedications = medications.filter((m) => m.status === "ACTIVE");
  const stoppedMedications = medications.filter((m) => m.status === "STOPPED");

  const canManage = context.role === "OWNER" || context.role === "CAREGIVER";

  return (
    <div className="flex flex-col gap-5">
      <div className="relative flex items-center justify-between py-1">
        <Link
          href={`/patients/${patientId}`}
          className="flex h-10 w-10 items-center justify-center rounded-full text-ink hover:bg-sage-soft"
          aria-label={strings.common.back}
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
        </Link>
        <h1 className="text-xl font-bold tracking-tight text-ink sm:text-2xl">
          {strings.medicines.title}
        </h1>
        <div className="h-10 w-10" aria-hidden="true" />
      </div>

      <div className="flex items-center gap-4 rounded-3xl border border-sage/60 bg-sage-soft p-5 shadow-xs">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white text-forest shadow-2xs">
          <svg className="h-6 w-6 rotate-45" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75" />
          </svg>
        </div>
        <div className="flex flex-col">
          <span className="text-base font-bold text-ink">
            {strings.medicines.todaySchedule}
          </span>
          <span className="text-xs font-medium text-muted">
            {strings.medicines.dontForget}
          </span>
        </div>
      </div>

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-base font-bold text-ink">{strings.medicines.active}</h2>
          {canManage && (
            <Link
              href={`/patients/${patientId}/medicines/new`}
              className="text-xs font-semibold text-forest hover:underline"
            >
              {strings.medicines.add}
            </Link>
          )}
        </div>

        {activeMedications.length === 0 ? (
          <Card>
            <p className="text-sm font-medium text-muted">{strings.medicines.empty}</p>
          </Card>
        ) : (
          <div className="flex flex-col gap-3">
            {activeMedications.map((medicine) => {
              const sortedSchedules = [...(medicine.medication_schedules ?? [])].sort(
                (a, b) => a.target_time.localeCompare(b.target_time)
              );

              return (
                <div
                  key={medicine.id}
                  data-medicine={medicine.name}
                  className="flex flex-col gap-3 rounded-2xl border border-line-soft bg-white p-4 shadow-xs"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3.5">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-sage-soft text-forest">
                        <MedicineCapsuleIcon name={medicine.name} />
                      </div>
                      <div className="flex flex-col">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-base font-bold text-ink">{medicine.name}</h3>
                          <span className="text-sm font-semibold text-muted">• {medicine.dosage}</span>
                        </div>
                        {medicine.instructions ? (
                          <span className="mt-0.5 text-xs text-muted">{medicine.instructions}</span>
                        ) : null}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-sage-soft px-3 py-1 text-xs font-semibold text-forest">
                        {strings.medicines.statusTaken}
                      </span>
                    </div>
                  </div>

                  {sortedSchedules.length > 0 ? (
                    <div className="rounded-xl border border-line-soft/60 bg-surface/40 p-3">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted">
                        {strings.medicines.schedules}
                      </span>
                      <ul className="mt-1 flex flex-col gap-1">
                        {sortedSchedules.map((schedule, idx) => (
                          <li key={idx} className="flex items-center gap-2 text-xs font-medium text-ink">
                            <svg className="h-3.5 w-3.5 text-forest" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                            </svg>
                            <span>{describeSchedule(schedule)}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}

                  {(medicine.document_id || medicine.replaces_id) && (
                    <div className="flex flex-wrap items-center gap-3 border-t border-line-soft/60 pt-2 text-xs text-muted">
                      {medicine.document_id && (
                        <Link
                          href={`/patients/${patientId}/documents/${medicine.document_id}`}
                          className="font-medium text-forest hover:underline"
                        >
                          {strings.medicines.fromDocument}
                        </Link>
                      )}
                      {medicine.replaces_id && (
                        <span>{strings.medicines.replaces}</span>
                      )}
                    </div>
                  )}

                  {canManage && (
                    <div className="flex flex-wrap items-center justify-between border-t border-line-soft/60 pt-3">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/patients/${patientId}/medicines/${medicine.id}/change`}
                          className="inline-flex min-h-8 items-center justify-center rounded-full border border-forest/20 bg-sage-soft px-3 text-xs font-semibold text-forest hover:bg-sage"
                        >
                          {strings.medicines.change}
                        </Link>
                        <StopMedicineButton medicationId={medicine.id} />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {canManage && (
        <Link
          href={`/patients/${patientId}/medicines/new`}
          className="flex min-h-12 w-full items-center justify-center rounded-full bg-sage px-6 text-base font-semibold text-forest shadow-xs transition-colors hover:bg-sage/80 active:bg-sage/90"
        >
          {strings.medicines.addMedicineAction}
        </Link>
      )}

      {stoppedMedications.length > 0 && (
        <details className="group rounded-2xl border border-line-soft bg-white p-4 shadow-xs">
          <summary className="cursor-pointer text-sm font-bold text-ink">
            {strings.medicines.stopped} ({stoppedMedications.length})
          </summary>
          <div className="mt-4 flex flex-col gap-3">
            {stoppedMedications.map((medicine) => (
              <div
                key={medicine.id}
                data-medicine-stopped={medicine.name}
                className="flex items-start justify-between rounded-xl border border-line-soft bg-surface/30 p-3"
              >
                <div className="flex items-start gap-3.5">
                  <MedicineCapsuleIcon name={medicine.name} />
                  <div className="flex flex-col">
                    <h3 className="text-base font-bold text-ink">{medicine.name}</h3>
                    <p className="text-xs text-muted">{medicine.dosage}</p>
                    {medicine.stopped_at && (
                      <p className="mt-1 text-xs text-muted">
                        {strings.medicines.stoppedOn} {new Date(medicine.stopped_at).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
                <span className="rounded-full bg-surface px-2.5 py-0.5 text-xs font-semibold text-muted">
                  {strings.medicines.stopped}
                </span>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}
