import { notFound } from "next/navigation";
import { PatientForm } from "@/components/patient-form";
import { loadPatientContext } from "@/lib/patients/context";
import type { PatientFields } from "@/lib/patients/schema";
import { strings } from "@/strings/en";

export default async function EditPatientPage({
  params,
}: {
  params: Promise<{ patientId: string }>;
}) {
  const { patientId } = await params;
  const { patient, role } = await loadPatientContext(patientId, `/patients/${patientId}/edit`);
  if (role !== "OWNER" && role !== "CAREGIVER") {
    notFound();
  }

  const initial: Partial<PatientFields> = {
    fullName: patient.full_name,
    dateOfBirth: patient.date_of_birth,
    timezone: patient.timezone,
    missedAfterMinutes: patient.missed_after_minutes,
    bloodGroup: (patient.blood_group as PatientFields["bloodGroup"]) ?? null,
    primaryCondition: patient.primary_condition ?? undefined,
    notes: patient.notes ?? undefined,
    emergencyContactName: patient.emergency_contact_name ?? undefined,
    emergencyContactPhone: patient.emergency_contact_phone ?? undefined,
    physicianName: patient.physician_name ?? undefined,
    physicianPhone: patient.physician_phone ?? undefined,
  };

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-2xl font-semibold">{strings.patients.editTitle}</h2>
      <PatientForm mode="edit" patientId={patientId} initial={initial} />
    </div>
  );
}
