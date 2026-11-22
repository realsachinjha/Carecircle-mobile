import Link from "next/link";
import type { PatientRole } from "@/lib/patients/context";
import { strings } from "@/strings/en";

export function PatientHeaderBanner({
  patient,
  role,
}: {
  patient: { id: string; full_name: string; date_of_birth: string };
  role: PatientRole;
}) {
  const initial = (patient.full_name.trim()[0] ?? "P").toUpperCase();

  return (
    <Link
      href="/patients"
      className="group flex items-center justify-between gap-3 rounded-2xl border border-line-soft bg-white p-4 shadow-xs transition-colors hover:border-forest/20 hover:bg-sage-soft/30"
    >
      <div className="flex items-center gap-3.5">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-sage font-bold text-lg text-forest shadow-xs">
          {initial}
        </div>
        <div className="flex flex-col">
          <h1 className="text-lg font-bold tracking-tight text-ink group-hover:text-forest">
            {patient.full_name}
          </h1>
          <div className="mt-0.5 flex items-center gap-2">
            <span className="rounded-full bg-sage-soft px-2.5 py-0.5 text-xs font-semibold text-forest">
              {strings.patients.yourRole}: {strings.roles[role]}
            </span>
          </div>
        </div>
      </div>
      <div className="flex h-8 w-8 items-center justify-center rounded-full text-muted transition-colors group-hover:text-forest">
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
        </svg>
      </div>
    </Link>
  );
}
