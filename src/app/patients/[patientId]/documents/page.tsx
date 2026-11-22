import Link from "next/link";
import { notFound } from "next/navigation";
import { ConsentPanel } from "./consent-panel";
import { StatusBadge, type DocumentStatus } from "@/components/documents/status-badge";
import { Card } from "@/components/ui/card";
import { loadPatientContext } from "@/lib/auth/session";
import { strings } from "@/strings/en";

type PageProps = {
  params: Promise<{ patientId: string }>;
};

export default async function DocumentsPage({ params }: PageProps) {
  const { patientId } = await params;
  const context = await loadPatientContext(patientId);
  if (!context || context.role === "PATIENT") {
    notFound();
  }

  const { data: consent } = await context.supabase
    .from("consents")
    .select("id, given_at")
    .eq("patient_id", patientId)
    .is("withdrawn_at", null)
    .maybeSingle();

  const { data: documents } = await context.supabase
    .from("medical_documents")
    .select("id, document_type, doctor_name, issue_date, extraction_status, created_at")
    .eq("patient_id", patientId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  const canManage = context.role === "OWNER" || context.role === "CAREGIVER";
  const hasConsent = Boolean(consent);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between rounded-2xl bg-forest-deep px-5 py-4 text-white shadow-sm">
        <h1 className="text-2xl font-bold tracking-tight">{strings.documents.title}</h1>
        {canManage && hasConsent && (
          <Link
            href={`/patients/${patientId}/documents/upload`}
            className="inline-flex min-h-10 items-center justify-center rounded-full bg-terracotta px-4 py-1.5 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-terracotta-dark"
          >
            {strings.documents.upload}
          </Link>
        )}
      </div>

      {canManage && (
        <ConsentPanel patientId={patientId} consent={consent} role={context.role} />
      )}

      {(!documents || documents.length === 0) ? (
        <Card>
          <p className="text-sm font-medium text-muted">{strings.documents.empty}</p>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {documents.map((doc) => {
            const dateDisplay =
              doc.issue_date || new Date(doc.created_at).toLocaleDateString();
            const typeLabel =
              strings.documents.types[
                doc.document_type as keyof typeof strings.documents.types
              ] ?? doc.document_type;
            const doctorDisplay = doc.doctor_name || strings.documents.notSet;

            return (
              <Link
                key={doc.id}
                href={`/patients/${patientId}/documents/${doc.id}`}
                className="group block"
              >
                <Card className="flex flex-col gap-2 transition-all hover:border-forest/40 hover:bg-sage-light sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3.5">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-sage text-forest">
                      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                      </svg>
                    </div>
                    <div className="flex flex-col">
                      <h2 className="text-base font-bold text-ink group-hover:text-forest">{typeLabel}</h2>
                      <p className="text-xs text-muted font-medium">
                        {doctorDisplay} · {dateDisplay}
                      </p>
                    </div>
                  </div>
                  <div>
                    <StatusBadge status={doc.extraction_status as DocumentStatus} />
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
