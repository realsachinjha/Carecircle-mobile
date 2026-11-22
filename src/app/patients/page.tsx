import Link from "next/link";
import { AppHeader } from "@/components/app-header";
import { BottomNav } from "@/components/navigation/bottom-nav";
import { formatPatientAge } from "@/lib/patients/age";
import { requirePageUser } from "@/lib/auth/session";
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
    <div className="min-h-screen bg-ivory text-ink pb-24">
      <AppHeader />
      <main className="mx-auto flex max-w-4xl flex-col gap-6 p-4">
        <div className="flex items-center justify-between rounded-2xl bg-forest-deep px-5 py-4 text-white shadow-sm">
          <h1 className="text-2xl font-bold tracking-tight">{strings.patients.listTitle}</h1>
          <Link
            href="/patients/new"
            className="inline-flex min-h-11 items-center justify-center rounded-full bg-terracotta px-5 text-sm font-semibold text-white shadow-xs transition-transform hover:scale-105 active:scale-95"
          >
            {strings.patients.add}
          </Link>
        </div>

        {rows.length === 0 ? (
          <div className="rounded-2xl border border-line bg-white p-8 text-center text-sm font-medium text-muted">
            {strings.patients.empty}
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {rows.map(({ role, patients: patient }) => {
              const age = formatPatientAge(patient.date_of_birth);
              const initials = patient.full_name
                .split(" ")
                .map((w) => w[0])
                .filter(Boolean)
                .slice(0, 2)
                .join("")
                .toUpperCase();

              return (
                <li key={patient.id}>
                  <Link
                    href={`/patients/${patient.id}`}
                    className="group flex items-center justify-between rounded-2xl border border-line bg-white p-4 shadow-[0_2px_10px_-3px_rgba(24,56,45,0.06)] transition-all hover:border-forest/40 hover:bg-sage-light"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-peach text-forest-deep font-bold text-base shadow-2xs">
                        {initials}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-lg font-bold text-ink group-hover:text-forest">
                          {patient.full_name}
                        </span>
                        <span className="text-xs text-muted font-medium">
                          {age} {strings.medicines.describe.days.toLowerCase()} · {strings.patients.yourRole}: {strings.roles[role]}
                        </span>
                      </div>
                    </div>
                    <span className="rounded-full bg-surface px-3 py-1 text-xs font-bold text-forest">
                      {strings.roles[role]}
                    </span>
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
