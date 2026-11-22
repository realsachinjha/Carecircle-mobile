import Link from "next/link";
import { AttentionCard } from "@/components/dashboard/attention-card";
import { ComplianceCard } from "@/components/dashboard/compliance-card";
import { LiveRefresh } from "@/components/dashboard/live-refresh";
import { TodayDosesCard } from "@/components/dashboard/today-doses-card";
import { Card } from "@/components/ui/card";
import { describeActivity } from "@/lib/activity/describe";
import type { Compliance } from "@/lib/dashboard/compliance";
import type { Dose } from "@/lib/doses/view";
import { formatPatientAge } from "@/lib/patients/age";
import { loadPatientContext } from "@/lib/patients/context";
import { dateInZone, timeInZone } from "@/lib/time/local-date";
import { strings } from "@/strings/en";

export default async function PatientOverviewPage({
  params,
}: {
  params: Promise<{ patientId: string }>;
}) {
  const { patientId } = await params;
  const { supabase, patient, role } = await loadPatientContext(patientId, `/patients/${patientId}`);

  const [complianceRes, dosesRes, docsRes, checkupsRes, recentLogsRes] = await Promise.all([
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
    supabase
      .from("audit_logs")
      .select("id, action, target_table, before, after, created_at, actor_id")
      .eq("patient_id", patientId)
      .order("created_at", { ascending: false })
      .limit(3),
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

  const recentLogs = recentLogsRes.data ?? [];
  const age = formatPatientAge(patient.date_of_birth);
  const canEdit = role === "OWNER" || role === "CAREGIVER";

  const nowMs = new Date().getTime();
  const upcomingDose = doses.find(
    (d) => d.status === "PENDING" && new Date(d.scheduled_for).getTime() >= nowMs
  );

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
      <div className="flex items-center justify-between rounded-2xl bg-forest-deep px-5 py-4 text-white shadow-sm">
        <div className="flex flex-col">
          <span className="text-xl font-bold tracking-tight">Good morning!</span>
          <span className="text-sm font-medium text-peach/90">Let&apos;s take care together 🧡</span>
        </div>
        <LiveRefresh patientId={patientId} />
      </div>

      {upcomingDose ? (
        <div className="flex items-center justify-between rounded-2xl border border-line bg-peach-light p-4 shadow-2xs">
          <div className="flex items-center gap-3.5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-peach text-terracotta">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold uppercase tracking-wider text-muted">Upcoming Medication</span>
              <span className="text-base font-bold text-ink">
                {upcomingDose.medication_name} · {timeInZone(upcomingDose.scheduled_for, patient.timezone)}
              </span>
            </div>
          </div>
          <Link
            href={`/patients/${patientId}/medicines`}
            aria-label="View upcoming medicines"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-muted shadow-2xs hover:text-forest"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
            </svg>
          </Link>
        </div>
      ) : null}

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
          <div className="flex flex-col gap-2 rounded-xl bg-surface/40 p-4 border border-line">
            <div className="flex items-center justify-between">
              <span className="font-bold text-lg text-ink">{nextCheckup.doctor_name}</span>
              <span className="rounded-full bg-sage px-3 py-0.5 text-xs font-semibold text-forest">
                {nextCheckup.checkup_type in strings.checkups.types
                  ? strings.checkups.types[nextCheckup.checkup_type as keyof typeof strings.checkups.types]
                  : nextCheckup.checkup_type}
              </span>
            </div>
            <div className="text-sm font-medium text-muted">
              {dateInZone(nextCheckup.appointment_time, patient.timezone)} at{" "}
              {timeInZone(nextCheckup.appointment_time, patient.timezone)}
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted">{strings.dashboard.noCheckup}</p>
        )}
      </Card>

      <Card title={strings.activity.title}>
        <div className="flex items-center justify-between -mt-2">
          <span className="text-xs text-muted">Recent updates</span>
          <Link
            href={`/patients/${patientId}/activity`}
            className="text-xs font-semibold text-forest hover:underline"
          >
            View All →
          </Link>
        </div>
        {recentLogs.length === 0 ? (
          <p className="text-sm text-muted">{strings.activity.empty}</p>
        ) : (
          <ul className="flex flex-col divide-y divide-line">
            {recentLogs.map((log) => (
              <li key={log.id} className="flex items-center gap-3 py-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sage-soft text-forest">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                  </svg>
                </div>
                <div className="flex flex-1 flex-col">
                  <span className="text-sm font-semibold text-ink">{describeActivity(log)}</span>
                  <span className="text-xs text-muted">
                    {dateInZone(log.created_at, patient.timezone)} at {timeInZone(log.created_at, patient.timezone)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card title={strings.patients.editTitle}>
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {fields.map(({ label, value }) => (
            <div key={label} className="flex flex-col">
              <dt className="text-xs font-semibold uppercase tracking-wider text-muted">{label}</dt>
              <dd className="text-base font-semibold text-ink mt-0.5">{value}</dd>
            </div>
          ))}
        </dl>
        {canEdit ? (
          <div className="mt-4 pt-2">
            <Link
              href={`/patients/${patientId}/edit`}
              className="inline-flex min-h-11 items-center justify-center rounded-full border border-forest/25 bg-sage-soft px-5 text-sm font-semibold text-forest transition-colors hover:bg-sage"
            >
              {strings.common.edit}
            </Link>
          </div>
        ) : null}
      </Card>
    </div>
  );
}
