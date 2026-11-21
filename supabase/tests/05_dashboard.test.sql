begin;
create extension if not exists pgtap with schema extensions;
select plan(22);

create or replace function pg_temp.make_user(p_id uuid, p_email text)
returns void
language sql
as $$
  insert into auth.users (id, email, raw_user_meta_data, aud, role)
  values (p_id, p_email, jsonb_build_object('full_name', split_part(p_email, '@', 1)), 'authenticated', 'authenticated');
$$;

create or replace function pg_temp.login(p_id uuid)
returns void
language plpgsql
as $$
begin
  perform set_config('request.jwt.claims', json_build_object('sub', p_id, 'role', 'authenticated')::text, true);
  perform set_config('role', 'authenticated', true);
end;
$$;

create or replace function pg_temp.logout()
returns void
language plpgsql
as $$
begin
  perform set_config('request.jwt.claims', '', true);
end;
$$;

select pg_temp.make_user('00000000-0000-0000-0000-0000000000a1', 'owner@test.local');
select pg_temp.make_user('00000000-0000-0000-0000-0000000000a2', 'care@test.local');
select pg_temp.make_user('00000000-0000-0000-0000-0000000000a3', 'viewer@test.local');
select pg_temp.make_user('00000000-0000-0000-0000-0000000000a4', 'patient@test.local');
select pg_temp.make_user('00000000-0000-0000-0000-0000000000a5', 'outsider@test.local');

insert into public.patients (id, full_name, date_of_birth, created_by, timezone)
values ('00000000-0000-0000-0000-0000000000b1', 'Ramesh Test', '1957-03-04', '00000000-0000-0000-0000-0000000000a1', 'Asia/Kolkata');
insert into public.caregiver_links (patient_id, user_id, role) values
  ('00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-0000000000a1', 'OWNER'),
  ('00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-0000000000a2', 'CAREGIVER'),
  ('00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-0000000000a3', 'VIEWER');
insert into public.patient_links (patient_id, user_id) values
  ('00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-0000000000a4');
insert into public.medications (id, patient_id, name, dosage, created_by)
values ('00000000-0000-0000-0000-0000000000e1', '00000000-0000-0000-0000-0000000000b1', 'Metformin', '500 mg', '00000000-0000-0000-0000-0000000000a1');
insert into public.medication_schedules (id, medication_id, patient_id, slot, target_time, frequency_type, start_date)
values ('00000000-0000-0000-0000-0000000000d1', '00000000-0000-0000-0000-0000000000e1', '00000000-0000-0000-0000-0000000000b1', 'MORNING', '08:00', 'DAILY', '2026-01-01');

insert into public.medication_reminders (schedule_id, patient_id, scheduled_for, status, acknowledged_at) values
  ('00000000-0000-0000-0000-0000000000d1', '00000000-0000-0000-0000-0000000000b1', '2026-03-10 08:00:00+05:30', 'ACKNOWLEDGED', '2026-03-10 08:05:00+05:30'),
  ('00000000-0000-0000-0000-0000000000d1', '00000000-0000-0000-0000-0000000000b1', '2026-03-10 13:00:00+05:30', 'SKIPPED', '2026-03-10 13:10:00+05:30'),
  ('00000000-0000-0000-0000-0000000000d1', '00000000-0000-0000-0000-0000000000b1', '2026-03-10 19:00:00+05:30', 'MISSED', null),
  ('00000000-0000-0000-0000-0000000000d1', '00000000-0000-0000-0000-0000000000b1', '2026-03-10 21:00:00+05:30', 'PENDING', null),
  ('00000000-0000-0000-0000-0000000000d1', '00000000-0000-0000-0000-0000000000b1', '2026-03-10 23:00:00+05:30', 'PENDING', null),
  ('00000000-0000-0000-0000-0000000000d1', '00000000-0000-0000-0000-0000000000b1', '2026-03-09 08:00:00+05:30', 'ACKNOWLEDGED', '2026-03-09 08:01:00+05:30'),
  ('00000000-0000-0000-0000-0000000000d1', '00000000-0000-0000-0000-0000000000b1', '2026-03-03 08:00:00+05:30', 'ACKNOWLEDGED', '2026-03-03 08:01:00+05:30');

