"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { callApi, type ApiFailure } from "@/lib/client/call-api";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/field";
import { ErrorMessage } from "@/components/error-message";
import { Notice } from "@/components/ui/notice";
import { strings } from "@/strings/en";

export function AccountForm({
  email,
  initialFullName,
  initialPhone,
}: {
  email: string;
  initialFullName: string;
  initialPhone: string;
}) {
  const router = useRouter();
  const [fullName, setFullName] = useState(initialFullName);
  const [phone, setPhone] = useState(initialPhone);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<ApiFailure | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setSaved(false);
    setError(null);

    const result = await callApi("/api/account", "PATCH", { fullName, phone });
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setSaved(true);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {saved ? <Notice tone="success">{strings.account.saved}</Notice> : null}
      <ErrorMessage error={error} />
      <TextField id="account-email" label={strings.auth.email} type="email" readOnly disabled value={email} />
      <TextField
        id="account-fullname"
        label={strings.auth.fullName}
        required
        maxLength={128}
        value={fullName}
        onChange={(e) => setFullName(e.target.value)}
      />
      <TextField
        id="account-phone"
        label={strings.account.phone}
        type="tel"
        maxLength={32}
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
      />
      <Button type="submit" disabled={busy}>
        {busy ? strings.common.saving : strings.common.save}
      </Button>
    </form>
  );
}
