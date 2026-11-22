import Link from "next/link";
import { formatPatientAge } from "@/lib/patients/age";
import type { PatientRole } from "@/lib/patients/context";
import { strings } from "@/strings/en";

export function PatientHeaderBanner({
  patient,
  role,
}: {
  patient: { id: string; full_name: string; date_of_birth: string };
  role: PatientRole;
}) {
  const age = formatPatientAge(patient.date_of_birth);
  const initials = patient.full_name
    .split(" ")
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <Link
      href="/patients"
      className="group flex items-center justify-between gap-3 rounded-2xl border border-line bg-white p-3.5 shadow-[0_2px_10px_-3px_rgba(24,56,45,0.06)] transition-all hover:border-forest/30 hover:bg-sage-light"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-peach text-forest-deep font-bold text-base shadow-xs">
          {initials}
        </div>
        <div className="flex flex-col">
          <h1 className="text-xl font-bold tracking-tight text-ink group-hover:text-forest">
            {patient.full_name}
          </h1>
          <p className="text-xs font-medium text-muted">
            {age} {strings.medicines.describe.days.toLowerCase()} • {strings.patients.yourRole}: {strings.roles[role]}
          </p>
        </div>
      </div>
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-surface text-muted transition-colors group-hover:bg-sage group-hover:text-forest">
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
        </svg>
      </div>
    </Link>
  );
}
