"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { doseView, groupBySlot, type Dose, type DoseStatus } from "@/lib/doses/view";
import {
  enqueue,
  flushQueue,
  readQueue,
  type AckAction,
  type QueuedAck,
  type SendOutcome,
} from "@/lib/offline/ack-queue";
import { callApi } from "@/lib/client/call-api";
import { strings } from "@/strings/en";
import { Notice } from "@/components/ui/notice";
import { SlotIcon } from "./slot-icon";
import { DoseCard } from "./dose-card";

type PatientTodayProps = {
  patientId: string;
  patientName: string;
  timeZone: string;
  initialDoses: Dose[];
};

export function PatientToday({
  patientName,
  timeZone,
  initialDoses,
}: PatientTodayProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  const [prevInitial, setPrevInitial] = useState(initialDoses);
  const [doses, setDoses] = useState<Dose[]>(initialDoses);
  if (prevInitial !== initialDoses) {
    setPrevInitial(initialDoses);
    setDoses(initialDoses);
  }

  const [queuedIds, setQueuedIds] = useState<Set<string>>(new Set());
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [now, setNow] = useState<Date>(() => new Date());
  const [online, setOnline] = useState<boolean>(true);

  const sendItem = useCallback(
    async (item: QueuedAck): Promise<SendOutcome> => {
      const res = await callApi<{ status: DoseStatus; acknowledgedAt: string | null }>(
        `/api/reminders/${item.reminderId}/ack`,
        "POST",
        { action: item.action }
      );

      if (res.ok) {
        setDoses((prev) =>
          prev.map((d) =>
            d.reminder_id === item.reminderId
              ? { ...d, status: res.data.status, acknowledged_at: res.data.acknowledgedAt }
              : d
          )
        );
        setQueuedIds((prev) => {
          const next = new Set(prev);
          next.delete(item.reminderId);
          return next;
        });
        return "done";
      }

      const code = res.error.code;
      if (code === "OFFLINE" || code === "INTERNAL" || code === "RATE_LIMITED") {
        return "retry";
      }

      if (code === "TOO_EARLY") {
        setMessage(strings.patient.tooEarly);
        return "done";
      }

      setQueuedIds((prev) => {
        const next = new Set(prev);
        next.delete(item.reminderId);
        return next;
      });
      startTransition(() => {
        router.refresh();
      });
      return "done";
    },
    [router]
  );

  const triggerFlush = useCallback(async () => {
    if (typeof window === "undefined") return;
    const remaining = await flushQueue(window.localStorage, sendItem);
    setQueuedIds(new Set(remaining.map((item) => item.reminderId)));
  }, [sendItem]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    queueMicrotask(() => {
      setOnline(navigator.onLine);
      const existing = readQueue(window.localStorage);
      setQueuedIds(new Set(existing.map((item) => item.reminderId)));
    });

    function handleOnline() {
      setOnline(true);
      void triggerFlush();
    }
    function handleOffline() {
      setOnline(false);
    }

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    const clockTimer = setInterval(() => {
      setNow(new Date());
    }, 60_000);

    const refreshTimer = setInterval(() => {
      if (document.visibilityState === "visible" && navigator.onLine) {
        startTransition(() => {
          router.refresh();
        });
      }
    }, 5 * 60_000);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      clearInterval(clockTimer);
      clearInterval(refreshTimer);
    };
  }, [router, triggerFlush]);

  useEffect(() => {
    if (queuedIds.size === 0 || typeof window === "undefined") return;

    const interval = setInterval(() => {
      void triggerFlush();
    }, 30_000);

    return () => clearInterval(interval);
  }, [queuedIds, triggerFlush]);

  async function handleAck(dose: Dose, action: AckAction) {
    if (typeof window === "undefined") return;
    setBusyId(dose.reminder_id);
    const item: QueuedAck = {
      reminderId: dose.reminder_id,
      action,
      queuedAt: new Date().toISOString(),
    };
    enqueue(window.localStorage, item);
    setQueuedIds((prev) => new Set([...prev, dose.reminder_id]));
    await triggerFlush();
    setBusyId(null);
  }

  const firstName = patientName.trim().split(" ")[0] || patientName;
  const groups = groupBySlot(doses);

  const todayFormatted = new Intl.DateTimeFormat("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(now);

  return (
    <div className="flex flex-col gap-6">
      {!online && (
        <Notice tone="warning">{strings.patient.offlineBanner}</Notice>
      )}

      {message && (
        <div aria-live="polite" className="rounded-xl border border-warn bg-peach p-4 text-ink font-medium">
          {message}
        </div>
      )}

      <header className="flex flex-col gap-1.5 rounded-2xl bg-forest-deep p-5 text-white shadow-sm">
        <h1 className="text-2xl font-bold tracking-tight text-white">
          {strings.patient.greeting}, {firstName}
        </h1>
        <h2 className="text-base font-medium text-peach/90">
          {strings.patient.todayTitle}
        </h2>
      </header>

      <div className="flex items-center justify-between rounded-full border border-line bg-white px-4 py-2.5 shadow-2xs">
        <div className="flex items-center gap-2.5 text-forest">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 9v7.5" />
          </svg>
          <span className="text-sm font-bold text-ink">{todayFormatted}</span>
        </div>
        <span className="rounded-full bg-sage px-2.5 py-0.5 text-xs font-bold text-forest">Schedule</span>
      </div>

      {groups.length === 0 ? (
        <div className="rounded-2xl border border-line bg-white p-8 text-center text-base font-medium text-muted shadow-2xs">
          {strings.patient.noDoses}
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {groups.map((group) => (
            <section key={group.slot} className="flex flex-col gap-3">
              <div className="flex items-center gap-2.5 text-ink">
                <SlotIcon slot={group.slot} className="text-forest h-6 w-6" />
                <h3 className="text-xl font-bold">
                  {strings.slots[group.slot]}
                </h3>
              </div>
              <div className="flex flex-col gap-3">
                {group.doses.map((dose) => {
                  const isQueued = queuedIds.has(dose.reminder_id);
                  const view = doseView(dose, now, isQueued);
                  const isBusy = busyId === dose.reminder_id;

                  return (
                    <DoseCard
                      key={dose.reminder_id}
                      dose={dose}
                      view={view}
                      timeZone={timeZone}
                      busy={isBusy}
                      onAck={(action) => void handleAck(dose, action)}
                    />
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
