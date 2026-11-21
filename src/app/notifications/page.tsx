import { AppHeader } from "@/components/app-header";
import { requirePageUser } from "@/lib/auth/session";
import { NotificationList, type NotificationItem } from "./notification-list";

export default async function NotificationsPage() {
  const { supabase, user } = await requirePageUser("/notifications");

  const { data: notifications } = await supabase
    .from("notifications")
    .select("id, kind, data, created_at, read_at, patient_id, patients(full_name, timezone)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(100);

  const items: NotificationItem[] = (notifications ?? []).map((n) => {
    const p = Array.isArray(n.patients) ? n.patients[0] : n.patients;
    return {
      id: n.id,
      kind: n.kind,
      data: (n.data as Record<string, unknown>) ?? {},
      created_at: n.created_at,
      read_at: n.read_at,
      patient_id: n.patient_id,
      patient_name: p?.full_name ?? null,
      timezone: p?.timezone ?? "Asia/Kolkata",
    };
  });

  return (
    <>
      <AppHeader />
      <main className="mx-auto flex max-w-4xl flex-col gap-6 p-4">
        <NotificationList items={items} />
      </main>
    </>
  );
}
