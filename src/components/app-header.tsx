import Link from "next/link";
import { CareCircleIcon } from "@/components/brand/carecircle-logo";
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
    <header className="border-b border-line-soft bg-white/95 text-ink backdrop-blur-md">
      <nav className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
        <Link href="/start" className="flex items-center gap-2.5 text-xl font-bold tracking-tight text-forest-deep">
          <CareCircleIcon size={34} />
          <span>{strings.appName}</span>
        </Link>

        <div className="flex items-center gap-1.5 sm:gap-2">
          {showCaregiverNav ? (
            <Link
              href="/patients"
              className="hidden rounded-full px-3 py-1.5 text-xs font-semibold text-muted transition-colors hover:bg-sage-soft hover:text-forest sm:inline-block"
            >
              {strings.nav.patients}
            </Link>
          ) : null}

          <Link
            href="/account"
            className="hidden rounded-full px-3 py-1.5 text-xs font-semibold text-muted transition-colors hover:bg-sage-soft hover:text-forest sm:inline-block"
          >
            {strings.nav.account}
          </Link>

          {user ? <NotificationBell userId={user.id} initialUnread={unreadCount} /> : null}

          {user ? (
            <form action="/auth/sign-out" method="post" className="inline-flex">
              <button
                type="submit"
                className="rounded-full px-2.5 py-1 text-xs font-semibold text-muted transition-colors hover:bg-sage-soft hover:text-forest"
              >
                {strings.nav.signOut}
              </button>
            </form>
          ) : null}

          {user ? (
            <div className="ml-1 flex h-8 w-8 items-center justify-center rounded-full bg-sage-soft text-xs font-bold text-forest border border-sage">
              {user.email?.slice(0, 1).toUpperCase() ?? "U"}
            </div>
          ) : null}
        </div>
      </nav>
    </header>
  );
}