select pg_temp.login('00000000-0000-0000-0000-0000000000a3');
select is(
  jsonb_array_length(public.compliance('00000000-0000-0000-0000-0000000000b1', 7, '2026-03-10 21:30:00+05:30') -> 'days'),
  7,
  'FR-10.1 compliance has one entry per day for 7 days'
);
select is(
  public.compliance('00000000-0000-0000-0000-0000000000b1', 7, '2026-03-10 21:30:00+05:30') -> 'days' -> 6,
  '{"date": "2026-03-10", "taken": 1, "skipped": 1, "missed": 1, "pending": 1}'::jsonb,
  'FR-10.1 today counts taken, skipped, missed, and due-but-pending; future doses are not counted'
);
select is(
  public.compliance('00000000-0000-0000-0000-0000000000b1', 7, '2026-03-10 21:30:00+05:30') -> 'totals' -> 'taken',
  '2'::jsonb,
  'FR-10.1 the 7-day total leaves out doses older than 7 days'
);
select throws_ok(
  $$select public.compliance('00000000-0000-0000-0000-0000000000b1', 0, now())$$,
  'P0001', 'VALIDATION_FAILED', 'FR-10.1 a window of 0 days is refused'
);
select throws_ok(
  $$select public.save_checkup(null, '00000000-0000-0000-0000-0000000000b1', 'CONSULTATION', 'Dr X', null, '2026-03-12 10:30', 24, null)$$,
  'P0001', 'FORBIDDEN', 'FR-9.1 a viewer cannot create a checkup'
);
reset role;

select pg_temp.login('00000000-0000-0000-0000-0000000000a5');
select throws_ok(
  $$select public.compliance('00000000-0000-0000-0000-0000000000b1', 7, now())$$,
  'P0001', 'NOT_FOUND', 'FR-10.1 an outsider gets NOT_FOUND'
);
reset role;

select pg_temp.login('00000000-0000-0000-0000-0000000000a2');
select throws_ok(
  $$select public.save_checkup(null, '00000000-0000-0000-0000-0000000000b1', 'CONSULTATION', '  ', null, '2026-03-12 10:30', 24, null)$$,
  'P0001', 'VALIDATION_FAILED', 'FR-9.1 a doctor name is required'
);
select isnt(
  public.save_checkup(null, '00000000-0000-0000-0000-0000000000b1', 'LAB_TEST', 'Dr Lab', 'Synthetic Lab', '2026-03-12 10:30', 24, null),
  null,
  'FR-9.1 a caregiver creates a checkup'
);
select is(
  (select appointment_time from public.checkup_schedules where doctor_name = 'Dr Lab'),
  '2026-03-12 10:30:00+05:30'::timestamptz,
  'FR-9.1 the time is read in the patient''s timezone'
);
reset role;

select is(public.send_checkup_reminders('2026-03-11 10:00:00+05:30'), 0, 'FR-9.3 no reminder before the lead time');
select is(public.send_checkup_reminders('2026-03-11 10:31:00+05:30'), 1, 'FR-9.3 a reminder once the lead time is reached');
select is(
  (select count(*)::int from public.notifications where kind = 'CHECKUP_SOON'),
  4,
  'FR-9.3 owner, caregiver, viewer, and patient are each notified once'
);
select is(public.send_checkup_reminders('2026-03-11 10:45:00+05:30'), 0, 'FR-9.3 the reminder is not sent twice');

select pg_temp.login('00000000-0000-0000-0000-0000000000a2');
select public.save_checkup(
  (select id from public.checkup_schedules where doctor_name = 'Dr Lab'),
  null, 'LAB_TEST', 'Dr Lab', 'Synthetic Lab', '2026-03-13 10:30', 24, null
);
reset role;
select is(
  (select reminded_at from public.checkup_schedules where doctor_name = 'Dr Lab'),
  null,
  'FR-9.3 changing the time re-arms the reminder'
);

select pg_temp.login('00000000-0000-0000-0000-0000000000a2');
select isnt(
  public.complete_checkup((select id from public.checkup_schedules where doctor_name = 'Dr Lab'), 'All normal'),
  null,
  'FR-9.2 a caregiver logs a completion'
);
select lives_ok(
  $$select public.complete_checkup((select id from public.checkup_schedules where doctor_name = 'Dr Lab'), 'Updated notes')$$,
  'FR-9.2 logging again updates the same completion'
);
reset role;
select is((select count(*)::int from public.checkup_completions), 1, 'FR-9.2 there is one completion per checkup');
select is(public.send_checkup_reminders('2026-03-12 10:31:00+05:30'), 0, 'FR-9.3 a completed checkup gets no reminder');

select pg_temp.login('00000000-0000-0000-0000-0000000000a4');
select is((select count(*)::int from public.checkup_schedules), 1, 'the patient sees their checkups');
reset role;
select pg_temp.login('00000000-0000-0000-0000-0000000000a5');
select is((select count(*)::int from public.checkup_schedules), 0, 'an outsider sees no checkups');
reset role;

select pg_temp.login('00000000-0000-0000-0000-0000000000a2');
select lives_ok(
  $$select public.delete_checkup((select id from public.checkup_schedules where doctor_name = 'Dr Lab'))$$,
  'FR-9.1 a caregiver deletes a checkup'
);
reset role;

select is(
  (select count(*)::int from pg_publication_tables
   where pubname = 'supabase_realtime' and schemaname = 'public' and tablename in ('medication_reminders', 'notifications')),
  2,
  'FR-10.2 FR-11.3 reminders and notifications are published for realtime'
);

select * from finish();
rollback;
