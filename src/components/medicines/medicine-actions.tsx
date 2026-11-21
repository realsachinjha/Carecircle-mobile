"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { callApi } from "@/lib/client/call-api";
import { strings } from "@/strings/en";
import { Button } from "@/components/ui/button";

export function StopMedicineButton({ medicationId }: { medicationId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleStop() {
    if (!window.confirm(strings.medicines.confirmStop)) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await callApi(`/api/medications/${medicationId}/stop`, "POST");
      if (!res.ok) {
        setError(strings.errors[res.error.code as keyof typeof strings.errors] ?? strings.errors.INTERNAL);
        return;
      }
      router.refresh();
    } catch {
      setError(strings.errors.INTERNAL);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="inline-flex flex-col items-start gap-1">
      <Button
        type="button"
        variant="danger"
        disabled={busy}
        onClick={handleStop}
        className="min-h-10 text-base"
      >
        {busy ? "…" : strings.medicines.stop}
      </Button>
      {error && <span className="text-sm text-danger">{error}</span>}
    </div>
  );
}
