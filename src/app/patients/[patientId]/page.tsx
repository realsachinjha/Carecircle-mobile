import Link from "next/link";
import { Card } from "@/components/ui/card";
import { loadPatientContext } from "@/lib/patients/context";
import { strings } from "@/strings/en";

function calculateAge(dateOfBirth: string): number {
  const birth = new Date(dateOfBirth);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

export default async function PatientOverviewPage({
  params,
}: {
  params: Promise<{ patientId: string }>;
}) {
  const { patientId } = await params;
  const { patient, role } = await loadPatientContext(patientId, `/patients/${patientId}`);
  const age = calculateAge(patient.date_of_birth);
  const canEdit = role === "OWNER" || role === "CAREGIVER";

  const fields = [
    { label: strings.patients.fields.fullName, value: patient.full_name },
    {
      label: strings.patients.fields.dateOfBirth,
      value: `${patient.date_of_birth} (${age} years)`,
    },
    { label: strings.patients.fields.timezone, value: patient.timezone },
    {
      label: strings.patients.fields.missedAfterMinutes,
      value: String(patient.missed_after_minutes),
    },
    {
      label: strings.patients.fields.bloodGroup,
      value: patient.blood_group ?? strings.patients.notSet,
    },
    {
      label: strings.patients.fields.primaryCondition,
      value: patient.primary_condition ?? strings.patients.notSet,
    },
    { label: strings.patients.fields.notes, value: patient.notes ?? strings.patients.notSet },
    {
      label: strings.patients.fields.emergencyContactName,
      value: patient.emergency_contact_name ?? strings.patients.notSet,
    },
    {
      label: strings.patients.fields.emergencyContactPhone,
      value: patient.emergency_contact_phone ?? strings.patients.notSet,
    },
    {
      label: strings.patients.fields.physicianName,
      value: patient.physician_name ?? strings.patients.notSet,
    },
    {
      label: strings.patients.fields.physicianPhone,
      value: patient.physician_phone ?? strings.patients.notSet,
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <Card title={strings.patients.editTitle}>
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {fields.map(({ label, value }) => (
            <div key={label} className="flex flex-col">
              <dt className="text-base text-muted">{label}</dt>
              <dd className="text-lg font-medium">{value}</dd>
            </div>
          ))}
        </dl>
        {canEdit ? (
          <div className="mt-4">
            <Link
              href={`/patients/${patientId}/edit`}
              className="inline-flex min-h-12 items-center justify-center rounded-lg border-2 border-accent bg-paper px-5 text-lg font-semibold text-accent"
            >
              {strings.common.edit}
            </Link>
          </div>
        ) : null}
      </Card>
    </div>
  );
}
