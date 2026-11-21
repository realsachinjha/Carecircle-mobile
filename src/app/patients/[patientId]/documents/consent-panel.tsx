"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ErrorMessage } from "@/components/error-message";
import { callApi, type ApiFailure } from "@/lib/client/call-api";
import type { PatientRole } from "@/lib/patients/context";
import { strings } from "@/strings/en";

type ConsentPanelProps = {
  patientId: string;
  consent: { given_at: string } | null;
  role: PatientRole;
};

export function ConsentPanel({ patientId, consent, role }: ConsentPanelProps) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<ApiFailure | null>(null);

  async function giveConsent() {
    setBusy(true);
    setError(null);
    const result = await callApi(`/api/patients/${patientId}/consent`, "POST");
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  async function withdrawConsent() {
    if (!window.confirm(strings.consent.confirmWithdraw)) {
      return;
    }
    setBusy(true);
    setError(null);
    const result = await callApi(`/api/patients/${patientId}/consent`, "DELETE");
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  if (!consent) {
    return (
      <Card className="flex flex-col gap-3">
        <h2 className="text-xl font-bold">{strings.consent.title}</h2>
        <p className="text-base text-muted">{strings.consent.notice}</p>
        <ErrorMessage error={error} />
        <div>
          <Button onClick={giveConsent} disabled={busy}>
            {strings.consent.agree}
          </Button>
        </div>
      </Card>
    );
  }

  const formattedDate = new Date(consent.given_at).toLocaleDateString();

  return (
    <Card className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-base font-medium">
          {strings.consent.given} {formattedDate}
        </p>
      </div>
      <div className="flex flex-col items-start gap-2">
        <ErrorMessage error={error} />
        {role === "OWNER" && (
          <Button variant="secondary" onClick={withdrawConsent} disabled={busy}>
            {strings.consent.withdraw}
          </Button>
        )}
      </div>
    </Card>
  );
}
