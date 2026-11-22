import Link from "next/link";
import { AccountForm } from "./account-form";
import { AppHeader } from "@/components/app-header";
import { BottomNav } from "@/components/navigation/bottom-nav";
import { requirePageUser } from "@/lib/auth/session";
import { strings } from "@/strings/en";

export default async function AccountPage() {
  const { supabase, user } = await requirePageUser("/account");
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, phone, email")
    .eq("id", user.id)
    .single();

  const fullName = profile?.full_name || user.user_metadata?.full_name || "Caregiver";
  const email = profile?.email || user.email || "";
  const initials = fullName
    .split(" ")
    .map((w: string) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase() || "CC";

  return (
    <div className="min-h-screen bg-ivory text-ink pb-28">
      <AppHeader />
      <main className="mx-auto flex max-w-md flex-col gap-5 p-4">
        <div className="relative flex items-center justify-between py-1">
          <Link
            href="/patients"
            className="flex h-10 w-10 items-center justify-center rounded-full text-ink hover:bg-sage-soft"
            aria-label={strings.common.back}
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
            </svg>
          </Link>
          <h1 className="text-xl font-bold tracking-tight text-ink sm:text-2xl">
            {strings.account.profile}
          </h1>
          <div className="h-10 w-10" aria-hidden="true" />
        </div>

        <div className="my-2 flex flex-col items-center text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-sage font-extrabold text-2xl text-forest shadow-xs">
            {initials}
          </div>
          <h2 className="mt-3 text-xl font-bold text-ink">{fullName}</h2>
          <p className="text-sm font-medium text-muted">{email}</p>
        </div>

        <div className="flex flex-col gap-3">
          <details className="group rounded-2xl border border-line-soft bg-white p-4 shadow-xs" open>
            <summary className="flex cursor-pointer items-center justify-between list-none">
              <div className="flex items-center gap-3.5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sage-soft text-forest">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                  </svg>
                </div>
                <span className="text-base font-semibold text-ink">{strings.account.myDetails}</span>
              </div>
              <svg className="h-5 w-5 text-muted transition-transform group-open:rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
              </svg>
            </summary>
            <div className="mt-4 border-t border-line-soft pt-4">
              <AccountForm
                email={email}
                initialFullName={profile?.full_name ?? ""}
                initialPhone={profile?.phone ?? ""}
              />
            </div>
          </details>

          <Link
            href="/patients"
            className="flex items-center justify-between rounded-2xl border border-line-soft bg-white p-4 shadow-xs transition-colors hover:bg-sage-soft/30"
          >
            <div className="flex items-center gap-3.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sage-soft text-forest">
                <svg className="h-5 w-5 rotate-45" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75" />
                </svg>
              </div>
              <span className="text-base font-semibold text-ink">{strings.account.medicinesMenu}</span>
            </div>
            <svg className="h-5 w-5 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
            </svg>
          </Link>

          <Link
            href="/patients"
            className="flex items-center justify-between rounded-2xl border border-line-soft bg-white p-4 shadow-xs transition-colors hover:bg-sage-soft/30"
          >
            <div className="flex items-center gap-3.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sage-soft text-forest">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 9v7.5" />
                </svg>
              </div>
              <span className="text-base font-semibold text-ink">{strings.account.checkupsMenu}</span>
            </div>
            <svg className="h-5 w-5 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
            </svg>
          </Link>

          <Link
            href="/notifications"
            className="flex items-center justify-between rounded-2xl border border-line-soft bg-white p-4 shadow-xs transition-colors hover:bg-sage-soft/30"
          >
            <div className="flex items-center gap-3.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sage-soft text-forest">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
                </svg>
              </div>
              <span className="text-base font-semibold text-ink">{strings.account.notificationsMenu}</span>
            </div>
            <svg className="h-5 w-5 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
            </svg>
          </Link>

          <Link
            href="/patients"
            className="flex items-center justify-between rounded-2xl border border-line-soft bg-white p-4 shadow-xs transition-colors hover:bg-sage-soft/30"
          >
            <div className="flex items-center gap-3.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sage-soft text-forest">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                </svg>
              </div>
              <span className="text-base font-semibold text-ink">{strings.account.privacySecurityMenu}</span>
            </div>
            <svg className="h-5 w-5 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
            </svg>
          </Link>
        </div>

        <form action="/auth/sign-out" method="post" className="mt-4">
          <button
            type="submit"
            className="flex min-h-12 w-full items-center justify-center rounded-full border border-terracotta/30 bg-peach/40 px-6 text-sm font-semibold text-terracotta-dark shadow-xs transition-colors hover:bg-peach"
          >
            {strings.nav.signOut}
          </button>
        </form>
      </main>
      <BottomNav />
    </div>
  );
}
