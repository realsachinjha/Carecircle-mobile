import { createClient } from "@supabase/supabase-js";
import { newInviteToken } from "../src/lib/auth/invite-token";
import { addDays, todayInZone } from "../src/lib/time/local-date";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing ${name}`);
  }
  return value;
}

async function main() {
  const supabaseUrl = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
  const anonKey = requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  const serviceRoleKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
  const demoPassword = requireEnv("DEMO_PASSWORD");

  if (demoPassword.length < 12) {
    throw new Error("DEMO_PASSWORD must be at least 12 characters");
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const demoUsers = [
    { email: "rahul.demo@example.test", fullName: "Rahul (demo)" },
    { email: "ramesh.demo@example.test", fullName: "Ramesh (demo)" },
    { email: "priya.demo@example.test", fullName: "Priya (demo)" },
    { email: "suresh.demo@example.test", fullName: "Suresh (demo)" },
  ];

  const createdUserIds: Record<string, string> = {};

  for (const user of demoUsers) {
    const { data, error } = await admin.auth.admin.createUser({
      email: user.email,
      password: demoPassword,
      email_confirm: true,
      user_metadata: { full_name: user.fullName },
    });
    if (error) {
      console.log("Demo data already exists");
      process.exit(1);
    }
    if (!data.user) {
      throw new Error(`Failed to create user ${user.email}`);
    }
    createdUserIds[user.email] = data.user.id;
  }

  const rahulClient = createClient(supabaseUrl, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { error: rahulAuthError } = await rahulClient.auth.signInWithPassword({
    email: demoUsers[0]!.email,
    password: demoPassword,
  });
  if (rahulAuthError) {
    throw new Error(`Rahul sign-in failed: ${rahulAuthError.message}`);
  }

  const { data: patientId, error: pError } = await rahulClient.rpc("create_patient", {
    p_full_name: "Ramesh (demo)",
    p_date_of_birth: "1957-03-04",
    p_timezone: "Asia/Kolkata",
    p_missed_after_minutes: 120,
    p_blood_group: null,
    p_primary_condition: "Type 2 diabetes, hypertension (synthetic)",
    p_notes: null,
    p_emergency_contact_name: null,
    p_emergency_contact_phone: null,
    p_physician_name: "Dr. A. Sharma (synthetic)",
    p_physician_phone: null,
  });
  if (pError || !patientId) {
    throw new Error(`Failed to create patient: ${pError?.message}`);
  }

  const inviteSpecs = [
    { email: demoUsers[1]!.email, role: "PATIENT" },
    { email: demoUsers[2]!.email, role: "CAREGIVER" },
    { email: demoUsers[3]!.email, role: "VIEWER" },
  ];

  for (const spec of inviteSpecs) {
    const token = newInviteToken();
    const { error: invErr } = await rahulClient.rpc("create_invite", {
      p_patient: patientId,
      p_email: spec.email,
      p_role: spec.role,
      p_token_hash: token.hash,
    });
    if (invErr) {
      throw new Error(`Failed to create invite for ${spec.email}: ${invErr.message}`);
    }

    const inviteeClient = createClient(supabaseUrl, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { error: signErr } = await inviteeClient.auth.signInWithPassword({
      email: spec.email,
      password: demoPassword,
    });
    if (signErr) {
      throw new Error(`Failed to sign in as ${spec.email}: ${signErr.message}`);
    }

    const { error: acceptErr } = await inviteeClient.rpc("accept_invite", {
      p_token_hash: token.hash,
    });
    if (acceptErr) {
      throw new Error(`Failed to accept invite for ${spec.email}: ${acceptErr.message}`);
    }
  }

  const { error: consentErr } = await rahulClient.rpc("give_consent", {
    p_patient: patientId,
    p_notice_version: "2026-11-v1",
  });
  if (consentErr) {
    throw new Error(`Failed to give consent: ${consentErr.message}`);
  }

  const today = todayInZone("Asia/Kolkata");
  const startDate = addDays(today, -7);

  const medications = [
    {
      name: "Metformin",
      dosage: "500 mg",
      instructions: "after food",
      schedules: [
        {
          slot: "MORNING",
          target_time: "08:00",
          frequency_type: "DAILY",
          start_date: startDate,
        },
        {
          slot: "EVENING",
          target_time: "19:00",
          frequency_type: "DAILY",
          start_date: startDate,
        },
      ],
    },
    {
      name: "Amlodipine",
      dosage: "5 mg",
      instructions: null,
      schedules: [
        {
          slot: "MORNING",
          target_time: "08:00",
          frequency_type: "DAILY",
          start_date: startDate,
        },
      ],
    },
    {
      name: "Atorvastatin",
      dosage: "10 mg",
      instructions: null,
      schedules: [
        {
          slot: "BEDTIME",
          target_time: "22:00",
          frequency_type: "DAILY",
          start_date: startDate,
        },
      ],
    },
  ];

  for (const med of medications) {
    const { error: medErr } = await rahulClient.rpc("add_medication", {
      p_patient: patientId,
      p_medicine: med,
    });
    if (medErr) {
      throw new Error(`Failed to add medication ${med.name}: ${medErr.message}`);
    }
  }

  const checkupDate = addDays(today, 2);
  const { error: checkupErr } = await rahulClient.rpc("save_checkup", {
    p_checkup: null,
    p_patient: patientId,
    p_checkup_type: "LAB_TEST",
    p_doctor_name: "Synthetic Diagnostics, Mysuru",
    p_clinic_location: "Mysuru",
    p_local_time: `${checkupDate} 09:30:00`,
    p_reminder_hours_before: 24,
    p_notes: null,
  });
  if (checkupErr) {
    throw new Error(`Failed to save checkup: ${checkupErr.message}`);
  }

  const { data: schedules, error: schedErr } = await admin
    .from("medication_schedules")
    .select("id, slot, target_time")
    .eq("patient_id", patientId)
    .order("id");

  if (schedErr || !schedules) {
    throw new Error("Failed to load schedules for reminders insertion");
  }

  const now = new Date();
  const rameshId = createdUserIds[demoUsers[1]!.email]!;
  const reminderRows: Array<{
    patient_id: string;
    schedule_id: string;
    scheduled_for: string;
    status: string;
    acknowledged_at: string | null;
    acknowledged_by: string | null;
  }> = [];

  for (let dayIndex = 0; dayIndex <= 6; dayIndex++) {
    const dayOffset = dayIndex - 6;
    const dateStr = addDays(today, dayOffset);
    for (let scheduleIndex = 0; scheduleIndex < schedules.length; scheduleIndex++) {
      const schedule = schedules[scheduleIndex]!;
      const scheduledIso = `${dateStr}T${schedule.target_time}+05:30`;
      const scheduledDate = new Date(scheduledIso);
      if (scheduledDate.getTime() >= now.getTime()) {
        continue;
      }
      const pattern = (dayIndex * scheduleIndex) % 7;
      let status = "ACKNOWLEDGED";
      let ackAt: string | null = new Date(scheduledDate.getTime() + 5 * 60 * 1000).toISOString();
      let ackBy: string | null = rameshId;

      if (pattern === 3) {
        status = "MISSED";
        ackAt = null;
        ackBy = null;
      } else if (pattern === 5) {
        status = "SKIPPED";
        ackAt = new Date(scheduledDate.getTime() + 10 * 60 * 1000).toISOString();
        ackBy = rameshId;
      }

      reminderRows.push({
        patient_id: patientId,
        schedule_id: schedule.id,
        scheduled_for: scheduledIso,
        status,
        acknowledged_at: ackAt,
        acknowledged_by: ackBy,
      });
    }
  }

  if (reminderRows.length > 0) {
    const { error: upsertErr } = await admin.from("medication_reminders").upsert(reminderRows, {
      onConflict: "schedule_id,scheduled_for",
      ignoreDuplicates: true,
    });
    if (upsertErr) {
      throw new Error(`Failed to insert historical reminders: ${upsertErr.message}`);
    }
  }

  for (const user of demoUsers) {
    console.log(`${user.fullName}: ${user.email}`);
  }
  console.log("Demo data created");
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : "seed failed");
  process.exit(1);
});
