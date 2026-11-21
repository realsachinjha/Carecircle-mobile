import { Card } from "@/components/ui/card";
import { loadPatientContext } from "@/lib/patients/context";
import { InvitePanel } from "./invite-panel";
import { CancelInviteButton, RemoveLoginButton, RevokeButton } from "./people-actions";
import { strings } from "@/strings/en";

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
  const { supabase, role } = await loadPatientContext(patientId, `/patients/${patientId}/people`);
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

  return (
    <div className="flex flex-col gap-6">
      <Card title={strings.people.caregivers}>
        <ul className="flex flex-col divide-y divide-line">
          {caregivers.map((member) => {
            const isSelf = isOwner && member.role === "OWNER";
            const canRevoke = isOwner && !isSelf && member.status === "ACTIVE";
            return (
              <li key={member.id} className="flex items-center justify-between py-3">
                <div className="flex flex-col">
                  <span className="font-semibold">{member.profiles?.full_name ?? member.profiles?.email}</span>
                  <span className="text-base text-muted">{member.profiles?.email}</span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="rounded bg-panel px-2 py-0.5 text-sm text-muted">
                      {strings.roles[member.role]}
                    </span>
                    {member.status === "REVOKED" ? (
                      <span className="text-sm text-danger font-medium">{strings.people.revoked}</span>
                    ) : null}
                  </div>
                </div>
                {canRevoke ? (
                  <RevokeButton patientId={patientId} userId={member.user_id} />
                ) : null}
              </li>
            );
          })}
        </ul>
      </Card>

      <Card title={strings.people.patientLogin}>
        {patientLogin?.profiles ? (
          <div className="flex items-center justify-between py-2">
            <div className="flex flex-col">
              <span className="font-semibold">{patientLogin.profiles.full_name}</span>
              <span className="text-base text-muted">{patientLogin.profiles.email}</span>
            </div>
            {isOwner ? <RemoveLoginButton patientId={patientId} /> : null}
          </div>
        ) : (
          <p className="text-base text-muted">{strings.people.noPatientLogin}</p>
        )}
      </Card>

      {isOwner ? (
        <>
          <InvitePanel patientId={patientId} hasPatientLogin={Boolean(patientLogin)} />

          {pendingInvites.length > 0 ? (
            <Card title={strings.people.pendingInvites}>
              <ul className="flex flex-col divide-y divide-line">
                {pendingInvites.map((invite) => (
                  <li key={invite.id} className="flex items-center justify-between py-3">
                    <div className="flex flex-col">
                      <span className="font-semibold">{invite.email}</span>
                      <span className="text-sm text-muted">
                        {strings.roles[invite.role]} • {strings.people.expires} {new Date(invite.expires_at).toLocaleDateString()}
                      </span>
                    </div>
                    <CancelInviteButton patientId={patientId} inviteId={invite.id} />
                  </li>
                ))}
              </ul>
            </Card>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
