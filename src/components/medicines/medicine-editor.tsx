"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Notice } from "@/components/ui/notice";
import { SelectField, TextField } from "@/components/ui/field";
import { ErrorMessage } from "@/components/error-message";
import type { ApiFailure } from "@/lib/client/call-api";
import { SLOTS, type RowFlags, type Slot } from "@/lib/gemini/schema";
import {
  DEFAULT_SLOT_TIMES,
  draftToInput,
  newScheduleDraft,
  type FrequencyType,
  type MedicineDraft,
  type ScheduleDraft,
} from "@/lib/medicines/defaults";
import { medicineSchema } from "@/lib/medicines/schema";
import { strings } from "@/strings/en";

type MedicineEditorProps = {
  initial: MedicineDraft[];
  today: string;
  allowMultiple: boolean;
  submitLabel: string;
  busyLabel: string;
  onSubmit: (drafts: MedicineDraft[]) => Promise<ApiFailure | null>;
  flags?: RowFlags[];
};

export function MedicineEditor({
  initial,
  today,
  allowMultiple,
  submitLabel,
  busyLabel,
  onSubmit,
  flags,
}: MedicineEditorProps) {
  const [drafts, setDrafts] = useState<MedicineDraft[]>(
    initial.length > 0 ? initial : [newEmptyDraft(today)]
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<ApiFailure | null>(null);
  const [validationFailed, setValidationFailed] = useState(false);

  function newEmptyDraft(startDate: string): MedicineDraft {
    return {
      name: "",
      dosage: "",
      instructions: "",
      schedules: [newScheduleDraft("MORNING", startDate)],
    };
  }

  function updateMedicine(index: number, patch: Partial<MedicineDraft>) {
    setDrafts((prev) => {
      const next = [...prev];
      const current = next[index];
      if (current) {
        next[index] = { ...current, ...patch };
      }
      return next;
    });
  }

  function updateSchedule(
    medIndex: number,
    schedIndex: number,
    patch: Partial<ScheduleDraft>
  ) {
    setDrafts((prev) => {
      const next = [...prev];
      const med = next[medIndex];
      if (!med) return prev;
      const scheds = [...med.schedules];
      const sched = scheds[schedIndex];
      if (!sched) return prev;
      scheds[schedIndex] = { ...sched, ...patch };
      next[medIndex] = { ...med, schedules: scheds };
      return next;
    });
  }

  function handleSlotChange(
    medIndex: number,
    schedIndex: number,
    newSlot: Slot
  ) {
    const med = drafts[medIndex];
    const sched = med?.schedules[schedIndex];
    if (!sched) return;
    const oldSlot = sched.slot;
    const patch: Partial<ScheduleDraft> = { slot: newSlot };
    if (sched.target_time === DEFAULT_SLOT_TIMES[oldSlot]) {
      patch.target_time = DEFAULT_SLOT_TIMES[newSlot];
    }
    updateSchedule(medIndex, schedIndex, patch);
  }

  function addSchedule(medIndex: number) {
    const med = drafts[medIndex];
    if (!med) return;
    const firstEnd = med.schedules[0]?.end_date ?? "";
    const newSched = newScheduleDraft("MORNING", today, firstEnd);
    updateMedicine(medIndex, { schedules: [...med.schedules, newSched] });
  }

  function removeSchedule(medIndex: number, schedIndex: number) {
    const med = drafts[medIndex];
    if (!med) return;
    updateMedicine(medIndex, {
      schedules: med.schedules.filter((_, i) => i !== schedIndex),
    });
  }

  function addMedicine() {
    setDrafts((prev) => [...prev, newEmptyDraft(today)]);
  }

  function removeMedicine(medIndex: number) {
    setDrafts((prev) => prev.filter((_, i) => i !== medIndex));
  }

  function toggleWeekday(
    medIndex: number,
    schedIndex: number,
    day: number
  ) {
    const med = drafts[medIndex];
    const sched = med?.schedules[schedIndex];
    if (!sched) return;
    const current = new Set(sched.weekdays);
    if (current.has(day)) {
      current.delete(day);
    } else {
      current.add(day);
    }
    updateSchedule(medIndex, schedIndex, {
      weekdays: Array.from(current).sort((a, b) => a - b),
    });
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setValidationFailed(false);

    let allValid = true;
    for (const draft of drafts) {
      const parsed = medicineSchema.safeParse(draftToInput(draft));
      if (!parsed.success) {
        allValid = false;
        break;
      }
    }

    if (!allValid) {
      setValidationFailed(true);
      return;
    }

    setBusy(true);
    const failure = await onSubmit(drafts);
    setBusy(false);
    if (failure) {
      setError(failure);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {validationFailed && (
        <Notice tone="error">{strings.errors.VALIDATION_FAILED}</Notice>
      )}

      {drafts.map((draft, medIndex) => {
        const flag = flags?.[medIndex];
        const flagLabels: string[] = [];
        if (flag?.missingField) flagLabels.push(strings.documents.flags.missingField);
        if (flag?.slotMismatch) flagLabels.push(strings.documents.flags.slotMismatch);
        if (flag?.lowConfidence) flagLabels.push(strings.documents.flags.lowConfidence);
        const hasNoSchedules = draft.schedules.length === 0;

        return (
          <Card
            key={medIndex}
            className={`flex flex-col gap-4 ${
              flag?.needsAttention ? "border-l-4 border-warn" : ""
            }`}
          >
            {flagLabels.length > 0 && (
              <div className="flex flex-col gap-0.5 text-xs font-semibold text-warn">
                {flagLabels.map((lbl, i) => (
                  <span key={i}>⚠ {lbl}</span>
                ))}
              </div>
            )}

            {draft.name && <h3 className="text-lg font-bold">{draft.name}</h3>}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <TextField
                id={`name-${medIndex}`}
                label={strings.medicines.name}
                value={draft.name}
                maxLength={255}
                required
                onChange={(e) => updateMedicine(medIndex, { name: e.target.value })}
              />
              <TextField
                id={`dosage-${medIndex}`}
                label={strings.medicines.dosage}
                value={draft.dosage}
                maxLength={64}
                required
                onChange={(e) => updateMedicine(medIndex, { dosage: e.target.value })}
              />
            </div>

            <TextField
              id={`instructions-${medIndex}`}
              label={strings.medicines.instructions}
              value={draft.instructions}
              maxLength={1000}
              onChange={(e) => updateMedicine(medIndex, { instructions: e.target.value })}
            />

            <div className="flex flex-col gap-3">
              <h3 className="text-lg font-semibold">{strings.medicines.schedules}</h3>
              {hasNoSchedules && (
                <p className="text-sm font-medium text-danger">
                  {strings.medicines.noSchedules}
                </p>
              )}

              {draft.schedules.map((schedule, schedIndex) => (
                <div
                  key={schedIndex}
                  className="flex flex-col gap-3 rounded-lg border border-line bg-panel p-4"
                >
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <SelectField
                      id={`slot-${medIndex}-${schedIndex}`}
                      label={strings.medicines.slot}
                      value={schedule.slot}
                      onChange={(e) =>
                        handleSlotChange(medIndex, schedIndex, e.target.value as Slot)
                      }
                    >
                      {SLOTS.map((s) => (
                        <option key={s} value={s}>
                          {strings.slots[s]}
                        </option>
                      ))}
                    </SelectField>

                    <div className="flex flex-col gap-1">
                      <label
                        htmlFor={`time-${medIndex}-${schedIndex}`}
                        className="font-semibold text-base"
                      >
                        {strings.medicines.time}
                      </label>
                      <input
                        id={`time-${medIndex}-${schedIndex}`}
                        type="time"
                        value={schedule.target_time}
                        required
                        className="min-h-12 rounded-lg border-2 border-line px-3 text-lg"
                        onChange={(e) =>
                          updateSchedule(medIndex, schedIndex, {
                            target_time: e.target.value,
                          })
                        }
                      />
                    </div>

                    <SelectField
                      id={`frequency-${medIndex}-${schedIndex}`}
                      label={strings.medicines.frequency}
                      value={schedule.frequency_type}
                      onChange={(e) =>
                        updateSchedule(medIndex, schedIndex, {
                          frequency_type: e.target.value as FrequencyType,
                        })
                      }
                    >
                      <option value="DAILY">{strings.medicines.frequencies.DAILY}</option>
                      <option value="SPECIFIC_DAYS">
                        {strings.medicines.frequencies.SPECIFIC_DAYS}
                      </option>
                      <option value="EVERY_N_DAYS">
                        {strings.medicines.frequencies.EVERY_N_DAYS}
                      </option>
                    </SelectField>
                  </div>

                  {schedule.frequency_type === "SPECIFIC_DAYS" && (
                    <div className="flex flex-col gap-1">
                      <span className="font-semibold text-base">{strings.medicines.weekdays}</span>
                      <div className="flex flex-wrap gap-2">
                        {([1, 2, 3, 4, 5, 6, 7] as const).map((day) => {
                          const checked = schedule.weekdays.includes(day);
                          return (
                            <label
                              key={day}
                              className={`flex min-h-12 min-w-12 cursor-pointer items-center justify-center rounded-lg border-2 px-3 text-base font-semibold ${
                                checked
                                  ? "border-accent bg-accent text-accent-ink"
                                  : "border-line bg-paper text-ink"
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => toggleWeekday(medIndex, schedIndex, day)}
                                className="sr-only"
                              />
                              {strings.medicines.weekdayNames[day]}
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {schedule.frequency_type === "EVERY_N_DAYS" && (
                    <div className="flex flex-col gap-1">
                      <label
                        htmlFor={`interval-${medIndex}-${schedIndex}`}
                        className="font-semibold text-base"
                      >
                        {strings.medicines.intervalDays}
                      </label>
                      <input
                        id={`interval-${medIndex}-${schedIndex}`}
                        type="number"
                        min={2}
                        max={30}
                        value={schedule.interval_days}
                        required
                        className="min-h-12 w-32 rounded-lg border-2 border-line px-3 text-lg"
                        onChange={(e) =>
                          updateSchedule(medIndex, schedIndex, {
                            interval_days: Number(e.target.value),
                          })
                        }
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <TextField
                      id={`start-${medIndex}-${schedIndex}`}
                      label={strings.medicines.startDate}
                      type="date"
                      value={schedule.start_date}
                      required
                      onChange={(e) =>
                        updateSchedule(medIndex, schedIndex, {
                          start_date: e.target.value,
                        })
                      }
                    />
                    <div className="flex flex-col gap-1">
                      <TextField
                        id={`end-${medIndex}-${schedIndex}`}
                        label={strings.medicines.endDate}
                        type="date"
                        value={schedule.end_date}
                        onChange={(e) =>
                          updateSchedule(medIndex, schedIndex, {
                            end_date: e.target.value,
                          })
                        }
                      />
                      <p className="text-xs text-muted">{strings.medicines.endDateHint}</p>
                    </div>
                  </div>

                  <div>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => removeSchedule(medIndex, schedIndex)}
                      className="text-sm"
                    >
                      {strings.medicines.removeSchedule}
                    </Button>
                  </div>
                </div>
              ))}

              <div>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => addSchedule(medIndex)}
                >
                  {strings.medicines.addSchedule}
                </Button>
              </div>
            </div>

            {allowMultiple && drafts.length > 1 && (
              <div>
                <Button
                  type="button"
                  variant="danger"
                  onClick={() => removeMedicine(medIndex)}
                >
                  {strings.medicines.removeMedicine}
                </Button>
              </div>
            )}
          </Card>
        );
      })}

      {allowMultiple && (
        <div>
          <Button type="button" variant="secondary" onClick={addMedicine}>
            {strings.medicines.addMedicine}
          </Button>
        </div>
      )}

      <ErrorMessage error={error} />

      <div>
        <Button type="submit" disabled={busy}>
          {busy ? busyLabel : submitLabel}
        </Button>
      </div>
    </form>
  );
}
