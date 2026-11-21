import { notFound } from "next/navigation";
import { loadPatientContext } from "@/lib/auth/session";
import { todayInZone } from "@/lib/time/local-date";
import { newScheduleDraft, type MedicineDraft, type FrequencyType } from "@/lib/medicines/defaults";
import type { Slot } from "@/lib/gemini/schema";
import { strings } from "@/strings/en";
import { ChangeMedicineForm } from "./change-medicine-form";

type PageProps = {
  params: Promise<{ patientId: string; medicationId: string }>;
};

type ScheduleRow = {
  slot: Slot;
  target_time: string;
  frequency_type: FrequencyType;
  weekdays: number[] | null;
  interval_days: number | null;
  start_date: string | null;
  end_date: string | null;
};

export default async function ChangeMedicinePage({ params }: PageProps) {
  const { patientId, medicationId } = await params;
  const context = await loadPatientContext(patientId);
  if (!context || (context.role !== "OWNER" && context.role !== "CAREGIVER")) {
    notFound();
  }

  const { data: medication } = await context.supabase
    .from("medications")
    .select(
      "id, name, dosage, instructions, status, medication_schedules(slot, target_time, frequency_type, weekdays, interval_days, start_date, end_date)"
    )
    .eq("id", medicationId)
    .eq("patient_id", patientId)
    .maybeSingle();

  if (!medication || medication.status !== "ACTIVE") {
    notFound();
  }

  const today = todayInZone(context.patient.timezone);
  const schedules = (medication.medication_schedules ?? []) as ScheduleRow[];

  const initialDraft: MedicineDraft = {
    name: medication.name,
    dosage: medication.dosage,
    instructions: medication.instructions ?? "",
    schedules:
      schedules.length > 0
        ? schedules.map((s) => ({
            slot: s.slot,
            target_time: s.target_time.slice(0, 5),
            frequency_type: s.frequency_type,
            weekdays: s.weekdays ?? [],
            interval_days: s.interval_days ?? 2,
            start_date: today,
            end_date: s.end_date && s.end_date >= today ? s.end_date : "",
          }))
        : [newScheduleDraft("MORNING", today)],
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold">{strings.medicines.changeTitle}</h1>
        <p className="text-base text-muted">{strings.medicines.changeIntro}</p>
      </div>
      <ChangeMedicineForm
        patientId={patientId}
        medicationId={medicationId}
        initialDraft={initialDraft}
        today={today}
      />
    </div>
  );
}
