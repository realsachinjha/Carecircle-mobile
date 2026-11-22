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

export const dynamic = "force-dynamic";

export default async function PatientOverviewPage({
  params,
}: {
  params: Promise<{ patientId: string }>;
}) {
  const { patientId } = await params;
  const { supabase, patient, role } = await loadPatientContext(patientId, `/patients/${patientId}`);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [complianceRes, dosesRes, missedRemindersRes, docsRes, checkupsRes, recentLogsRes] = await Promise.all([
    supabase.rpc("compliance", { p_patient: patientId, p_days: 7 }),
    supabase.rpc("doses_for_day", { p_patient: patientId }),
    supabase
      .from("medication_reminders")
      .select("id, scheduled_for, status, medication_schedules(slot, medications(name, dosage, instructions))")
      .eq("patient_id", patientId)
      .eq("status", "MISSED"),
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

  type Slot = "MORNING" | "AFTERNOON" | "EVENING" | "BEDTIME";

  type RawMissedReminder = {
    id: string;
    scheduled_for: string;
    status: string;
    medication_schedules: {
      slot: Slot;
      medications: {
        name: string;
        dosage: string;
        instructions: string | null;
      } | null;
    } | null;
  };

  const rawMissed = (missedRemindersRes.data as unknown as RawMissedReminder[]) ?? [];
  const missedFromTable: Dose[] = rawMissed.map((r) => ({
    reminder_id: r.id,
    scheduled_for: r.scheduled_for,
    status: "MISSED" as const,
    acknowledged_at: null,
    slot: r.medication_schedules?.slot ?? "MORNING",
    medication_name: r.medication_schedules?.medications?.name ?? "Medicine",
    dosage: r.medication_schedules?.medications?.dosage ?? "",
    instructions: r.medication_schedules?.medications?.instructions ?? null,
  }));

  const allMissedMap = new Map<string, Dose>();
  for (const d of missedDoses) {
    allMissedMap.set(d.reminder_id, d);
  }
  for (const d of missedFromTable) {
    allMissedMap.set(d.reminder_id, d);
  }
  const combinedMissed = Array.from(allMissedMap.values());

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
  ) ?? doses.find((d) => d.status === "PENDING");

  const totalDosesToday = doses.length;
  const takenDosesToday = doses.filter((d) => d.status === "ACKNOWLEDGED").length;
  const progressPercent = totalDosesToday > 0 ? Math.round((takenDosesToday / totalDosesToday) * 100) : 0;

  const rawName = user?.user_metadata?.full_name ?? user?.email?.split("@")[0] ?? "";
  const firstName = rawName ? rawName.charAt(0).toUpperCase() + rawName.slice(1) : "";
  const greeting = firstName
    ? `${strings.dashboard.goodMorning}, ${firstName}`
    : strings.dashboard.goodMorning;

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
    <div className="flex flex-col gap-5">
      <div className="flex items-start justify-between">
        <div className="flex flex-col">
          <h2 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            {greeting}
          </h2>
          <p className="mt-0.5 text-xs font-medium text-muted sm:text-sm">
            {strings.dashboard.tagline}
          </p>
        </div>
        <LiveRefresh patientId={patientId} />
      </div>

      {upcomingDose ? (
        <div className="flex flex-col rounded-3xl border border-sage/60 bg-sage-soft p-5 shadow-xs">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted">
            {strings.dashboard.nextMedication}
          </span>
          <span className="my-1 text-3xl font-extrabold tracking-tight text-ink">
            {timeInZone(upcomingDose.scheduled_for, patient.timezone)}
          </span>
          <span className="text-base font-semibold text-ink">
            {upcomingDose.medication_name}
          </span>
          <Link
            href={`/patients/${patientId}/medicines`}
            className="mt-4 flex min-h-11 items-center justify-center rounded-full bg-white/85 px-4 text-sm font-semibold text-forest shadow-2xs transition-colors hover:bg-white"
          >
            {strings.dashboard.viewDetails}
          </Link>
        </div>
      ) : (
        <div className="flex flex-col rounded-3xl border border-sage/40 bg-sage-soft/70 p-5 shadow-xs">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted">
            {strings.dashboard.nextMedication}
          </span>
          <p className="mt-2 text-sm font-medium text-muted">
            {strings.dashboard.noUpcomingMedicine}
          </p>
          <Link
            href={`/patients/${patientId}/medicines`}
            className="mt-3 flex min-h-11 items-center justify-center rounded-full bg-white/85 px-4 text-sm font-semibold text-forest shadow-2xs transition-colors hover:bg-white"
          >
            {strings.dashboard.viewDetails}
          </Link>
        </div>
      )}

      <div className="flex flex-col rounded-2xl border border-line-soft bg-white p-4 shadow-xs">
        <div className="flex items-center justify-between text-sm font-semibold text-ink">
          <span>{strings.dashboard.todayReported}</span>
          <span className="text-xs font-semibold text-muted">
            {totalDosesToday > 0
              ? `${takenDosesToday} of ${totalDosesToday}`
              : strings.dashboard.noDosesYet}
          </span>
        </div>
        <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-line-soft">
          <div
            className="h-full rounded-full bg-forest transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      <div className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-base font-bold text-ink">
            {strings.dashboard.upcoming}
          </h3>
          <Link
            href={`/patients/${patientId}/checkups`}
            className="flex items-center gap-1 text-xs font-semibold text-forest hover:underline"
          >
            <span>{strings.dashboard.seeAll}</span>
            <span aria-hidden="true">&rarr;</span>
          </Link>
        </div>

        {nextCheckup ? (
          <div className="flex items-center justify-between rounded-2xl border border-line-soft bg-white p-4 shadow-xs">
            <div className="flex items-center gap-3.5">
              <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl bg-sage-soft text-forest font-bold">
                <span className="text-[10px] uppercase tracking-wider">
                  {dateInZone(nextCheckup.appointment_time, patient.timezone).split(" ")[1] ?? "Date"}
                </span>
                <span className="text-base font-extrabold leading-none">
                  {dateInZone(nextCheckup.appointment_time, patient.timezone).split(" ")[0] ?? ""}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-ink">
                  {nextCheckup.doctor_name}
                </span>
                <span className="text-xs text-muted">
                  {timeInZone(nextCheckup.appointment_time, patient.timezone)} •{" "}
                  {nextCheckup.checkup_type in strings.checkups.types
                    ? strings.checkups.types[nextCheckup.checkup_type as keyof typeof strings.checkups.types]
                    : nextCheckup.checkup_type}
                </span>
              </div>
            </div>
            <Link
              href={`/patients/${patientId}/checkups`}
              className="text-muted hover:text-forest"
              aria-label={strings.dashboard.seeAll}
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
              </svg>
            </Link>
          </div>
        ) : (
          <div className="rounded-2xl border border-line-soft bg-white p-4 shadow-xs">
            <p className="text-xs font-medium text-muted">{strings.dashboard.noCheckup}</p>
          </div>
        )}
      </div>

      <ComplianceCard compliance={compliance} timeZone={patient.timezone} />

      <AttentionCard
        missed={combinedMissed}
        documentsToCheck={docsToCheck}
        documentsFailed={docsFailed}
        patientId={patientId}
        timeZone={patient.timezone}
      />

      <TodayDosesCard doses={doses} timeZone={patient.timezone} />

      <Card title={strings.activity.title}>
        <div className="-mt-2 flex items-center justify-between">
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
          <ul className="flex flex-col divide-y divide-line-soft">
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
              <dd className="mt-0.5 text-base font-semibold text-ink">{value}</dd>
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
