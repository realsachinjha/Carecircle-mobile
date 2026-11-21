import { AppHeader } from "@/components/app-header";
import { PatientForm } from "@/components/patient-form";
import { requirePageUser } from "@/lib/auth/session";
import { strings } from "@/strings/en";

export default async function NewPatientPage() {
  await requirePageUser("/patients/new");
  return (
    <>
      <AppHeader />
      <main className="mx-auto flex max-w-xl flex-col gap-6 p-4">
        <h1 className="text-3xl font-semibold">{strings.patients.newTitle}</h1>
        <PatientForm mode="create" />
      </main>
    </>
  );
}
