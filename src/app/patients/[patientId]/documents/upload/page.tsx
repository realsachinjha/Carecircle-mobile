import { notFound, redirect } from "next/navigation";
import { UploadForm } from "./upload-form";
import { loadPatientContext } from "@/lib/auth/session";
import { strings } from "@/strings/en";

type PageProps = {
  params: Promise<{ patientId: string }>;
};

export default async function UploadDocumentPage({ params }: PageProps) {
  const { patientId } = await params;
  const context = await loadPatientContext(patientId);
  if (!context || (context.role !== "OWNER" && context.role !== "CAREGIVER")) {
    notFound();
  }

  const { data: consent } = await context.supabase
    .from("consents")
    .select("id")
    .eq("patient_id", patientId)
    .is("withdrawn_at", null)
    .maybeSingle();

  if (!consent) {
    redirect(`/patients/${patientId}/documents`);
  }

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-6">
      <h1 className="text-2xl font-bold">{strings.documents.uploadTitle}</h1>
      <UploadForm patientId={patientId} />
    </div>
  );
}
