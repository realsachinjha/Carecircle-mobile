import { AppHeader } from "@/components/app-header";
import { BottomNav } from "@/components/navigation/bottom-nav";
import { PatientForm } from "@/components/patient-form";
import { requirePageUser } from "@/lib/auth/session";
import { strings } from "@/strings/en";

export default async function NewPatientPage() {
  await requirePageUser("/patients/new");
  return (
    <div className="min-h-screen bg-ivory text-ink pb-24">
      <AppHeader />
      <main className="mx-auto flex max-w-xl flex-col gap-6 p-4">
        <div className="rounded-2xl bg-forest-deep px-5 py-4 text-white shadow-sm">
          <h1 className="text-2xl font-bold tracking-tight">{strings.patients.newTitle}</h1>
        </div>
        <PatientForm mode="create" />
      </main>
      <BottomNav />
    </div>
  );
}
