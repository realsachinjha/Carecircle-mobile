"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, buttonClass } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { TextField } from "@/components/ui/field";
import { Notice } from "@/components/ui/notice";
import { strings } from "@/strings/en";

export function DangerZone({
  patientId,
  patientFullName,
  isOwner,
}: {
  patientId: string;
  patientFullName: string;
  isOwner: boolean;
}) {
  const router = useRouter();
  const [typedName, setTypedName] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canDelete = typedName.trim() === patientFullName.trim();

  async function handleDelete() {
    if (!canDelete || deleting) return;
    setDeleting(true);
    setError(null);
    try {
      const response = await fetch(`/api/patients/${patientId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as { code?: string };
        const code = data.code as keyof typeof strings.errors;
        setError(strings.errors[code] ?? strings.errors.INTERNAL);
        setDeleting(false);
        return;
      }
      router.replace("/patients");
      router.refresh();
    } catch {
      setError(strings.errors.INTERNAL);
      setDeleting(false);
    }
  }

  return (
    <Card title={strings.privacy.dangerTitle} className="flex flex-col gap-6">
      {error ? <Notice tone="error">{error}</Notice> : null}
      <div className="flex flex-col gap-2">
        <div>
          <a
            href={`/api/patients/${patientId}/export`}
            download
            className={buttonClass({ variant: "secondary" })}
          >
            {strings.privacy.export}
          </a>
        </div>
        <p className="text-base text-muted">{strings.privacy.exportHint}</p>
      </div>

      {isOwner ? (
        <div className="flex flex-col gap-3 border-t-2 border-line pt-4">
          <p className="text-base text-muted">{strings.privacy.deletePatientHint}</p>
          <TextField
            id="confirm-delete-name"
            label={strings.privacy.typeNameToConfirm}
            value={typedName}
            onChange={(e) => setTypedName(e.target.value)}
            disabled={deleting}
          />
          <div>
            <Button
              type="button"
              variant="danger"
              disabled={!canDelete || deleting}
              onClick={handleDelete}
            >
              {strings.privacy.deletePatient}
            </Button>
          </div>
        </div>
      ) : null}
    </Card>
  );
}
