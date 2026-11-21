"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { callApi, type ApiFailure } from "@/lib/client/call-api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SelectField, TextField } from "@/components/ui/field";
import { ErrorMessage } from "@/components/error-message";
import { Notice } from "@/components/ui/notice";
import { strings } from "@/strings/en";

type RoleOption = "CAREGIVER" | "VIEWER" | "PATIENT";

export function InvitePanel({
  patientId,
  hasPatientLogin,
}: {
  patientId: string;
  hasPatientLogin: boolean;
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<RoleOption>("CAREGIVER");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<ApiFailure | null>(null);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setInviteLink(null);

    const result = await callApi<{ inviteId: string; link: string }>(
      `/api/patients/${patientId}/invites`,
      "POST",
      { email, role },
    );
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setInviteLink(result.data.link);
    setEmail("");
    router.refresh();
  }

  async function handleCopy() {
    if (!inviteLink) return;
    await navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleShare() {
    if (!inviteLink || typeof navigator.share !== "function") return;
    try {
      await navigator.share({
        title: strings.appName,
        text: strings.people.inviteShareText,
        url: inviteLink,
      });
    } catch {
    }
  }

  const roleOptions: RoleOption[] = hasPatientLogin
    ? ["CAREGIVER", "VIEWER"]
    : ["CAREGIVER", "VIEWER", "PATIENT"];

  return (
    <Card title={strings.people.inviteTitle}>
      {inviteLink ? (
        <div className="flex flex-col gap-3">
          <Notice tone="success">{strings.people.inviteReady}</Notice>
          <TextField
            id="invite-link"
            label={strings.people.inviteTitle}
            readOnly
            value={inviteLink}
          />
          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={handleCopy}>
              {copied ? strings.common.copied : strings.common.copy}
            </Button>
            {typeof navigator !== "undefined" && typeof navigator.share === "function" ? (
              <Button type="button" variant="secondary" onClick={handleShare}>
                {strings.common.share}
              </Button>
            ) : null}
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <TextField
            id="invite-email"
            label={strings.people.inviteEmail}
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <div className="flex flex-col gap-1">
            <SelectField
              id="invite-role"
              label={strings.people.inviteRole}
              value={role}
              onChange={(e) => setRole(e.target.value as RoleOption)}
            >
              {roleOptions.map((r) => (
                <option key={r} value={r}>
                  {strings.roles[r]}
                </option>
              ))}
            </SelectField>
            <p className="text-base text-muted">{strings.people.inviteRoleHelp[role]}</p>
          </div>

          <ErrorMessage error={error} />

          <Button type="submit" disabled={busy}>
            {busy ? strings.common.saving : strings.people.createInvite}
          </Button>
        </form>
      )}
    </Card>
  );
}
