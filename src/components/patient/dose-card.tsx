"use client";

import { useState } from "react";
import type { Dose, DoseView } from "@/lib/doses/view";
import type { AckAction } from "@/lib/offline/ack-queue";
import { timeInZone } from "@/lib/time/local-date";
import { strings } from "@/strings/en";
import { Button } from "@/components/ui/button";

type DoseCardProps = {
  dose: Dose;
  view: DoseView;
  timeZone: string;
  onAck: (action: AckAction) => void;
  busy: boolean;
};

export function DoseCard({ dose, view, timeZone, onAck, busy }: DoseCardProps) {
  const [confirmingSkip, setConfirmingSkip] = useState(false);

  const headingId = `dose-name-${dose.reminder_id}`;
  const scheduledTime = timeInZone(dose.scheduled_for, timeZone);
  const takenTime = dose.acknowledged_at
    ? timeInZone(dose.acknowledged_at, timeZone)
    : "";

  let borderClass = "border-line";
  if (view === "taken") {
    borderClass = "border-ok";
  } else if (view === "missed") {
    borderClass = "border-warn";
  } else if (view === "due") {
    borderClass = "border-accent";
  }

  return (
    <article
      aria-labelledby={headingId}
      className={`flex flex-col gap-4 rounded-xl border-2 bg-paper p-5 ${borderClass}`}
    >
      <div className="flex flex-col gap-1">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h3 id={headingId} className="text-2xl font-semibold text-ink">
            {dose.medication_name}
          </h3>
          <span className="text-xl font-medium text-ink">{dose.dosage}</span>
        </div>
        <p className="text-lg text-muted">
          {strings.patient.at} {scheduledTime}
        </p>
        {dose.instructions && (
          <p className="text-xl text-muted">{dose.instructions}</p>
        )}
      </div>

      {view === "due" && (
        <div className="flex flex-col gap-3 pt-2">
          {!confirmingSkip ? (
            <>
              <Button
                type="button"
                variant="primary"
                disabled={busy}
                onClick={() => onAck("ACKNOWLEDGED")}
                className="w-full min-h-16 text-2xl"
              >
                {strings.patient.tookIt}
              </Button>
              <Button
                type="button"
                variant="secondary"
                disabled={busy}
                onClick={() => setConfirmingSkip(true)}
                className="w-full min-h-14 text-xl"
              >
                {strings.patient.didNotTake}
              </Button>
            </>
          ) : (
            <div className="flex flex-col gap-3 rounded-lg border border-line bg-panel p-4">
              <p className="text-xl font-medium text-ink">
                {strings.patient.confirmSkip}
              </p>
              <div className="flex flex-col gap-2">
                <Button
                  type="button"
                  variant="danger"
                  disabled={busy}
                  onClick={() => onAck("SKIPPED")}
                  className="w-full min-h-14 text-xl"
                >
                  {strings.patient.yesSkip}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  disabled={busy}
                  onClick={() => setConfirmingSkip(false)}
                  className="w-full min-h-14 text-xl"
                >
                  {strings.patient.noGoBack}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {view === "later" && (
        <div className="pt-2 text-xl font-medium text-muted">
          {strings.patient.later}
        </div>
      )}

      {view === "taken" && (
        <div className="flex items-center gap-2 pt-2 text-xl font-semibold text-ok">
          <span aria-hidden="true">✓</span>
          <span>
            {strings.patient.takenAt} {takenTime}
          </span>
        </div>
      )}

      {view === "skipped" && (
        <div className="pt-2 text-xl font-medium text-muted">
          {strings.patient.skipped}
        </div>
      )}

      {view === "missed" && (
        <div className="flex flex-col gap-3 pt-2">
          <span className="text-xl font-semibold text-warn">
            {strings.patient.missed}
          </span>
          <p className="text-base text-muted">{strings.patient.noAdvice}</p>
          <Button
            type="button"
            variant="primary"
            disabled={busy}
            onClick={() => onAck("ACKNOWLEDGED")}
            className="w-full min-h-16 text-2xl"
          >
            {strings.patient.tookIt}
          </Button>
        </div>
      )}

      {view === "queued" && (
        <div
          role="status"
          className="rounded-lg border border-line bg-panel p-3 text-lg font-medium text-muted"
        >
          {strings.patient.queued}
        </div>
      )}
    </article>
  );
}
