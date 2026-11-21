import Link from "next/link";
import { AppHeader } from "@/components/app-header";
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
    <>
      <AppHeader />
      <main className="mx-auto flex max-w-4xl flex-col gap-6 p-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-3xl font-semibold">{strings.patients.listTitle}</h1>
          <Link
            href="/patients/new"
            className="inline-flex min-h-12 items-center justify-center rounded-lg bg-accent px-5 text-lg font-semibold text-accent-ink"
          >
            {strings.patients.add}
          </Link>
        </div>

        {rows.length === 0 ? (
          <p className="text-lg text-muted">{strings.patients.empty}</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {rows.map(({ role, patients: patient }) => (
              <li key={patient.id}>
                <Link
                  href={`/patients/${patient.id}`}
                  className="flex min-h-12 items-center justify-between rounded-xl border border-line bg-paper p-4 text-lg hover:border-accent"
                >
                  <span className="font-semibold">{patient.full_name}</span>
                  <span className="rounded bg-panel px-3 py-1 text-sm text-muted">
                    {strings.roles[role]}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </>
  );
}
