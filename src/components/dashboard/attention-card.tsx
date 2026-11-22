import Link from "next/link";
import { Card } from "@/components/ui/card";
import type { Dose } from "@/lib/doses/view";
import { dateInZone, timeInZone } from "@/lib/time/local-date";
import { strings } from "@/strings/en";

type DocumentItem = {
  id: string;
  document_type: string;
  created_at: string;
};

export function AttentionCard({
  missed,
  documentsToCheck,
  documentsFailed,
  patientId,
  timeZone,
}: {
  missed: Dose[];
  documentsToCheck: DocumentItem[];
  documentsFailed: DocumentItem[];
  patientId: string;
  timeZone: string;
}) {
  const hasItems = missed.length > 0 || documentsToCheck.length > 0 || documentsFailed.length > 0;

  return (
    <Card title={strings.dashboard.attentionTitle}>
      {!hasItems ? (
        <div className="flex items-center gap-3 rounded-xl bg-sage-soft p-3.5 text-forest">
          <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
          </svg>
          <p className="text-sm font-medium">{strings.dashboard.nothingNeedsAttention}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {missed.length > 0 ? (
            <div className="flex flex-col gap-2 rounded-xl bg-peach p-3.5 border border-terracotta/30">
              <div className="flex items-center gap-2 text-terracotta-dark">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-terracotta text-white text-xs font-bold">
                  !
                </div>
                <h3 className="text-sm font-bold">{strings.dashboard.missedToday}</h3>
              </div>
              <ul className="flex flex-col gap-1.5 pl-8">
                {missed.map((dose) => (
                  <li key={dose.reminder_id} className="text-sm text-ink">
                    <span className="font-semibold">{dose.medication_name}</span> {dose.dosage} at{" "}
                    {timeInZone(dose.scheduled_for, timeZone)}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {documentsToCheck.length > 0 ? (
            <div className="flex flex-col gap-2 rounded-xl bg-peach-light p-3.5 border border-line">
              <div className="flex items-center gap-2 text-forest">
                <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                </svg>
                <h3 className="text-sm font-bold text-ink">{strings.dashboard.documentsToCheck}</h3>
              </div>
              <ul className="flex flex-col gap-1.5 pl-7">
                {documentsToCheck.map((doc) => {
                  const typeLabel =
                    doc.document_type in strings.documents.types
                      ? strings.documents.types[doc.document_type as keyof typeof strings.documents.types]
                      : doc.document_type;
                  return (
                    <li key={doc.id}>
                      <Link
                        href={`/patients/${patientId}/documents/${doc.id}`}
                        className="text-sm font-medium text-forest hover:underline"
                      >
                        {typeLabel} · {dateInZone(doc.created_at, timeZone)}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : null}

          {documentsFailed.length > 0 ? (
            <div className="flex flex-col gap-2 rounded-xl bg-peach-light p-3.5 border border-danger/30">
              <div className="flex items-center gap-2 text-danger">
                <h3 className="text-sm font-bold">{strings.dashboard.documentsFailed}</h3>
              </div>
              <ul className="flex flex-col gap-1.5 pl-7">
                {documentsFailed.map((doc) => {
                  const typeLabel =
                    doc.document_type in strings.documents.types
                      ? strings.documents.types[doc.document_type as keyof typeof strings.documents.types]
                      : doc.document_type;
                  return (
                    <li key={doc.id}>
                      <Link
                        href={`/patients/${patientId}/documents/${doc.id}`}
                        className="text-sm text-danger hover:underline"
                      >
                        {typeLabel} · {dateInZone(doc.created_at, timeZone)}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : null}
        </div>
      )}
    </Card>
  );
}
