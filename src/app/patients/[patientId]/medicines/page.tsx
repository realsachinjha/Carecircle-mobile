import Link from "next/link";
import { notFound } from "next/navigation";
import { loadPatientContext } from "@/lib/auth/session";
import { describeSchedule } from "@/lib/medicines/describe";
import { MedicineCapsuleIcon } from "@/components/medicines/medicine-capsule-icon";
import { StopMedicineButton } from "@/components/medicines/medicine-actions";
import { Card } from "@/components/ui/card";
import { strings } from "@/strings/en";

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
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between rounded-2xl bg-forest-deep px-5 py-4 text-white shadow-sm">
        <h1 className="text-2xl font-bold tracking-tight">{strings.medicines.title}</h1>
        {canManage && (
          <Link
            href={`/patients/${patientId}/medicines/new`}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-terracotta text-white shadow-sm transition-transform hover:scale-105 active:scale-95"
            title={strings.medicines.addTitle}
            aria-label={strings.medicines.addTitle}
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          </Link>
        )}
      </div>

      <div className="flex gap-2">
        <span className="rounded-full bg-forest px-4 py-1.5 text-xs font-bold text-white shadow-2xs">
          All ({medications.length})
        </span>
        <span className="rounded-full bg-white px-4 py-1.5 text-xs font-semibold text-ink border border-line">
          Active ({activeMedications.length})
        </span>
        <span className="rounded-full bg-white px-4 py-1.5 text-xs font-semibold text-muted border border-line">
          Stopped ({stoppedMedications.length})
        </span>
      </div>

      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-ink">{strings.medicines.active}</h2>
          {canManage && (
            <Link
              href={`/patients/${patientId}/medicines/new`}
              className="text-sm font-semibold text-forest hover:underline"
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
                <Card key={medicine.id} data-medicine={medicine.name} className="flex flex-col gap-3">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex items-start gap-3.5">
                      <MedicineCapsuleIcon name={medicine.name} />
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-bold text-ink">{medicine.name}</h3>
                          <span className="rounded-full bg-sage-soft px-2.5 py-0.5 text-xs font-bold text-forest">
                            Active
                          </span>
                        </div>
                        <p className="text-sm font-semibold text-muted">{medicine.dosage}</p>
                        {medicine.instructions && (
                          <p className="mt-0.5 text-xs text-muted">{medicine.instructions}</p>
                        )}
                      </div>
                    </div>

                    {canManage && (
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          href={`/patients/${patientId}/medicines/${medicine.id}/change`}
                          className="inline-flex min-h-9 items-center justify-center rounded-full border border-forest/20 bg-sage-soft px-3.5 text-xs font-semibold text-forest hover:bg-sage"
                        >
                          {strings.medicines.change}
                        </Link>
                        <StopMedicineButton medicationId={medicine.id} />
                      </div>
                    )}
                  </div>

                  <div className="rounded-xl bg-surface/50 p-3 border border-line/60">
                    <span className="text-xs font-bold uppercase tracking-wider text-muted">
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

                  {(medicine.document_id || medicine.replaces_id) && (
                    <div className="flex flex-wrap items-center gap-3 border-t border-line/60 pt-2 text-xs text-muted">
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
                </Card>
              );
            })}
          </div>
        )}
      </section>

      {stoppedMedications.length > 0 && (
        <details className="group rounded-2xl border border-line bg-white p-4">
          <summary className="cursor-pointer text-base font-bold text-ink">
            {strings.medicines.stopped} ({stoppedMedications.length})
          </summary>
          <div className="mt-4 flex flex-col gap-3">
            {stoppedMedications.map((medicine) => (
              <div
                key={medicine.id}
                data-medicine-stopped={medicine.name}
                className="flex items-start justify-between rounded-xl border border-line bg-surface/30 p-3"
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
                  Stopped
                </span>
              </div>
            ))}
          </div>
        </details>
      )}

      {activeMedications.length > 0 && (
        <div className="flex items-center gap-3 rounded-2xl bg-sage-light p-4 border border-line text-forest">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sage text-forest font-bold text-sm">
            i
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold text-ink">
              {activeMedications.length} active medications
            </span>
            <span className="text-xs text-muted">Keep taking them regularly as prescribed</span>
          </div>
        </div>
      )}
    </div>
  );
}
