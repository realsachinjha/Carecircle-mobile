import Link from "next/link";
import { InvitePanel } from "./invite-panel";
import { CancelInviteButton, RemoveLoginButton, RevokeButton } from "./people-actions";
import { Card } from "@/components/ui/card";
import { loadPatientContext } from "@/lib/patients/context";
import { strings } from "@/strings/en";

export const dynamic = "force-dynamic";

type CaregiverRow = {
  id: string;
  role: "OWNER" | "CAREGIVER" | "VIEWER";
  status: "ACTIVE" | "REVOKED";
  user_id: string;
  profiles: {
    full_name: string;
    email: string;
  } | null;
};

type PatientLoginRow = {
  user_id: string;
  profiles: {
    full_name: string;
    email: string;
  } | null;
};

type InviteRow = {
  id: string;
  email: string;
  role: "CAREGIVER" | "VIEWER" | "PATIENT";
  expires_at: string;
};

export default async function PeoplePage({
  params,
}: {
  params: Promise<{ patientId: string }>;
}) {
  const { patientId } = await params;
  const { supabase, patient, role } = await loadPatientContext(patientId, `/patients/${patientId}/people`);
  const isOwner = role === "OWNER";

  const { data: caregiversData } = await supabase
    .from("caregiver_links")
    .select("id, role, status, user_id, profiles(full_name, email)")
    .eq("patient_id", patientId)
    .order("created_at");

  const caregivers = (caregiversData as unknown as CaregiverRow[]) ?? [];

  const { data: patientLoginData } = await supabase
    .from("patient_links")
    .select("user_id, profiles(full_name, email)")
    .eq("patient_id", patientId)
    .maybeSingle();

  const patientLogin = patientLoginData as unknown as PatientLoginRow | null;

  let pendingInvites: InviteRow[] = [];
  if (isOwner) {
    const { data: invitesData } = await supabase
      .from("invites")
      .select("id, email, role, expires_at")
      .eq("patient_id", patientId)
      .is("used_at", null)
      .is("revoked_at", null)
      .gt("expires_at", new Date().toISOString());
    pendingInvites = (invitesData as unknown as InviteRow[]) ?? [];
  }

  const patientInitial = (patient.full_name.trim()[0] ?? "P").toUpperCase();

  return (
    <div className="flex flex-col gap-5">
      <div className="relative flex items-center justify-between py-1">
        <Link
          href={`/patients/${patientId}`}
          className="flex h-10 w-10 items-center justify-center rounded-full text-ink hover:bg-sage-soft"
          aria-label={strings.common.back}
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
        </Link>
        <h1 className="text-xl font-bold tracking-tight text-ink sm:text-2xl">
          {strings.people.familyCircle}
        </h1>
        <div className="h-10 w-10" aria-hidden="true" />
      </div>

      <div className="flex flex-col gap-3">
        <span className="px-1 text-xs font-semibold text-muted">
          {strings.people.yourCareCircle}
        </span>

        <div className="flex items-center justify-between rounded-2xl border border-line-soft bg-white p-4 shadow-xs">
          <div className="flex items-center gap-3.5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-sage-soft font-bold text-forest">
              {patientInitial}
            </div>
            <div className="flex flex-col">
              <span className="text-base font-bold text-ink">{patient.full_name}</span>
              <div className="mt-0.5">
                <span className="rounded-full bg-sage-soft px-2.5 py-0.5 text-xs font-semibold text-forest">
                  {strings.roles.PATIENT}
                </span>
              </div>
            </div>
          </div>
          {patientLogin?.profiles && isOwner ? (
            <RemoveLoginButton patientId={patientId} />
          ) : (
            <svg className="h-5 w-5 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
            </svg>
          )}
        </div>

        {caregivers.map((member) => {
          const isSelf = isOwner && member.role === "OWNER";
          const canRevoke = isOwner && !isSelf && member.status === "ACTIVE";
          const name = member.profiles?.full_name ?? member.profiles?.email ?? "User";
          const initial = (name.trim()[0] ?? "U").toUpperCase();
          const roleLabel =
            member.role === "OWNER"
              ? strings.people.roleAdminCaregiver
              : member.role === "VIEWER"
                ? strings.people.roleViewOnly
                : strings.roles.CAREGIVER;

          return (
            <div
              key={member.id}
              className="flex items-center justify-between rounded-2xl border border-line-soft bg-white p-4 shadow-xs"
            >
              <div className="flex items-center gap-3.5">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-sage-soft font-bold text-forest">
                  {initial}
                </div>
                <div className="flex flex-col">
                  <span className="text-base font-bold text-ink">{name}</span>
                  <div className="mt-0.5 flex items-center gap-2">
                    <span className="rounded-full bg-sage-soft px-2.5 py-0.5 text-xs font-semibold text-forest">
                      {roleLabel}
                    </span>
                    {member.status === "REVOKED" ? (
                      <span className="text-xs font-bold text-danger">{strings.people.revoked}</span>
                    ) : null}
                  </div>
                </div>
              </div>

              {canRevoke ? (
                <RevokeButton patientId={patientId} userId={member.user_id} />
              ) : (
                <svg className="h-5 w-5 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                </svg>
              )}
            </div>
          );
        })}
      </div>

      {isOwner ? (
        <div className="flex flex-col gap-4">
          <InvitePanel patientId={patientId} hasPatientLogin={Boolean(patientLogin)} />

          {pendingInvites.length > 0 ? (
            <Card title={strings.people.pendingInvites}>
              <ul className="flex flex-col divide-y divide-line-soft">
                {pendingInvites.map((invite) => (
                  <li key={invite.id} className="flex items-center justify-between gap-3 py-3">
                    <div className="flex flex-col">
                      <span className="font-bold text-ink">{invite.email}</span>
                      <span className="text-xs text-muted">
                        {strings.roles[invite.role]} • {strings.people.expires} {new Date(invite.expires_at).toLocaleDateString()}
                      </span>
                    </div>
                    <CancelInviteButton patientId={patientId} inviteId={invite.id} />
                  </li>
                ))}
              </ul>
            </Card>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
