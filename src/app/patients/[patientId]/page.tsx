import Link from "next/link";
import { AttentionCard } from "@/components/dashboard/attention-card";
import { ComplianceCard } from "@/components/dashboard/compliance-card";
import { LiveRefresh } from "@/components/dashboard/live-refresh";
import { TodayDosesCard } from "@/components/dashboard/today-doses-card";
import { Card } from "@/components/ui/card";
import type { Compliance } from "@/lib/dashboard/compliance";
import type { Dose } from "@/lib/doses/view";
import { loadPatientContext } from "@/lib/patients/context";
import { dateInZone, timeInZone } from "@/lib/time/local-date";
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
  const { supabase, patient, role } = await loadPatientContext(patientId, `/patients/${patientId}`);

  const [complianceRes, dosesRes, docsRes, checkupsRes] = await Promise.all([
    supabase.rpc("compliance", { p_patient: patientId, p_days: 7 }),
    supabase.rpc("doses_for_day", { p_patient: patientId }),
    supabase
      .from("medical_documents")
      .select("id, document_type, created_at, extraction_status")
      .eq("patient_id", patientId)
      .in("extraction_status", ["PARSED", "FAILED"]),
    supabase
      .from("checkup_schedules")
      .select("id, doctor_name, appointment_time, checkup_type, checkup_completions(id)")
      .eq("patient_id", patientId)
      .gt("appointment_time", new Date().toISOString())
      .order("appointment_time")
      .limit(5),
  ]);

  const compliance = (complianceRes.data as unknown as Compliance) ?? {
    days: [],
    totals: { taken: 0, skipped: 0, missed: 0, pending: 0 },
  };
  const doses = (dosesRes.data as unknown as Dose[]) ?? [];
  const missedDoses = doses.filter((d) => d.status === "MISSED");

  const docs = docsRes.data ?? [];
  const docsToCheck = docs.filter((d) => d.extraction_status === "PARSED");
  const docsFailed = docs.filter((d) => d.extraction_status === "FAILED");

  const nextCheckup = checkupsRes.data?.find((c) => {
    const comps = c.checkup_completions;
    return Array.isArray(comps) ? comps.length === 0 : !comps;
  });

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
      <div className="flex justify-end">
        <LiveRefresh patientId={patientId} />
      </div>

      <ComplianceCard compliance={compliance} timeZone={patient.timezone} />

      <AttentionCard
        missed={missedDoses}
        documentsToCheck={docsToCheck}
        documentsFailed={docsFailed}
        patientId={patientId}
        timeZone={patient.timezone}
      />

      <TodayDosesCard doses={doses} timeZone={patient.timezone} />

      <Card title={strings.dashboard.nextCheckup}>
        {nextCheckup ? (
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-lg">{nextCheckup.doctor_name}</span>
              <span className="rounded bg-panel px-2 py-1 text-xs font-semibold">
                {nextCheckup.checkup_type in strings.checkups.types
                  ? strings.checkups.types[nextCheckup.checkup_type as keyof typeof strings.checkups.types]
                  : nextCheckup.checkup_type}
              </span>
            </div>
            <div className="text-sm text-muted">
              {dateInZone(nextCheckup.appointment_time, patient.timezone)} at{" "}
              {timeInZone(nextCheckup.appointment_time, patient.timezone)}
            </div>
          </div>
        ) : (
          <p className="text-muted">{strings.dashboard.noCheckup}</p>
        )}
      </Card>

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
