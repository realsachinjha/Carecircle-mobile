begin;
create extension if not exists pgtap with schema extensions;
select plan(18);

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

insert into public.patients (id, full_name, date_of_birth, created_by, timezone) values
  ('00000000-0000-0000-0000-0000000000b1', 'Ramesh Test', '1957-03-04', '00000000-0000-0000-0000-0000000000a1', 'Asia/Kolkata'),
  ('00000000-0000-0000-0000-0000000000b2', 'Other Test', '1950-01-01', '00000000-0000-0000-0000-0000000000a5', 'Asia/Kolkata');
insert into public.caregiver_links (patient_id, user_id, role) values
  ('00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-0000000000a1', 'OWNER'),
  ('00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-0000000000a2', 'CAREGIVER'),
  ('00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-0000000000a3', 'VIEWER'),
  ('00000000-0000-0000-0000-0000000000b2', '00000000-0000-0000-0000-0000000000a5', 'OWNER');
insert into public.patient_links (patient_id, user_id) values
  ('00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-0000000000a4');

insert into public.medications (id, patient_id, name, dosage, created_by) values
  ('00000000-0000-0000-0000-0000000000e1', '00000000-0000-0000-0000-0000000000b1', 'Metformin', '500 mg', '00000000-0000-0000-0000-0000000000a1'),
  ('00000000-0000-0000-0000-0000000000e2', '00000000-0000-0000-0000-0000000000b2', 'Other', '1', '00000000-0000-0000-0000-0000000000a5');
insert into public.medication_schedules (id, medication_id, patient_id, slot, target_time, frequency_type, start_date) values
  ('00000000-0000-0000-0000-0000000000d1', '00000000-0000-0000-0000-0000000000e1', '00000000-0000-0000-0000-0000000000b1', 'MORNING', '08:00', 'DAILY', '2026-01-01'),
  ('00000000-0000-0000-0000-0000000000d2', '00000000-0000-0000-0000-0000000000e2', '00000000-0000-0000-0000-0000000000b2', 'MORNING', '08:00', 'DAILY', '2026-01-01');

insert into public.medication_reminders (id, schedule_id, patient_id, scheduled_for, status) values
  ('00000000-0000-0000-0000-0000000000f1', '00000000-0000-0000-0000-0000000000d1', '00000000-0000-0000-0000-0000000000b1', now() - interval '30 minutes', 'PENDING'),
  ('00000000-0000-0000-0000-0000000000f2', '00000000-0000-0000-0000-0000000000d1', '00000000-0000-0000-0000-0000000000b1', now() + interval '5 hours', 'PENDING'),
  ('00000000-0000-0000-0000-0000000000f3', '00000000-0000-0000-0000-0000000000d1', '00000000-0000-0000-0000-0000000000b1', now() - interval '5 hours', 'MISSED'),
  ('00000000-0000-0000-0000-0000000000f4', '00000000-0000-0000-0000-0000000000d1', '00000000-0000-0000-0000-0000000000b1', now() + interval '1 hour', 'PENDING'),
  ('00000000-0000-0000-0000-0000000000f5', '00000000-0000-0000-0000-0000000000d2', '00000000-0000-0000-0000-0000000000b2', now() - interval '10 minutes', 'PENDING'),
  ('00000000-0000-0000-0000-0000000000f6', '00000000-0000-0000-0000-0000000000d1', '00000000-0000-0000-0000-0000000000b1', now() - interval '6 hours', 'MISSED'),
  ('00000000-0000-0000-0000-0000000000f7', '00000000-0000-0000-0000-0000000000d1', '00000000-0000-0000-0000-0000000000b1', now() - interval '40 minutes', 'PENDING'),
  ('00000000-0000-0000-0000-0000000000f8', '00000000-0000-0000-0000-0000000000d1', '00000000-0000-0000-0000-0000000000b1', '2026-03-10 08:00:00+05:30', 'PENDING'),
  ('00000000-0000-0000-0000-0000000000f9', '00000000-0000-0000-0000-0000000000d1', '00000000-0000-0000-0000-0000000000b1', '2026-03-10 23:30:00+05:30', 'PENDING'),
  ('00000000-0000-0000-0000-0000000000fa', '00000000-0000-0000-0000-0000000000d1', '00000000-0000-0000-0000-0000000000b1', '2026-03-11 00:30:00+05:30', 'PENDING'),
  ('00000000-0000-0000-0000-0000000000fb', '00000000-0000-0000-0000-0000000000d1', '00000000-0000-0000-0000-0000000000b1', '2026-03-09 23:59:00+05:30', 'PENDING');

