"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { strings } from "@/strings/en";

export function NotificationBell({ userId, initialUnread }: { userId: string; initialUnread: number }) {
  const [unread, setUnread] = useState(initialUnread);
  const [prevInitial, setPrevInitial] = useState(initialUnread);

  if (prevInitial !== initialUnread) {
    setPrevInitial(initialUnread);
    setUnread(initialUnread);
  }

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let cancelled = false;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (cancelled) {
        return;
      }
      if (session?.access_token) {
        supabase.realtime.setAuth(session.access_token);
      }
      channel = supabase
        .channel(`notifications-${userId}`)
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
          () => setUnread((count) => count + 1),
        )
        .subscribe();
    });

    return () => {
      cancelled = true;
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [userId]);

  return (
    <Link href="/notifications" className="relative inline-flex min-h-12 items-center gap-2 px-2 underline">
      <span>{strings.notifications.bellLabel}</span>
      {unread > 0 ? (
        <span className="rounded-full bg-danger px-2 text-base font-bold text-accent-ink" aria-label={`${unread} ${strings.notifications.unread}`}>
          {unread}
        </span>
      ) : null}
    </Link>
  );
}
