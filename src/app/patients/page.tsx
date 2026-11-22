import Link from "next/link";
import { AppHeader } from "@/components/app-header";
import { BottomNav } from "@/components/navigation/bottom-nav";
import { requirePageUser } from "@/lib/auth/session";
import { formatPatientAge } from "@/lib/patients/age";
import { strings } from "@/strings/en";

type CaregiverRow = {
  role: "OWNER" | "CAREGIVER" | "VIEWER";
  patients: {
    id: string;
    full_name: string;
    date_of_birth: string;
  } | null;
};

export default async function PatientsPage() {
  const { supabase, user } = await requirePageUser("/patients");
  const { data } = await supabase
    .from("caregiver_links")
    .select("role, patients(id, full_name, date_of_birth)")
    .eq("user_id", user.id)
    .eq("status", "ACTIVE");

  const rows = ((data as unknown as CaregiverRow[]) ?? [])
    .filter((row): row is CaregiverRow & { patients: NonNullable<CaregiverRow["patients"]> } => Boolean(row.patients))
    .sort((a, b) => a.patients.full_name.localeCompare(b.patients.full_name));

  return (
    <div className="min-h-screen bg-ivory text-ink pb-28">
      <AppHeader />
      <main className="mx-auto flex max-w-md flex-col gap-5 p-4">
        <div className="flex items-center justify-between py-1">
          <h1 className="text-xl font-bold tracking-tight text-ink sm:text-2xl">
            {strings.patients.listTitle}
          </h1>
          <Link
            href="/patients/new"
            className="inline-flex min-h-10 items-center justify-center rounded-full bg-forest px-4 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-forest-deep"
          >
            {strings.patients.add}
          </Link>
        </div>

        {rows.length === 0 ? (
          <div className="rounded-2xl border border-line-soft bg-white p-8 text-center text-sm font-medium text-muted shadow-xs">
            {strings.patients.empty}
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {rows.map(({ role, patients: patient }) => {
              const age = formatPatientAge(patient.date_of_birth);
              const initial = (patient.full_name.trim()[0] ?? "P").toUpperCase();

              return (
                <li key={patient.id}>
                  <Link
                    href={`/patients/${patient.id}`}
                    className="group flex items-center justify-between rounded-2xl border border-line-soft bg-white p-4 shadow-xs transition-colors hover:border-forest/20 hover:bg-sage-soft/30"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-sage font-bold text-lg text-forest shadow-xs">
                        {initial}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-base font-bold text-ink group-hover:text-forest">
                          {patient.full_name}
                        </span>
                        <div className="mt-0.5 flex items-center gap-2">
                          <span className="rounded-full bg-sage-soft px-2.5 py-0.5 text-xs font-semibold text-forest">
                            {strings.roles[role]}
                          </span>
                          <span className="text-xs text-muted">
                            • {age} {strings.medicines.describe.days.toLowerCase()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <svg className="h-5 w-5 text-muted transition-colors group-hover:text-forest" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                    </svg>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </main>
      <BottomNav />
    </div>
  );
}
