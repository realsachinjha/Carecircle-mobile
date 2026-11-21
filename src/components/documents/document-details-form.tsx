"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SelectField, TextField } from "@/components/ui/field";
import { ErrorMessage } from "@/components/error-message";
import { callApi, type ApiFailure } from "@/lib/client/call-api";
import { DOCUMENT_TYPES, type DocumentType } from "@/lib/documents/constants";
import { strings } from "@/strings/en";

type DetailsFormProps = {
  documentId: string;
  initialType: DocumentType;
  initialDoctor: string | null;
  initialClinic: string | null;
  initialIssueDate: string | null;
  canEdit: boolean;
};

export function DocumentDetailsForm({
  documentId,
  initialType,
  initialDoctor,
  initialClinic,
  initialIssueDate,
  canEdit,
}: DetailsFormProps) {
  const router = useRouter();
  const [documentType, setDocumentType] = useState<DocumentType>(initialType);
  const [doctorName, setDoctorName] = useState(initialDoctor ?? "");
  const [clinicName, setClinicName] = useState(initialClinic ?? "");
  const [issueDate, setIssueDate] = useState(initialIssueDate ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<ApiFailure | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const result = await callApi(`/api/documents/${documentId}`, "PATCH", {
      documentType,
      doctorName: doctorName.trim(),
      clinicName: clinicName.trim(),
      issueDate: issueDate.trim(),
    });
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  if (!canEdit) {
    return (
      <Card className="flex flex-col gap-3">
        <h2 className="text-xl font-bold">{strings.documents.detailsTitle}</h2>
        <div>
          <span className="text-sm text-muted">{strings.documents.type}: </span>
          <span className="text-base font-medium">
            {strings.documents.types[documentType] ?? documentType}
          </span>
        </div>
        <div>
          <span className="text-sm text-muted">{strings.documents.doctorName}: </span>
          <span className="text-base font-medium">
            {doctorName || strings.documents.notSet}
          </span>
        </div>
        <div>
          <span className="text-sm text-muted">{strings.documents.clinicName}: </span>
          <span className="text-base font-medium">
            {clinicName || strings.documents.notSet}
          </span>
        </div>
        <div>
          <span className="text-sm text-muted">{strings.documents.issueDate}: </span>
          <span className="text-base font-medium">
            {issueDate || strings.documents.notSet}
          </span>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <form onSubmit={submit} className="flex flex-col gap-4">
        <h2 className="text-xl font-bold">{strings.documents.detailsTitle}</h2>
        <SelectField
          id="documentType"
          label={strings.documents.type}
          value={documentType}
          onChange={(e) => setDocumentType(e.target.value as DocumentType)}
        >
          {DOCUMENT_TYPES.map((type) => (
            <option key={type} value={type}>
              {strings.documents.types[type]}
            </option>
          ))}
        </SelectField>
        <TextField
          id="doctorName"
          label={strings.documents.doctorName}
          value={doctorName}
          maxLength={128}
          onChange={(e) => setDoctorName(e.target.value)}
        />
        <TextField
          id="clinicName"
          label={strings.documents.clinicName}
          value={clinicName}
          maxLength={128}
          onChange={(e) => setClinicName(e.target.value)}
        />
        <TextField
          id="issueDate"
          label={strings.documents.issueDate}
          type="date"
          value={issueDate}
          onChange={(e) => setIssueDate(e.target.value)}
        />
        <ErrorMessage error={error} />
        <div>
          <Button type="submit" disabled={busy}>
            {busy ? strings.common.saving : strings.documents.saveDetails}
          </Button>
        </div>
      </form>
    </Card>
  );
}
