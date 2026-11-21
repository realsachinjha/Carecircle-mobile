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

  return (
    <div className="flex flex-col gap-6">
      {!online && (
        <Notice tone="warning">{strings.patient.offlineBanner}</Notice>
      )}

      {message && (
        <div aria-live="polite" className="rounded-lg border border-warn bg-panel p-4 text-warn">
          {message}
        </div>
      )}

      <header className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold text-ink">
          {strings.patient.greeting}, {firstName}
        </h1>
        <h2 className="text-2xl font-semibold text-muted">
          {strings.patient.todayTitle}
        </h2>
      </header>

      {groups.length === 0 ? (
        <div className="rounded-xl border border-line bg-paper p-8 text-center text-xl text-muted">
          {strings.patient.noDoses}
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          {groups.map((group) => (
            <section key={group.slot} className="flex flex-col gap-4">
              <div className="flex items-center gap-3 text-ink">
                <SlotIcon slot={group.slot} className="text-accent" />
                <h3 className="text-2xl font-bold">
                  {strings.slots[group.slot]}
                </h3>
              </div>
              <div className="flex flex-col gap-4">
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
