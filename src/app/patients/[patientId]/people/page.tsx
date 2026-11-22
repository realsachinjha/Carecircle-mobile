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
        <div className="flex items-center justify-between -mt-2 mb-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted">Care Team</span>
          <span className="rounded-full bg-sage px-2.5 py-0.5 text-xs font-bold text-forest">
            {caregivers.length} members
          </span>
        </div>
        <ul className="flex flex-col divide-y divide-line">
          {caregivers.map((member) => {
            const isSelf = isOwner && member.role === "OWNER";
            const canRevoke = isOwner && !isSelf && member.status === "ACTIVE";
            const name = member.profiles?.full_name ?? member.profiles?.email ?? "User";
            const initials = name
              .split(" ")
              .map((w) => w[0])
              .filter(Boolean)
              .slice(0, 2)
              .join("")
              .toUpperCase();

            return (
              <li key={member.id} className="flex items-center justify-between gap-3 py-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sage text-forest font-bold text-xs shadow-2xs">
                    {initials}
                  </div>
                  <div className="flex flex-col">
                    <span className="font-bold text-ink">{name}</span>
                    <span className="text-xs text-muted">{member.profiles?.email}</span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="rounded-full bg-surface px-2 py-0.5 text-xs font-semibold text-forest">
                        {strings.roles[member.role]}
                      </span>
                      {member.status === "REVOKED" ? (
                        <span className="text-xs text-danger font-bold">{strings.people.revoked}</span>
                      ) : null}
                    </div>
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
          <div className="flex items-center justify-between gap-3 py-2">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-peach text-forest-deep font-bold text-xs shadow-2xs">
                {patientLogin.profiles.full_name.slice(0, 2).toUpperCase()}
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-ink">{patientLogin.profiles.full_name}</span>
                <span className="text-xs text-muted">{patientLogin.profiles.email}</span>
              </div>
            </div>
            {isOwner ? <RemoveLoginButton patientId={patientId} /> : null}
          </div>
        ) : (
          <p className="text-sm text-muted">{strings.people.noPatientLogin}</p>
        )}
      </Card>

      {isOwner ? (
        <>
          <InvitePanel patientId={patientId} hasPatientLogin={Boolean(patientLogin)} />

          {pendingInvites.length > 0 ? (
            <Card title={strings.people.pendingInvites}>
              <ul className="flex flex-col divide-y divide-line">
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
        </>
      ) : null}
    </div>
  );
}
