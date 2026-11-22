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
    <Link
      href="/notifications"
      aria-label={strings.notifications.bellLabel}
      className="relative flex h-11 w-11 items-center justify-center rounded-full text-ink transition-colors hover:bg-sage-soft hover:text-forest"
    >
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
      </svg>
      <span className="sr-only">{strings.notifications.bellLabel}</span>
      {unread > 0 ? (
        <span
          className="absolute top-1.5 right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-terracotta px-1 text-[10px] font-bold text-white shadow-xs"
          aria-label={`${unread} ${strings.notifications.unread}`}
        >
          {unread}
        </span>
      ) : null}
    </Link>
  );
}
