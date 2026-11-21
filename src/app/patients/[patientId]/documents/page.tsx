import Link from "next/link";
import { notFound } from "next/navigation";
import { ConsentPanel } from "./consent-panel";
import { StatusBadge, type DocumentStatus } from "@/components/documents/status-badge";
import { buttonClass } from "@/components/ui/button";
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
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">{strings.documents.title}</h1>
        {canManage && hasConsent && (
          <Link
            href={`/patients/${patientId}/documents/upload`}
            className={buttonClass({ variant: "primary" })}
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
          <p className="text-base text-muted">{strings.documents.empty}</p>
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
                className="block"
              >
                <Card className="flex flex-col gap-2 transition-colors hover:border-accent sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-lg font-semibold">{typeLabel}</h2>
                    <p className="text-base text-muted">
                      {doctorDisplay} · {dateDisplay}
                    </p>
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
