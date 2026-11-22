import Link from "next/link";
import { redirect } from "next/navigation";
import { AppHeader } from "@/components/app-header";
import { BottomNav } from "@/components/navigation/bottom-nav";
import { PatientHeaderBanner } from "@/components/patient/patient-header-banner";
import { loadPatientContext } from "@/lib/patients/context";
import { tabsFor } from "@/lib/patients/tabs";

export default async function PatientLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ patientId: string }>;
}) {
  const { patientId } = await params;
  const { patient, role } = await loadPatientContext(patientId, `/patients/${patientId}`);
  if (role === "PATIENT") {
    redirect("/me");
  }
  return (
    <div className="min-h-screen bg-ivory text-ink pb-24">
      <AppHeader />
      <div className="mx-auto flex max-w-4xl flex-col gap-4 p-4">
        <PatientHeaderBanner patient={patient} role={role} />
        <nav aria-label={patient.full_name} className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {tabsFor(role).map((tab) => (
            <Link
              key={tab.label}
              href={tab.href(patientId)}
              className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-full border border-line bg-white px-4 py-2 text-sm font-semibold text-ink shadow-xs transition-colors hover:border-forest/30 hover:bg-sage-soft"
            >
              {tab.label}
            </Link>
          ))}
        </nav>
        {children}
      </div>
      <BottomNav patientId={patientId} />
    </div>
  );
}
