"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Notice } from "@/components/ui/notice";
import { MedicineEditor } from "./medicine-editor";
import { callApi, type ApiFailure } from "@/lib/client/call-api";
import { flagsFor, type Extraction } from "@/lib/gemini/schema";
import {
  draftToInput,
  draftsFromExtraction,
  newScheduleDraft,
  type MedicineDraft,
} from "@/lib/medicines/defaults";
import { strings } from "@/strings/en";

type ApprovalEditorProps = {
  documentId: string;
  patientId: string;
  extraction: Extraction;
  today: string;
  demoMode: boolean;
};

export function ApprovalEditor({
  documentId,
  patientId,
  extraction,
  today,
  demoMode,
}: ApprovalEditorProps) {
  const router = useRouter();
  const [approvedNotice, setApprovedNotice] = useState(false);

  const initialDrafts: MedicineDraft[] =
    extraction.medicines.length > 0
      ? draftsFromExtraction(extraction, today)
      : [
          {
            name: "",
            dosage: "",
            instructions: "",
            schedules: [newScheduleDraft("MORNING", today)],
          },
        ];

  async function handleApprove(
    drafts: MedicineDraft[]
  ): Promise<ApiFailure | null> {
    const payload = { medicines: drafts.map(draftToInput) };
    const result = await callApi(
      `/api/documents/${documentId}/approve`,
      "POST",
      payload
    );
    if (!result.ok) {
      return result.error;
    }
    setApprovedNotice(true);
    router.push(`/patients/${patientId}/medicines`);
    return null;
  }

  return (
    <div className="flex flex-col gap-4">
      {demoMode && (
        <Notice tone="warning">{strings.documents.demoBadge}</Notice>
      )}

      <div>
        <h2 className="text-xl font-bold">{strings.medicines.approveTitle}</h2>
        <p className="text-base text-muted">{strings.medicines.approveIntro}</p>
      </div>

      {approvedNotice && (
        <Notice tone="success">{strings.medicines.approved}</Notice>
      )}

      <MedicineEditor
        initial={initialDrafts}
        flags={extraction.medicines.map(flagsFor)}
        today={today}
        allowMultiple={true}
        submitLabel={strings.medicines.approve}
        busyLabel={strings.medicines.approving}
        onSubmit={handleApprove}
      />
    </div>
  );
}
