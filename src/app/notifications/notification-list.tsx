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
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{strings.notifications.title}</h1>
        {hasUnread ? (
          <button
            type="button"
            onClick={() => markRead()}
            disabled={submitting}
            className="rounded bg-accent px-4 py-2 font-semibold text-accent-ink disabled:opacity-50"
          >
            {strings.notifications.markAllRead}
          </button>
        ) : null}
      </div>

      {items.length === 0 ? (
        <p className="text-muted">{strings.notifications.empty}</p>
      ) : (
        <ul className="flex flex-col divide-y divide-line rounded border border-line bg-paper">
          {items.map((item) => {
            const tz = item.timezone || "Asia/Kolkata";
            const rendered = renderNotification(item.kind, item.data, tz);
            const link = notificationLink(item.kind, item.data, item.patient_id);
            const isUnread = !item.read_at;
            const when = `${dateInZone(item.created_at, tz)} at ${timeInZone(item.created_at, tz)}`;

            return (
              <li key={item.id} className="flex flex-col gap-2 p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    {item.patient_name ? (
                      <span className="text-xs font-semibold uppercase tracking-wider text-muted">
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
                      <p className={`text-sm ${isUnread ? "font-medium" : "text-muted"}`}>
                        {rendered.body}
                      </p>
                    ) : null}
                    <span className="text-xs text-muted">{when}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {link ? (
                      <Link
                        href={link}
                        className="min-h-12 px-3 text-sm font-semibold underline"
                      >
                        {strings.notifications.open}
                      </Link>
                    ) : null}
                    {isUnread ? (
                      <button
                        type="button"
                        onClick={() => markRead([item.id])}
                        disabled={submitting}
                        className="min-h-12 px-3 text-sm font-semibold text-accent underline disabled:opacity-50"
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
