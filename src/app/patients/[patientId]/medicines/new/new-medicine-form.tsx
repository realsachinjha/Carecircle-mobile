"use client";

import { useRouter } from "next/navigation";
import { MedicineEditor } from "@/components/medicines/medicine-editor";
import { callApi, type ApiFailure } from "@/lib/client/call-api";
import { draftToInput, newScheduleDraft, type MedicineDraft } from "@/lib/medicines/defaults";
import { strings } from "@/strings/en";

type Props = {
  patientId: string;
  today: string;
};

export function NewMedicineForm({ patientId, today }: Props) {
  const router = useRouter();

  const initialDraft: MedicineDraft = {
    name: "",
    dosage: "",
    instructions: "",
    schedules: [newScheduleDraft("MORNING", today)],
  };

  async function handleSubmit(drafts: MedicineDraft[]): Promise<ApiFailure | null> {
    const firstDraft = drafts[0];
    if (!firstDraft) {
      return { code: "VALIDATION_FAILED" };
    }
    const payload = draftToInput(firstDraft);
    const res = await callApi<{ medicationId: string }>(
      `/api/patients/${patientId}/medications`,
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