select pg_temp.login('00000000-0000-0000-0000-0000000000a2');
select throws_ok($$select public.acknowledge_dose('00000000-0000-0000-0000-0000000000f1', 'ACKNOWLEDGED')$$, 'P0001', 'FORBIDDEN', 'FR-8.6 a caregiver cannot acknowledge');
reset role;
select pg_temp.login('00000000-0000-0000-0000-0000000000a3');
select throws_ok($$select public.acknowledge_dose('00000000-0000-0000-0000-0000000000f1', 'ACKNOWLEDGED')$$, 'P0001', 'FORBIDDEN', 'FR-8.6 a viewer cannot acknowledge');
reset role;
select pg_temp.login('00000000-0000-0000-0000-0000000000a5');
select throws_ok($$select public.acknowledge_dose('00000000-0000-0000-0000-0000000000f1', 'ACKNOWLEDGED')$$, 'P0001', 'NOT_FOUND', 'FR-8.6 an outsider gets NOT_FOUND');
reset role;

select pg_temp.login('00000000-0000-0000-0000-0000000000a4');
select throws_ok($$select public.acknowledge_dose('00000000-0000-0000-0000-0000000000f1', 'TAKEN')$$, 'P0001', 'VALIDATION_FAILED', 'an unknown action is refused');
select is((public.acknowledge_dose('00000000-0000-0000-0000-0000000000f1', 'ACKNOWLEDGED')).status, 'ACKNOWLEDGED', 'FR-8.2 the patient acknowledges a due dose');
select is(
  (select acknowledged_by from public.medication_reminders where id = '00000000-0000-0000-0000-0000000000f1'),
  '00000000-0000-0000-0000-0000000000a4'::uuid,
  'FR-8.2 the patient is recorded as the person who acknowledged'
);
select is(
  (public.acknowledge_dose('00000000-0000-0000-0000-0000000000f1', 'ACKNOWLEDGED')).acknowledged_at,
  (select acknowledged_at from public.medication_reminders where id = '00000000-0000-0000-0000-0000000000f1'),
  'FR-8.2 a repeated tap changes nothing'
);
select throws_ok($$select public.acknowledge_dose('00000000-0000-0000-0000-0000000000f1', 'SKIPPED')$$, 'P0001', 'CONFLICT', 'FR-8.3 an acknowledged dose cannot be changed to skipped');
select throws_ok($$select public.acknowledge_dose('00000000-0000-0000-0000-0000000000f2', 'ACKNOWLEDGED')$$, 'P0001', 'TOO_EARLY', 'FR-8.4 a dose 5 hours ahead is too early');
select is((public.acknowledge_dose('00000000-0000-0000-0000-0000000000f4', 'ACKNOWLEDGED')).status, 'ACKNOWLEDGED', 'FR-8.4 a dose 1 hour ahead can be acknowledged');
select is((public.acknowledge_dose('00000000-0000-0000-0000-0000000000f3', 'ACKNOWLEDGED')).status, 'ACKNOWLEDGED', 'FR-8.5 a missed dose can be marked taken late');
select throws_ok($$select public.acknowledge_dose('00000000-0000-0000-0000-0000000000f6', 'SKIPPED')$$, 'P0001', 'CONFLICT', 'FR-8.5 a missed dose cannot be changed to skipped');
select is((public.acknowledge_dose('00000000-0000-0000-0000-0000000000f7', 'SKIPPED')).status, 'SKIPPED', 'FR-8.3 the patient records a skipped dose');
select throws_ok($$select public.acknowledge_dose('00000000-0000-0000-0000-0000000000f5', 'ACKNOWLEDGED')$$, 'P0001', 'NOT_FOUND', 'FR-8.6 the patient cannot touch another patient''s dose');
select is((select count(*)::int from public.doses_for_day('00000000-0000-0000-0000-0000000000b1', '2026-03-10')), 2, 'FR-8.1 the day view holds only that local day''s doses');
select is(
  (select scheduled_for from public.doses_for_day('00000000-0000-0000-0000-0000000000b1', '2026-03-10') limit 1),
  '2026-03-10 08:00:00+05:30'::timestamptz,
  'FR-8.1 the day view is ordered by time'
);
reset role;

select is(
  (select count(*)::int from public.audit_logs
   where target_table = 'medication_reminders' and target_id = '00000000-0000-0000-0000-0000000000f1'
     and actor_id = '00000000-0000-0000-0000-0000000000a4'),
  1,
  'FR-8.2 the acknowledgement is audited once (the repeated tap wrote nothing)'
);

select pg_temp.login('00000000-0000-0000-0000-0000000000a5');
select is((select count(*)::int from public.doses_for_day('00000000-0000-0000-0000-0000000000b1', '2026-03-10')), 0, 'an outsider''s day view is empty');
reset role;

select * from finish();
rollback;
