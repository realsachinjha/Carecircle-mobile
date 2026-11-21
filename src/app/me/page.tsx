import { redirect } from "next/navigation";
import { AppHeader } from "@/components/app-header";
import { Disclaimer } from "@/components/disclaimer";
import { HomeScreenTip } from "@/components/patient/home-screen-tip";
import { PatientToday } from "@/components/patient/patient-today";
import { requirePageUser } from "@/lib/auth/session";
import type { Dose } from "@/lib/doses/view";

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

  const { data: doses } = await supabase.rpc("doses_for_day", { p_patient: link.patient_id });

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
        <footer className="border-t border-line pt-4">
          <Disclaimer variant="footer" />
        </footer>
      </main>
    </>
  );
}
