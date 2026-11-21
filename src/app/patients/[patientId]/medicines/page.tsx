import Link from "next/link";
import { notFound } from "next/navigation";
import { loadPatientContext } from "@/lib/auth/session";
import { describeSchedule } from "@/lib/medicines/describe";
import { StopMedicineButton } from "@/components/medicines/medicine-actions";
import { buttonClass } from "@/components/ui/button";
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
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">{strings.medicines.title}</h1>
        {canManage && (
          <Link
            href={`/patients/${patientId}/medicines/new`}
            className={buttonClass({ variant: "primary" })}
          >
            {strings.medicines.add}
          </Link>
        )}
      </div>

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold">{strings.medicines.active}</h2>
        {activeMedications.length === 0 ? (
          <Card>
            <p className="text-base text-muted">{strings.medicines.empty}</p>
          </Card>
        ) : (
          <div className="flex flex-col gap-4">
            {activeMedications.map((medicine) => {
              const sortedSchedules = [...(medicine.medication_schedules ?? [])].sort(
                (a, b) => a.target_time.localeCompare(b.target_time)
              );

              return (
                <Card key={medicine.id} data-medicine={medicine.name} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h3 className="text-lg font-bold">{medicine.name}</h3>
                      <p className="text-base text-ink font-medium">{medicine.dosage}</p>
                      {medicine.instructions && (
                        <p className="mt-1 text-base text-muted">{medicine.instructions}</p>
                      )}
                    </div>
                    {canManage && (
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/patients/${patientId}/medicines/${medicine.id}/change`}
                          className={buttonClass({ variant: "secondary", className: "min-h-10 text-base" })}
                        >
                          {strings.medicines.change}
                        </Link>
                        <StopMedicineButton medicationId={medicine.id} />
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-1 border-t border-border pt-3">
                    <span className="text-sm font-semibold text-muted">
                      {strings.medicines.schedules}
                    </span>
                    <ul className="flex flex-col gap-1">
                      {sortedSchedules.map((schedule, idx) => (
                        <li key={idx} className="text-base text-ink">
                          {describeSchedule(schedule)}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {(medicine.document_id || medicine.replaces_id) && (
                    <div className="flex flex-wrap items-center gap-3 border-t border-border pt-2 text-sm text-muted">
                      {medicine.document_id && (
                        <Link
                          href={`/patients/${patientId}/documents/${medicine.document_id}`}
                          className="text-accent underline"
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
        <details className="group rounded-lg border border-border bg-paper p-4">
          <summary className="cursor-pointer text-lg font-semibold text-ink">
            {strings.medicines.stopped} ({stoppedMedications.length})
          </summary>
          <div className="mt-4 flex flex-col gap-3">
            {stoppedMedications.map((medicine) => {
              const stoppedDate = medicine.stopped_at
                ? new Date(medicine.stopped_at).toLocaleDateString()
                : "";

              return (
                <div
                  key={medicine.id}
                  data-medicine-stopped={medicine.name}
                  className="rounded-md border border-border bg-card p-3"
                >
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h4 className="text-base font-semibold">{medicine.name}</h4>
                      <p className="text-sm text-muted">{medicine.dosage}</p>
                    </div>
                    {stoppedDate && (
                      <span className="text-sm text-muted">
                        {strings.medicines.stoppedOn} {stoppedDate}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </details>
      )}
    </div>
  );
}
