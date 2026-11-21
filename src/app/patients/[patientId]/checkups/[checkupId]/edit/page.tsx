import { notFound } from "next/navigation";
import { CheckupForm } from "@/components/checkups/checkup-form";
import { Card } from "@/components/ui/card";
import { CHECKUP_TYPES } from "@/lib/checkups/schema";
import { loadPatientContext } from "@/lib/patients/context";
import { toLocalInputValue } from "@/lib/time/local-input";
import { strings } from "@/strings/en";

export default async function EditCheckupPage({
  params,
}: {
  params: Promise<{ patientId: string; checkupId: string }>;
}) {
  const { patientId, checkupId } = await params;
  const { supabase, patient, role } = await loadPatientContext(
    patientId,
    `/patients/${patientId}/checkups/${checkupId}/edit`,
  );

  if (role !== "OWNER" && role !== "CAREGIVER") {
    notFound();
  }

  const { data: checkup } = await supabase
    .from("checkup_schedules")
    .select("*")
    .eq("id", checkupId)
    .eq("patient_id", patientId)
    .single();

  if (!checkup) {
    notFound();
  }

  const checkupType = CHECKUP_TYPES.includes(checkup.checkup_type as (typeof CHECKUP_TYPES)[number])
    ? (checkup.checkup_type as (typeof CHECKUP_TYPES)[number])
    : "CONSULTATION";

  return (
    <div className="flex flex-col gap-6">
      <Card title={strings.checkups.editTitle}>
        <CheckupForm
          mode="edit"
          patientId={patientId}
          checkupId={checkupId}
          timeZone={patient.timezone}
          initial={{
            checkupType,
            doctorName: checkup.doctor_name,
            clinicLocation: checkup.clinic_location,
            localTime: toLocalInputValue(checkup.appointment_time, patient.timezone),
            reminderHoursBefore: checkup.reminder_hours_before,
            notes: checkup.notes,
          }}
        />
      </Card>
    </div>
  );
}
