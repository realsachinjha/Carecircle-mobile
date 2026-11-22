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
    <header className="border-b border-forest-dark/40 bg-forest-deep text-white shadow-sm">
      <nav className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <Link href="/start" className="flex items-center gap-2.5 text-xl font-bold tracking-tight text-white">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-peach text-forest-deep shadow-xs">
            <svg className="h-5 w-5 fill-terracotta" viewBox="0 0 24 24">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
          </div>
          <span>{strings.appName}</span>
        </Link>

        <div className="flex flex-wrap items-center gap-1 sm:gap-2">
          {showCaregiverNav ? (
            <Link
              href="/patients"
              className="rounded-full px-3 py-1.5 text-sm font-medium text-white/90 transition-colors hover:bg-white/10 hover:text-white"
            >
              {strings.nav.patients}
            </Link>
          ) : null}

          <Link
            href="/account"
            className="rounded-full px-3 py-1.5 text-sm font-medium text-white/90 transition-colors hover:bg-white/10 hover:text-white"
          >
            {strings.nav.account}
          </Link>

          {user ? <NotificationBell userId={user.id} initialUnread={unreadCount} /> : null}

          <form action="/auth/sign-out" method="post" className="inline-flex">
            <button
              type="submit"
              className="rounded-full px-3 py-1.5 text-sm font-medium text-white/80 transition-colors hover:bg-white/10 hover:text-white"
            >
              {strings.nav.signOut}
            </button>
          </form>

          {user ? (
            <div className="ml-1 hidden h-8 w-8 items-center justify-center rounded-full bg-sage text-xs font-bold text-forest sm:flex">
              {user.email?.slice(0, 1).toUpperCase() ?? "U"}
            </div>
          ) : null}
        </div>
      </nav>
    </header>
  );
}
