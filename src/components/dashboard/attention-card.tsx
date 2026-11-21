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
        <p className="text-muted">{strings.dashboard.nothingNeedsAttention}</p>
      ) : (
        <div className="flex flex-col gap-4">
          {missed.length > 0 ? (
            <div className="flex flex-col gap-2">
              <h3 className="text-sm font-semibold text-danger">{strings.dashboard.missedToday}</h3>
              <ul className="flex flex-col gap-1">
                {missed.map((dose) => (
                  <li key={dose.reminder_id} className="text-sm">
                    <span className="font-medium">{dose.medication_name}</span> {dose.dosage} at{" "}
                    {timeInZone(dose.scheduled_for, timeZone)}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {documentsToCheck.length > 0 ? (
            <div className="flex flex-col gap-2">
              <h3 className="text-sm font-semibold">{strings.dashboard.documentsToCheck}</h3>
              <ul className="flex flex-col gap-1">
                {documentsToCheck.map((doc) => {
                  const typeLabel =
                    doc.document_type in strings.documents.types
                      ? strings.documents.types[doc.document_type as keyof typeof strings.documents.types]
                      : doc.document_type;
                  return (
                    <li key={doc.id}>
                      <Link
                        href={`/patients/${patientId}/documents/${doc.id}`}
                        className="text-sm underline"
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
            <div className="flex flex-col gap-2">
              <h3 className="text-sm font-semibold text-danger">{strings.dashboard.documentsFailed}</h3>
              <ul className="flex flex-col gap-1">
                {documentsFailed.map((doc) => {
                  const typeLabel =
                    doc.document_type in strings.documents.types
                      ? strings.documents.types[doc.document_type as keyof typeof strings.documents.types]
                      : doc.document_type;
                  return (
                    <li key={doc.id}>
                      <Link
                        href={`/patients/${patientId}/documents/${doc.id}`}
                        className="text-sm text-danger underline"
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
