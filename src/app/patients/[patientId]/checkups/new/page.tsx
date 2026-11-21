import { notFound } from "next/navigation";
import { CheckupForm } from "@/components/checkups/checkup-form";
import { Card } from "@/components/ui/card";
import { loadPatientContext } from "@/lib/patients/context";
import { strings } from "@/strings/en";

export default async function NewCheckupPage({
  params,
}: {
  params: Promise<{ patientId: string }>;
}) {
  const { patientId } = await params;
  const { patient, role } = await loadPatientContext(
    patientId,
    `/patients/${patientId}/checkups/new`,
  );

  if (role !== "OWNER" && role !== "CAREGIVER") {
    notFound();
  }

  return (
    <div className="flex flex-col gap-6">
      <Card title={strings.checkups.addTitle}>
        <CheckupForm mode="create" patientId={patientId} timeZone={patient.timezone} />
      </Card>
    </div>
  );
}
