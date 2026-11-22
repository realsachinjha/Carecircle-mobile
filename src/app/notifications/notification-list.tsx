"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { notificationLink, renderNotification } from "@/lib/notifications/render";
import { dateInZone, timeInZone } from "@/lib/time/local-date";
import { strings } from "@/strings/en";

export type NotificationItem = {
  id: string;
  kind: string;
  data: Record<string, unknown>;
  created_at: string;
  read_at: string | null;
  patient_id?: string | null;
  patient_name?: string | null;
  timezone?: string | null;
};

export function NotificationList({ items }: { items: NotificationItem[] }) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const hasUnread = items.some((item) => !item.read_at);

  async function markRead(ids?: string[]) {
    setSubmitting(true);
    try {
      const body = ids ? { ids } : { all: true };
      const res = await fetch("/api/notifications/read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        router.refresh();
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between rounded-2xl bg-forest-deep px-5 py-4 text-white shadow-sm">
        <h1 className="text-2xl font-bold tracking-tight">{strings.notifications.title}</h1>
        {hasUnread ? (
          <button
            type="button"
            onClick={() => markRead()}
            disabled={submitting}
            className="inline-flex min-h-10 items-center justify-center rounded-full bg-terracotta px-4 py-1.5 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-terracotta-dark disabled:opacity-50"
          >
            {strings.notifications.markAllRead}
          </button>
        ) : null}
      </div>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-line bg-white p-8 text-center text-sm font-medium text-muted">
          {strings.notifications.empty}
        </div>
      ) : (
        <ul className="flex flex-col divide-y divide-line rounded-2xl border border-line bg-white shadow-[0_2px_12px_-4px_rgba(24,56,45,0.06)] overflow-hidden">
          {items.map((item) => {
            const tz = item.timezone || "Asia/Kolkata";
            const rendered = renderNotification(item.kind, item.data, tz);
            const link = notificationLink(item.kind, item.data, item.patient_id);
            const isUnread = !item.read_at;
            const when = `${dateInZone(item.created_at, tz)} at ${timeInZone(item.created_at, tz)}`;

            return (
              <li
                key={item.id}
                className={`flex flex-col gap-2 p-4 transition-colors ${
                  isUnread ? "bg-sage-light/60" : "bg-white hover:bg-surface/30"
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="mt-1">
                      {isUnread ? (
                        <div className="h-2.5 w-2.5 rounded-full bg-terracotta ring-4 ring-peach" />
                      ) : (
                        <div className="h-2.5 w-2.5 rounded-full bg-line" />
                      )}
                    </div>
                    <div className="flex flex-col">
                      {item.patient_name ? (
                        <span className="text-xs font-bold uppercase tracking-wider text-muted">
                          {item.patient_name}
                        </span>
                      ) : null}
                      <h3
                        className={`text-base ${
                          isUnread ? "font-bold text-ink" : "font-medium text-muted"
                        }`}
                      >
                        {rendered.title}
                      </h3>
                      {rendered.body ? (
                        <p className={`text-sm ${isUnread ? "font-semibold text-ink" : "text-muted"}`}>
                          {rendered.body}
                        </p>
                      ) : null}
                      <span className="text-xs text-muted mt-1">{when}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {link ? (
                      <Link
                        href={link}
                        className="inline-flex min-h-9 items-center justify-center rounded-full border border-forest/20 bg-sage-soft px-3 py-1 text-xs font-semibold text-forest hover:bg-sage"
                      >
                        {strings.common.reference}
                      </Link>
                    ) : null}
                    {isUnread ? (
                      <button
                        type="button"
                        onClick={() => markRead([item.id])}
                        disabled={submitting}
                        className="inline-flex min-h-9 items-center justify-center rounded-full px-3 py-1 text-xs font-semibold text-muted hover:text-ink disabled:opacity-50"
                      >
                        {strings.notifications.markRead}
                      </button>
                    ) : null}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
