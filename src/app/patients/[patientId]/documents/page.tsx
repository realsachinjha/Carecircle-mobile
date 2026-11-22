import Link from "next/link";
import { notFound } from "next/navigation";
import { ConsentPanel } from "./consent-panel";
import { StatusBadge, type DocumentStatus } from "@/components/documents/status-badge";
import { Card } from "@/components/ui/card";
import { loadPatientContext } from "@/lib/auth/session";
import { strings } from "@/strings/en";

export const dynamic = "force-dynamic";

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
    <div className="flex flex-col gap-5">
      <div className="relative flex items-center justify-between py-1">
        <Link
          href={`/patients/${patientId}`}
          className="flex h-10 w-10 items-center justify-center rounded-full text-ink hover:bg-sage-soft"
          aria-label={strings.common.back}
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
        </Link>
        <h1 className="text-xl font-bold tracking-tight text-ink sm:text-2xl">
          {strings.documents.title}
        </h1>
        <div className="h-10 w-10" aria-hidden="true" />
      </div>

      <div className="relative flex items-center rounded-2xl border border-line-soft bg-white px-4 py-3 shadow-xs">
        <svg className="h-5 w-5 text-muted shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
        </svg>
        <input
          type="text"
          placeholder={strings.documents.searchPlaceholder}
          aria-label={strings.documents.searchPlaceholder}
          className="ml-3 w-full border-none bg-transparent text-sm text-ink outline-none placeholder:text-muted"
        />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        <span className="shrink-0 rounded-full bg-forest px-4 py-1.5 text-xs font-semibold text-white shadow-2xs">
          {strings.documents.filterAll}
        </span>
        <span className="shrink-0 rounded-full border border-line-soft bg-white px-4 py-1.5 text-xs font-medium text-muted hover:border-forest">
          {strings.documents.filterPrescriptions}
        </span>
        <span className="shrink-0 rounded-full border border-line-soft bg-white px-4 py-1.5 text-xs font-medium text-muted hover:border-forest">
          {strings.documents.filterReports}
        </span>
        <span className="shrink-0 rounded-full border border-line-soft bg-white px-4 py-1.5 text-xs font-medium text-muted hover:border-forest">
          {strings.documents.filterOthers}
        </span>
      </div>

      {canManage && (
        <ConsentPanel patientId={patientId} consent={consent} role={context.role} />
      )}

      {canManage && hasConsent && (
        <Link
          href={`/patients/${patientId}/documents/upload`}
          className="flex min-h-12 w-full items-center justify-center rounded-full bg-sage px-6 text-base font-semibold text-forest shadow-xs transition-colors hover:bg-sage/80 active:bg-sage/90"
        >
          {strings.documents.upload}
        </Link>
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
            const isPrescription = doc.document_type === "PRESCRIPTION";
            const isLabReport = doc.document_type === "LAB_REPORT";

            return (
              <Link
                key={doc.id}
                href={`/patients/${patientId}/documents/${doc.id}`}
                className="group block"
              >
                <div className="flex items-center justify-between rounded-2xl border border-line-soft bg-white p-4 shadow-xs transition-colors group-hover:border-forest/20 group-hover:bg-sage-soft/30">
                  <div className="flex items-center gap-3.5">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-sage-soft text-forest">
                      {isPrescription ? (
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                        </svg>
                      ) : isLabReport ? (
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 0 1-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 0 1 4.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.942A4.5 4.5 0 0 1 15.9 16.5H8.1a4.5 4.5 0 0 1-2.33-.658L4.2 14.9" />
                        </svg>
                      ) : (
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                        </svg>
                      )}
                    </div>
                    <div className="flex flex-col">
                      <h2 className="text-base font-bold text-ink group-hover:text-forest">
                        {typeLabel}
                      </h2>
                      <p className="text-xs font-medium text-muted">
                        {dateDisplay}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={doc.extraction_status as DocumentStatus} />
                    <svg className="h-5 w-5 text-muted group-hover:text-forest" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                    </svg>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
