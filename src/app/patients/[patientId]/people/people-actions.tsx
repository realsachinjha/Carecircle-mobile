"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { callApi, type ApiFailure } from "@/lib/client/call-api";
import { ErrorMessage } from "@/components/error-message";
import { strings } from "@/strings/en";

export function RevokeButton({ patientId, userId }: { patientId: string; userId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<ApiFailure | null>(null);

  async function handleRevoke() {
    if (!window.confirm(strings.people.confirmRevoke)) {
      return;
    }
    setBusy(true);
    setError(null);
    const result = await callApi(`/api/patients/${patientId}/caregivers/${userId}`, "DELETE");
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        disabled={busy}
        onClick={handleRevoke}
        className="min-h-12 px-3 text-base font-semibold text-danger underline disabled:opacity-60"
      >
        {strings.people.revoke}
      </button>
      <ErrorMessage error={error} />
    </div>
  );
}

export function RemoveLoginButton({ patientId }: { patientId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<ApiFailure | null>(null);

  async function handleRemove() {
    if (!window.confirm(strings.people.confirmRemoveLogin)) {
      return;
    }
    setBusy(true);
    setError(null);
    const result = await callApi(`/api/patients/${patientId}/patient-login`, "DELETE");
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        disabled={busy}
        onClick={handleRemove}
        className="min-h-12 px-3 text-base font-semibold text-danger underline disabled:opacity-60"
      >
        {strings.people.removeLogin}
      </button>
      <ErrorMessage error={error} />
    </div>
  );
}

export function CancelInviteButton({ patientId, inviteId }: { patientId: string; inviteId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<ApiFailure | null>(null);

  async function handleCancel() {
    setBusy(true);
    setError(null);
    const result = await callApi(`/api/patients/${patientId}/invites/${inviteId}`, "DELETE");
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        disabled={busy}
        onClick={handleCancel}
        className="min-h-12 px-3 text-base font-semibold text-danger underline disabled:opacity-60"
      >
        {strings.people.revokeInvite}
      </button>
      <ErrorMessage error={error} />
    </div>
  );
}
