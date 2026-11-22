import { notFound } from "next/navigation";
import { ApprovalEditor } from "@/components/medicines/approval-editor";
import { DeleteDocumentButton } from "@/components/documents/delete-document-button";
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
import { todayInZone } from "@/lib/time/local-date";
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
    <div className="flex flex-col gap-6">
      {(status === "PARSED" || status === "VERIFIED") && (
        <div className="flex items-center gap-4 rounded-2xl border border-line bg-white p-4 shadow-[0_2px_12px_-4px_rgba(24,56,45,0.06)]">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-sage text-forest">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
            </svg>
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-bold text-ink">Prescription Detected</span>
            <span className="text-xs text-muted">Please review and confirm the details below.</span>
          </div>
        </div>
      )}

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
          {context.role === "OWNER" && (
            <DeleteDocumentButton patientId={patientId} documentId={documentId} />
          )}
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
            <div className="rounded-xl border border-danger/40 bg-peach-light p-4 text-sm font-semibold text-danger">
              {strings.errors[
                doc.extraction_error as keyof typeof strings.errors
              ] ?? doc.extraction_error}
            </div>
          )}

          {parsedResult && parsedResult.success && (
            canEdit && status === "PARSED" ? (
              <ApprovalEditor
                documentId={documentId}
                patientId={patientId}
                extraction={parsedResult.data}
                today={todayInZone(context.patient.timezone)}
                demoMode={getEnv().demoMode}
              />
            ) : (
              <ExtractionTable
                extraction={parsedResult.data}
                demoMode={getEnv().demoMode}
              />
            )
          )}
        </div>
      </div>
    </div>
  );
}
