import Link from "next/link";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { strings } from "@/strings/en";

export async function AppHeader({ showCaregiverNav = true }: { showCaregiverNav?: boolean }) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let unreadCount = 0;
  if (user) {
    const { count } = await supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .is("read_at", null);
    unreadCount = count ?? 0;
  }

  return (
    <header className="border-b border-line bg-panel">
      <nav className="mx-auto flex max-w-4xl flex-wrap items-center gap-4 p-4">
        <Link href="/start" className="text-xl font-bold">
          {strings.appName}
        </Link>
        {showCaregiverNav ? (
          <Link href="/patients" className="underline">
            {strings.nav.patients}
          </Link>
        ) : null}
        <Link href="/account" className="underline">
          {strings.nav.account}
        </Link>
        {user ? <NotificationBell userId={user.id} initialUnread={unreadCount} /> : null}
        <form action="/auth/sign-out" method="post" className="ml-auto">
          <button type="submit" className="min-h-12 px-2 underline">
            {strings.nav.signOut}
          </button>
        </form>
      </nav>
    </header>
  );
}
