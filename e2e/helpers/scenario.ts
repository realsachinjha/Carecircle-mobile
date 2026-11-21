import {
  adminClient,
  createPatientAs,
  createTestUser,
  userClient,
  type TestUser,
} from "./users";
import { newInviteToken } from "../../src/lib/auth/invite-token";
import { timeInZone, todayInZone } from "../../src/lib/time/local-date";

export type SetupResult = {
  owner: TestUser;
  patientUser: TestUser;
  patientId: string;
  dueReminderId: string;
  laterReminderId: string;
  laterFallsNextDay: boolean;
};

export async function setupPatientScenario(label: string): Promise<SetupResult> {
  const owner = await createTestUser(`${label}-owner`);
  const patientUser = await createTestUser(`${label}-patient`);
  const patientId = await createPatientAs(owner, `${label} Patient`);

  const ownerClient = await userClient(owner);
  const { hash } = newInviteToken();
  await ownerClient.rpc("create_invite", {
    p_patient: patientId,
    p_email: patientUser.email,
    p_role: "PATIENT",
    p_token_hash: hash,
  });

  const patientClient = await userClient(patientUser);
  await patientClient.rpc("accept_invite", { p_token_hash: hash });

  const now = new Date();
  const today = todayInZone("Asia/Kolkata", now);
  const dueTime = timeInZone(new Date(now.getTime() - 10 * 60_000), "Asia/Kolkata");

  const laterDate = new Date(now.getTime() + 3 * 3600_000);
  const laterTime = timeInZone(laterDate, "Asia/Kolkata");
  const laterDay = todayInZone("Asia/Kolkata", laterDate);
  const laterFallsNextDay = laterDay !== today;

  await ownerClient.rpc("add_medication", {
    p_patient: patientId,
    p_medicine: {
      name: "Due Pill",
      dosage: "500 mg",
      instructions: null,
      schedules: [
        {
          slot: "MORNING",
          target_time: dueTime,
          frequency_type: "DAILY",
          start_date: today,
          end_date: null,
        },
      ],
    },
  });

  await ownerClient.rpc("add_medication", {
    p_patient: patientId,
    p_medicine: {
      name: "Later Pill",
      dosage: "10 mg",
      instructions: null,
      schedules: [
        {
          slot: "EVENING",
          target_time: laterTime,
          frequency_type: "DAILY",
          start_date: today,
          end_date: null,
        },
      ],
    },
  });

  const { data: doses } = await adminClient().rpc("doses_for_day", { p_patient: patientId });

  let dueReminderId = "";
  let laterReminderId = "";

  for (const d of (doses ?? []) as unknown as { reminder_id: string; medication_name: string }[]) {
    if (d.medication_name === "Due Pill") {
      dueReminderId = d.reminder_id;
    } else if (d.medication_name === "Later Pill") {
      laterReminderId = d.reminder_id;
    }
  }

  return {
    owner,
    patientUser,
    patientId,
    dueReminderId,
    laterReminderId,
    laterFallsNextDay,
  };
}
