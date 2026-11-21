"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ErrorMessage } from "@/components/error-message";
import { callApi, type ApiFailure } from "@/lib/client/call-api";
import type { DocumentStatus } from "./status-badge";
import { strings } from "@/strings/en";

type ParseButtonProps = {
  documentId: string;
  status: DocumentStatus;
};

export function ParseButton({ documentId, status }: ParseButtonProps) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<ApiFailure | null>(null);

  async function handleParse() {
    setBusy(true);
    setError(null);
    const result = await callApi<{ status: string; code: string | null }>(
      `/api/documents/${documentId}/parse`,
      "POST"
    );
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    if (result.data.status === "FAILED" && result.data.code) {
      setError({
        code: result.data.code as keyof typeof strings.errors,
      });
      router.refresh();
      return;
    }
    router.refresh();
  }

  const label =
    status === "FAILED" ? strings.documents.tryAgain : strings.documents.readWithAi;

  return (
    <div className="flex flex-col gap-2">
      <Button onClick={handleParse} disabled={busy}>
        {busy ? strings.documents.reading : label}
      </Button>
      <ErrorMessage error={error} />
    </div>
  );
}
