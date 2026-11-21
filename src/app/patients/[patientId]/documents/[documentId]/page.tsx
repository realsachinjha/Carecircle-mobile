import { notFound } from "next/navigation";
import { DocumentDetailsForm } from "@/components/documents/document-details-form";
import { DocumentPreview } from "@/components/documents/document-preview";
import { ExtractionTable } from "@/components/documents/extraction-table";
import { ParseButton } from "@/components/documents/parse-button";
import { StatusBadge, type DocumentStatus } from "@/components/documents/status-badge";
import { loadPatientContext } from "@/lib/auth/session";
import { type DocumentType } from "@/lib/documents/constants";
import { getEnv } from "@/lib/env";
import { extractionSchema } from "@/lib/gemini/schema";
import { isUuid } from "@/lib/ids";
import { strings } from "@/strings/en";

type PageProps = {
  params: Promise<{ patientId: string; documentId: string }>;
};

export default async function DocumentDetailPage({ params }: PageProps) {
  const { patientId, documentId } = await params;
  if (!isUuid(documentId)) {
    notFound();
  }

  const context = await loadPatientContext(patientId);
  if (!context || context.role === "PATIENT") {
    notFound();
  }

  const { data: doc } = await context.supabase
    .from("medical_documents")
    .select("*")
    .eq("id", documentId)
    .eq("patient_id", patientId)
    .is("deleted_at", null)
    .maybeSingle();

  if (!doc) {
    notFound();
  }

  const canEdit = context.role === "OWNER" || context.role === "CAREGIVER";
  const status = doc.extraction_status as DocumentStatus;
  const parsedResult =
    (status === "PARSED" || status === "VERIFIED") && doc.extraction_raw
      ? extractionSchema.safeParse(doc.extraction_raw)
      : null;

  return (
    <div className="flex flex-col gap-6 lg:grid lg:grid-cols-2 lg:gap-6">
      <div className="flex flex-col gap-6">
        <DocumentPreview documentId={documentId} mimeType={doc.mime_type} />
        <DocumentDetailsForm
          documentId={documentId}
          initialType={doc.document_type as DocumentType}
          initialDoctor={doc.doctor_name}
          initialClinic={doc.clinic_name}
          initialIssueDate={doc.issue_date}
          canEdit={canEdit}
        />
      </div>

      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">{strings.documents.statuses[status]}</h2>
          <StatusBadge status={status} />
        </div>

        {canEdit && (status === "PENDING" || status === "FAILED") && (
          <ParseButton documentId={documentId} status={status} />
        )}

        {status === "FAILED" && doc.extraction_error && (
          <div className="rounded-lg border border-danger p-4 text-base text-danger">
            {strings.errors[
              doc.extraction_error as keyof typeof strings.errors
            ] ?? doc.extraction_error}
          </div>
        )}

        {parsedResult && parsedResult.success && (
          <ExtractionTable
            extraction={parsedResult.data}
            demoMode={getEnv().demoMode}
          />
        )}
      </div>
    </div>
  );
}
