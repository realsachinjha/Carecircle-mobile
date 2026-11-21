import { redirect } from "next/navigation";
import { AppHeader } from "@/components/app-header";
import { Disclaimer } from "@/components/disclaimer";
import { HomeScreenTip } from "@/components/patient/home-screen-tip";
import { PatientToday } from "@/components/patient/patient-today";
import { Card } from "@/components/ui/card";
import { requirePageUser } from "@/lib/auth/session";
import type { Dose } from "@/lib/doses/view";
import { dateInZone, timeInZone } from "@/lib/time/local-date";
import { strings } from "@/strings/en";

export default async function PatientHomePage() {
  const { supabase, user } = await requirePageUser("/me");
  const { data: link } = await supabase
    .from("patient_links")
    .select("patient_id, patients(full_name, timezone)")
    .eq("user_id", user.id)
    .maybeSingle();

  const patientRaw = link?.patients;
  const patient = (Array.isArray(patientRaw) ? patientRaw[0] : patientRaw) as
    | { full_name: string; timezone: string }
    | undefined
    | null;

  if (!link || !patient) {
    redirect("/patients");
  }

  const [dosesRes, checkupsRes] = await Promise.all([
    supabase.rpc("doses_for_day", { p_patient: link.patient_id }),
    supabase
      .from("checkup_schedules")
      .select("id, checkup_type, doctor_name, appointment_time, checkup_completions(id)")
      .eq("patient_id", link.patient_id)
      .gt("appointment_time", new Date().toISOString())
      .order("appointment_time")
      .limit(5),
  ]);

  const doses = dosesRes.data;
  const nextCheckup = checkupsRes.data?.find((c) => {
    const comp = c.checkup_completions;
    return Array.isArray(comp) ? comp.length === 0 : !comp;
  });

  return (
    <>
      <AppHeader showCaregiverNav={false} />
      <main className="mx-auto flex max-w-xl flex-col gap-6 p-4 text-xl">
        <HomeScreenTip />
        <PatientToday
          patientId={link.patient_id}
          patientName={patient.full_name}
          timeZone={patient.timezone}
          initialDoses={(doses ?? []) as unknown as Dose[]}
        />
        {nextCheckup ? (
          <Card title={strings.dashboard.nextCheckup}>
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="font-bold">{nextCheckup.doctor_name}</span>
                <span className="rounded bg-panel px-2 py-1 text-sm font-semibold">
                  {nextCheckup.checkup_type in strings.checkups.types
                    ? strings.checkups.types[
                        nextCheckup.checkup_type as keyof typeof strings.checkups.types
                      ]
                    : nextCheckup.checkup_type}
                </span>
              </div>
              <div className="text-base text-muted">
                {dateInZone(nextCheckup.appointment_time, patient.timezone)} at{" "}
                {timeInZone(nextCheckup.appointment_time, patient.timezone)}
              </div>
            </div>
          </Card>
        ) : null}
        <footer className="border-t border-line pt-4">
          <Disclaimer variant="footer" />
        </footer>
      </main>
    </>
  );
}
