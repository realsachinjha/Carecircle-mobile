import { notFound } from "next/navigation";
import { loadPatientContext } from "@/lib/auth/session";
import { todayInZone } from "@/lib/time/local-date";
import { strings } from "@/strings/en";
import { NewMedicineForm } from "./new-medicine-form";

type PageProps = {
  params: Promise<{ patientId: string }>;
};

export default async function NewMedicinePage({ params }: PageProps) {
  const { patientId } = await params;
  const context = await loadPatientContext(patientId);
  if (!context || (context.role !== "OWNER" && context.role !== "CAREGIVER")) {
    notFound();
  }

  const today = todayInZone(context.patient.timezone);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">{strings.medicines.addTitle}</h1>
      <NewMedicineForm patientId={patientId} today={today} />
    </div>
  );
}
