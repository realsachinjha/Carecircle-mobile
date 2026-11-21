"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { strings } from "@/strings/en";

export function LiveRefresh({ patientId }: { patientId: string }) {
  const router = useRouter();
  const throttleRef = useRef(false);

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
        .channel(`live-patient-${patientId}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "medication_reminders",
            filter: `patient_id=eq.${patientId}`,
          },
          () => {
            if (throttleRef.current) {
              return;
            }
            throttleRef.current = true;
            router.refresh();
            setTimeout(() => {
              throttleRef.current = false;
            }, 1000);
          },
        )
        .subscribe();
    });

    return () => {
      cancelled = true;
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [patientId, router]);

  return (
    <div className="flex items-center gap-2 text-sm text-muted" aria-live="polite">
      <span className="inline-block h-2 w-2 rounded-full bg-ok" aria-hidden="true" />
      <span>{strings.dashboard.live}</span>
    </div>
  );
}
