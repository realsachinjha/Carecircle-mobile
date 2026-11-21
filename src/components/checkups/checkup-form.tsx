"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Notice } from "@/components/ui/notice";
import { CHECKUP_TYPES } from "@/lib/checkups/schema";
import { strings } from "@/strings/en";

type FormInitial = {
  checkupType: (typeof CHECKUP_TYPES)[number];
  doctorName: string;
  clinicLocation?: string | null;
  localTime: string;
  reminderHoursBefore: number;
  notes?: string | null;
};

export function CheckupForm({
  mode,
  patientId,
  checkupId,
  initial,
  timeZone,
}: {
  mode: "create" | "edit";
  patientId: string;
  checkupId?: string;
  initial?: FormInitial;
  timeZone: string;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [checkupType, setCheckupType] = useState<(typeof CHECKUP_TYPES)[number]>(
    initial?.checkupType ?? "CONSULTATION",
  );
  const [doctorName, setDoctorName] = useState(initial?.doctorName ?? "");
  const [clinicLocation, setClinicLocation] = useState(initial?.clinicLocation ?? "");
  const [localTime, setLocalTime] = useState(initial?.localTime ?? "");
  const [reminderHoursBefore, setReminderHoursBefore] = useState(
    initial?.reminderHoursBefore ?? 24,
  );
  const [notes, setNotes] = useState(initial?.notes ?? "");

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const url =
        mode === "create"
          ? `/api/patients/${patientId}/checkups`
          : `/api/checkups/${checkupId}`;
      const method = mode === "create" ? "POST" : "PATCH";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          checkupType,
          doctorName,
          clinicLocation: clinicLocation || undefined,
          localTime,
          reminderHoursBefore: Number(reminderHoursBefore),
          notes: notes || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        const errKey = data?.error as keyof typeof strings.errors;
        setError(strings.errors[errKey] ?? strings.errors.INTERNAL);
        setSubmitting(false);
        return;
      }

      router.push(`/patients/${patientId}/checkups`);
      router.refresh();
    } catch {
      setError(strings.errors.INTERNAL);
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {error ? <Notice tone="error">{error}</Notice> : null}

      <div className="flex flex-col gap-1">
        <label htmlFor="checkupType" className="font-medium">
          {strings.checkups.type}
        </label>
        <select
          id="checkupType"
          value={checkupType}
          onChange={(e) => setCheckupType(e.target.value as (typeof CHECKUP_TYPES)[number])}
          className="min-h-12 rounded border border-line bg-paper px-3 py-2"
        >
          {CHECKUP_TYPES.map((type) => (
            <option key={type} value={type}>
              {strings.checkups.types[type]}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="doctorName" className="font-medium">
          {strings.checkups.doctorName}
        </label>
        <input
          id="doctorName"
          type="text"
          required
          maxLength={128}
          value={doctorName}
          onChange={(e) => setDoctorName(e.target.value)}
          className="min-h-12 rounded border border-line bg-paper px-3 py-2"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="clinicLocation" className="font-medium">
          {strings.checkups.location}
        </label>
        <input
          id="clinicLocation"
          type="text"
          maxLength={500}
          value={clinicLocation}
          onChange={(e) => setClinicLocation(e.target.value)}
          className="min-h-12 rounded border border-line bg-paper px-3 py-2"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="localTime" className="font-medium">
          {strings.checkups.when}
        </label>
        <span className="text-xs text-muted">
          {strings.checkups.whenHint} ({timeZone})
        </span>
        <input
          id="localTime"
          type="datetime-local"
          required
          value={localTime}
          onChange={(e) => setLocalTime(e.target.value)}
          className="min-h-12 rounded border border-line bg-paper px-3 py-2"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="reminderHoursBefore" className="font-medium">
          {strings.checkups.reminderHours}
        </label>
        <input
          id="reminderHoursBefore"
          type="number"
          min={1}
          max={168}
          required
          value={reminderHoursBefore}
          onChange={(e) => setReminderHoursBefore(Number(e.target.value))}
          className="min-h-12 rounded border border-line bg-paper px-3 py-2"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="notes" className="font-medium">
          {strings.checkups.notes}
        </label>
        <textarea
          id="notes"
          maxLength={2000}
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="rounded border border-line bg-paper p-3"
        />
      </div>

      <div className="mt-4 flex gap-3">
        <button
          type="submit"
          disabled={submitting}
          className="min-h-12 rounded bg-accent px-6 font-semibold text-accent-ink disabled:opacity-50"
        >
          {submitting ? strings.common.saving : strings.checkups.save}
        </button>
      </div>
    </form>
  );
}
