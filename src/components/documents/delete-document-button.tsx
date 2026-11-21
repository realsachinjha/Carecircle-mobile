"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Notice } from "@/components/ui/notice";
import { strings } from "@/strings/en";

export function DeleteDocumentButton({
  patientId,
  documentId,
}: {
  patientId: string;
  documentId: string;
}) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    if (deleting) return;
    if (!window.confirm(strings.privacy.confirmDeleteDocument)) {
      return;
    }
    setDeleting(true);
    setError(null);
    try {
      const response = await fetch(`/api/documents/${documentId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as { code?: string };
        const code = data.code as keyof typeof strings.errors;
        setError(strings.errors[code] ?? strings.errors.INTERNAL);
        setDeleting(false);
        return;
      }
      router.replace(`/patients/${patientId}/documents`);
      router.refresh();
    } catch {
      setError(strings.errors.INTERNAL);
      setDeleting(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      {error ? <Notice tone="error">{error}</Notice> : null}
      <div>
        <Button
          type="button"
          variant="danger"
          disabled={deleting}
          onClick={handleDelete}
        >
          {strings.privacy.deleteDocument}
        </Button>
      </div>
    </div>
  );
}
