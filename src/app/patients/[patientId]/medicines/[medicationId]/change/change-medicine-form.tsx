"use client";

import { useRouter } from "next/navigation";
import { MedicineEditor } from "@/components/medicines/medicine-editor";
import { callApi, type ApiFailure } from "@/lib/client/call-api";
import { draftToInput, type MedicineDraft } from "@/lib/medicines/defaults";
import { strings } from "@/strings/en";

type Props = {
  patientId: string;
  medicationId: string;
  initialDraft: MedicineDraft;
  today: string;
};

export function ChangeMedicineForm({ patientId, medicationId, initialDraft, today }: Props) {
  const router = useRouter();

  async function handleSubmit(drafts: MedicineDraft[]): Promise<ApiFailure | null> {
    const firstDraft = drafts[0];
    if (!firstDraft) {
      return { code: "VALIDATION_FAILED" };
    }
    const payload = draftToInput(firstDraft);
    const res = await callApi<{ medicationId: string }>(
      `/api/medications/${medicationId}/change`,
      "POST",
      payload
    );

    if (!res.ok) {
      return res.error;
    }

    router.push(`/patients/${patientId}/medicines`);
    return null;
  }

  return (
    <MedicineEditor
      initial={[initialDraft]}
      today={today}
      allowMultiple={false}
      submitLabel={strings.medicines.save}
      busyLabel={strings.common.saving}
      onSubmit={handleSubmit}
    />
  );
}
