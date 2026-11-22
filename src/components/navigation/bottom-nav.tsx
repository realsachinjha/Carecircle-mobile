"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { strings } from "@/strings/en";

export function BottomNav({ patientId }: { patientId?: string }) {
  const pathname = usePathname();
  const [quickOpen, setQuickOpen] = useState(false);

  const homeHref = patientId ? `/patients/${patientId}` : "/patients";
  const recordsHref = patientId ? `/patients/${patientId}/documents` : "/patients";
  const careHref = patientId ? `/patients/${patientId}/people` : "/me";
  const profileHref = "/account";

  const isHome = pathname === homeHref || pathname === "/patients";
  const isRecords = pathname.includes("/documents");
  const isCare = pathname.includes("/people") || pathname === "/me";
  const isProfile = pathname === "/account" || pathname.includes("/edit");

  return (
    <>
      {quickOpen ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={strings.nav.quickActions}
          className="fixed inset-0 z-40 flex flex-col justify-end pb-24"
        >
          <div
            className="fixed inset-0 bg-ink/40 backdrop-blur-xs transition-opacity"
            onClick={() => setQuickOpen(false)}
            aria-hidden="true"
          />
          <div className="relative z-50 mx-4 rounded-3xl border border-line-soft bg-white p-4 shadow-2xl sm:mx-auto sm:w-full sm:max-w-md">
            <div className="flex flex-col gap-1">
              <Link
                href={patientId ? `/patients/${patientId}/medicines/new` : "/patients"}
                onClick={() => setQuickOpen(false)}
                className="flex items-center gap-3.5 rounded-2xl p-3 text-base font-semibold text-ink transition-colors hover:bg-sage-soft active:bg-sage"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sage-soft text-forest">
                  <svg className="h-5 w-5 rotate-45" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75" />
                  </svg>
                </div>
                <span>{strings.quickActions.addMedicine}</span>
              </Link>

              <Link
                href={patientId ? `/patients/${patientId}/documents/upload` : "/patients"}
                onClick={() => setQuickOpen(false)}
                className="flex items-center gap-3.5 rounded-2xl p-3 text-base font-semibold text-ink transition-colors hover:bg-sage-soft active:bg-sage"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sage-soft text-forest">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
                  </svg>
                </div>
                <span>{strings.quickActions.uploadPrescription}</span>
              </Link>

              <Link
                href={patientId ? `/patients/${patientId}/checkups/new` : "/patients"}
                onClick={() => setQuickOpen(false)}
                className="flex items-center gap-3.5 rounded-2xl p-3 text-base font-semibold text-ink transition-colors hover:bg-sage-soft active:bg-sage"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sage-soft text-forest">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 9v7.5" />
                  </svg>
                </div>
                <span>{strings.quickActions.addCheckup}</span>
              </Link>

              <Link
                href={patientId ? `/patients/${patientId}/people` : "/patients"}
                onClick={() => setQuickOpen(false)}
                className="flex items-center gap-3.5 rounded-2xl p-3 text-base font-semibold text-ink transition-colors hover:bg-sage-soft active:bg-sage"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sage-soft text-forest">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM3 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 9.374 21c-2.331 0-4.512-.645-6.374-1.765Z" />
                  </svg>
                </div>
                <span>{strings.quickActions.inviteCaregiver}</span>
              </Link>
            </div>
          </div>
        </div>
      ) : null}

      <nav
        aria-label="Bottom Navigation"
        className="fixed bottom-0 left-0 right-0 z-40 border-t border-line-soft bg-white/95 backdrop-blur-md"
      >
        <div className="mx-auto flex max-w-md items-center justify-around px-3 py-2">
          <Link
            href={homeHref}
            className={`flex flex-col items-center justify-center gap-1 rounded-xl px-2 py-1 text-xs font-semibold transition-colors ${
              isHome ? "text-forest" : "text-muted hover:text-ink"
            }`}
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={isHome ? 2.5 : 2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
            </svg>
            <span>{strings.nav.home}</span>
          </Link>

          <Link
            href={recordsHref}
            className={`flex flex-col items-center justify-center gap-1 rounded-xl px-2 py-1 text-xs font-semibold transition-colors ${
              isRecords ? "text-forest" : "text-muted hover:text-ink"
            }`}
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={isRecords ? 2.5 : 2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
            </svg>
            <span>{strings.nav.records}</span>
          </Link>

          <button
            type="button"
            aria-label={quickOpen ? strings.quickActions.close : strings.nav.quickActions}
            aria-expanded={quickOpen}
            onClick={() => setQuickOpen(!quickOpen)}
            className="relative -mt-6 flex h-14 w-14 items-center justify-center rounded-full bg-forest text-white shadow-lg ring-4 ring-ivory transition-transform active:scale-95 hover:bg-forest-deep focus:outline-none focus:ring-2 focus:ring-forest"
          >
            {quickOpen ? (
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
            )}
          </button>

          <Link
            href={careHref}
            className={`flex flex-col items-center justify-center gap-1 rounded-xl px-2 py-1 text-xs font-semibold transition-colors ${
              isCare ? "text-forest" : "text-muted hover:text-ink"
            }`}
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={isCare ? 2.5 : 2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
            </svg>
            <span>{strings.nav.care}</span>
          </Link>

          <Link
            href={profileHref}
            className={`flex flex-col items-center justify-center gap-1 rounded-xl px-2 py-1 text-xs font-semibold transition-colors ${
              isProfile ? "text-forest" : "text-muted hover:text-ink"
            }`}
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={isProfile ? 2.5 : 2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
            </svg>
            <span>{strings.nav.profile}</span>
          </Link>
        </div>
      </nav>
    </>
  );
}
