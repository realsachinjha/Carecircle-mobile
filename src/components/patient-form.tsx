"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BLOOD_GROUPS, type PatientFields } from "@/lib/patients/schema";
import { callApi, type ApiFailure } from "@/lib/client/call-api";
import { Button } from "@/components/ui/button";
import { SelectField, TextArea, TextField } from "@/components/ui/field";
import { ErrorMessage } from "@/components/error-message";
import { strings } from "@/strings/en";

type PatientFormProps = {
  mode: "create" | "edit";
  patientId?: string;
  initial?: Partial<PatientFields>;
};

export function PatientForm({ mode, patientId, initial }: PatientFormProps) {
  const router = useRouter();
  const [fullName, setFullName] = useState(initial?.fullName ?? "");
  const [dateOfBirth, setDateOfBirth] = useState(initial?.dateOfBirth ?? "");
  const [timezone, setTimezone] = useState(initial?.timezone ?? "Asia/Kolkata");
  const [missedAfterMinutes, setMissedAfterMinutes] = useState(initial?.missedAfterMinutes ?? 120);
  const [bloodGroup, setBloodGroup] = useState<string>(initial?.bloodGroup ?? "");
  const [primaryCondition, setPrimaryCondition] = useState(initial?.primaryCondition ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [emergencyContactName, setEmergencyContactName] = useState(initial?.emergencyContactName ?? "");
  const [emergencyContactPhone, setEmergencyContactPhone] = useState(initial?.emergencyContactPhone ?? "");
  const [physicianName, setPhysicianName] = useState(initial?.physicianName ?? "");
  const [physicianPhone, setPhysicianPhone] = useState(initial?.physicianPhone ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<ApiFailure | null>(null);

  const todayIso = new Date().toISOString().split("T")[0] ?? "";

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);

    const body = {
      fullName,
      dateOfBirth,
      timezone,
      missedAfterMinutes: Number(missedAfterMinutes),
      bloodGroup: bloodGroup ? bloodGroup : null,
      primaryCondition,
      notes,
      emergencyContactName,
      emergencyContactPhone,
      physicianName,
      physicianPhone,
    };

    if (mode === "create") {
      const result = await callApi<{ patientId: string }>("/api/patients", "POST", body);
      setBusy(false);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.push(`/patients/${result.data.patientId}`);
    } else if (patientId) {
      const result = await callApi(`/api/patients/${patientId}`, "PATCH", body);
      setBusy(false);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.push(`/patients/${patientId}`);
      router.refresh();
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <TextField
        id="fullName"
        label={strings.patients.fields.fullName}
        required
        maxLength={128}
        value={fullName}
        onChange={(e) => setFullName(e.target.value)}
      />
      <TextField
        id="dateOfBirth"
        label={strings.patients.fields.dateOfBirth}
        type="date"
        required
        max={todayIso}
        value={dateOfBirth}
        onChange={(e) => setDateOfBirth(e.target.value)}
      />
      <TextField
        id="timezone"
        label={strings.patients.fields.timezone}
        required
        hint={strings.patients.fields.timezoneHint}
        value={timezone}
        onChange={(e) => setTimezone(e.target.value)}
      />
      <TextField
        id="missedAfterMinutes"
        label={strings.patients.fields.missedAfterMinutes}
        type="number"
        min={30}
        max={480}
        step={15}
        required
        hint={strings.patients.fields.missedAfterHint}
        value={missedAfterMinutes}
        onChange={(e) => setMissedAfterMinutes(Number(e.target.value))}
      />
      <SelectField
        id="bloodGroup"
        label={strings.patients.fields.bloodGroup}
        value={bloodGroup}
        onChange={(e) => setBloodGroup(e.target.value)}
      >
        <option value="">{strings.patients.notSet}</option>
        {BLOOD_GROUPS.map((bg) => (
          <option key={bg} value={bg}>
            {bg}
          </option>
        ))}
      </SelectField>
      <TextArea
        id="primaryCondition"
        label={strings.patients.fields.primaryCondition}
        value={primaryCondition}
        onChange={(e) => setPrimaryCondition(e.target.value)}
      />
      <TextArea
        id="notes"
        label={strings.patients.fields.notes}
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
      />
      <TextField
        id="emergencyContactName"
        label={strings.patients.fields.emergencyContactName}
        maxLength={128}
        value={emergencyContactName}
        onChange={(e) => setEmergencyContactName(e.target.value)}
      />
      <TextField
        id="emergencyContactPhone"
        label={strings.patients.fields.emergencyContactPhone}
        type="tel"
        maxLength={32}
        value={emergencyContactPhone}
        onChange={(e) => setEmergencyContactPhone(e.target.value)}
      />
      <TextField
        id="physicianName"
        label={strings.patients.fields.physicianName}
        maxLength={128}
        value={physicianName}
        onChange={(e) => setPhysicianName(e.target.value)}
      />
      <TextField
        id="physicianPhone"
        label={strings.patients.fields.physicianPhone}
        type="tel"
        maxLength={32}
        value={physicianPhone}
        onChange={(e) => setPhysicianPhone(e.target.value)}
      />

      <ErrorMessage error={error} />

      <Button type="submit" disabled={busy}>
        {busy ? strings.common.saving : mode === "create" ? strings.patients.create : strings.common.save}
      </Button>
    </form>
  );
}
