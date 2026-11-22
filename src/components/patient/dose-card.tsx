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
    borderClass = "border-forest/40 bg-sage-light/30";
  } else if (view === "missed") {
    borderClass = "border-terracotta/50 bg-peach-light/40";
  } else if (view === "due") {
    borderClass = "border-forest bg-white shadow-md ring-2 ring-forest/10";
  }

  return (
    <article
      aria-labelledby={headingId}
      className={`flex flex-col gap-4 rounded-2xl border bg-white p-5 shadow-[0_2px_12px_-4px_rgba(24,56,45,0.06)] transition-all ${borderClass}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3.5">
          <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-base font-bold">
            {view === "taken" ? (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-forest text-white">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                </svg>
              </div>
            ) : view === "due" ? (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-peach text-terracotta-ink">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
              </div>
            ) : view === "missed" ? (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-peach text-terracotta-ink">
                !
              </div>
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-surface text-muted">
                <div className="h-3 w-3 rounded-full border-2 border-muted" />
              </div>
            )}
          </div>

          <div className="flex flex-col">
            <h3 id={headingId} className="text-xl font-bold tracking-tight text-ink">
              {dose.medication_name}
            </h3>
            <span className="text-sm font-semibold text-muted">
              {dose.dosage} · {strings.patient.at} {scheduledTime}
            </span>
            {dose.instructions && (
              <p className="mt-1 text-sm text-muted">{dose.instructions}</p>
            )}
          </div>
        </div>

        <div>
          {view === "taken" && (
            <span className="inline-flex items-center gap-1 rounded-full bg-sage-soft px-3 py-1 text-xs font-bold text-forest">
              <span>Taken</span>
              <span>✓</span>
            </span>
          )}
          {view === "due" && (
            <span className="rounded-full bg-peach px-3 py-1 text-xs font-bold text-terracotta-ink">
              Due
            </span>
          )}
          {view === "later" && (
            <span className="rounded-full bg-surface px-3 py-1 text-xs font-semibold text-muted">
              {strings.patient.later}
            </span>
          )}
          {view === "missed" && (
            <span className="rounded-full bg-peach px-3 py-1 text-xs font-bold text-terracotta-ink">
              {strings.patient.missed}
            </span>
          )}
          {view === "skipped" && (
            <span className="rounded-full bg-surface px-3 py-1 text-xs font-semibold text-muted">
              {strings.patient.skipped}
            </span>
          )}
        </div>
      </div>

      {view === "due" && (
        <div className="flex flex-col gap-3 pt-1 border-t border-line/60">
          {!confirmingSkip ? (
            <>
              <Button
                type="button"
                variant="primary"
                disabled={busy}
                onClick={() => onAck("ACKNOWLEDGED")}
                className="w-full min-h-14 rounded-full text-xl shadow-sm"
              >
                {strings.patient.tookIt}
              </Button>
              <Button
                type="button"
                variant="secondary"
                disabled={busy}
                onClick={() => setConfirmingSkip(true)}
                className="w-full min-h-12 rounded-full text-base"
              >
                {strings.patient.didNotTake}
              </Button>
            </>
          ) : (
            <div className="flex flex-col gap-3 rounded-2xl border border-line bg-surface/50 p-4">
              <p className="text-base font-semibold text-ink">
                {strings.patient.confirmSkip}
              </p>
              <div className="flex flex-col gap-2">
                <Button
                  type="button"
                  variant="danger"
                  disabled={busy}
                  onClick={() => onAck("SKIPPED")}
                  className="w-full min-h-12 rounded-full text-base"
                >
                  {strings.patient.yesSkip}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  disabled={busy}
                  onClick={() => setConfirmingSkip(false)}
                  className="w-full min-h-12 rounded-full text-base"
                >
                  {strings.patient.noGoBack}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {view === "taken" && (
        <div className="flex items-center gap-2 pt-1 text-sm font-semibold text-forest">
          <span>✓</span>
          <span>
            {strings.patient.takenAt} {takenTime}
          </span>
        </div>
      )}

      {view === "missed" && (
        <div className="flex flex-col gap-3 pt-1 border-t border-line/60">
          <p className="text-xs text-muted">{strings.patient.noAdvice}</p>
          <Button
            type="button"
            variant="primary"
            disabled={busy}
            onClick={() => onAck("ACKNOWLEDGED")}
            className="w-full min-h-14 rounded-full text-lg"
          >
            {strings.patient.tookIt}
          </Button>
        </div>
      )}

      {view === "queued" && (
        <div
          role="status"
          className="rounded-xl border border-line bg-surface p-3 text-sm font-medium text-muted"
        >
          {strings.patient.queued}
        </div>
      )}
    </article>
  );
}
