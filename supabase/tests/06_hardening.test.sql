begin;
create extension if not exists pgtap with schema extensions;
select plan(19);

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

select is_empty(
  $$select tablename from pg_tables where schemaname = 'public' and not rowsecurity$$,
  'every public table has row-level security on'
);
select is_empty(
  $$select p.proname from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and has_function_privilege('anon', p.oid, 'EXECUTE')$$,
  'anonymous visitors cannot run any public function'
);
select is_empty(
  $$select tablename from pg_tables where schemaname = 'public'
    and (has_table_privilege('anon', format('%I.%I', schemaname, tablename), 'SELECT')
      or has_table_privilege('anon', format('%I.%I', schemaname, tablename), 'INSERT')
      or has_table_privilege('anon', format('%I.%I', schemaname, tablename), 'UPDATE')
      or has_table_privilege('anon', format('%I.%I', schemaname, tablename), 'DELETE'))$$,
  'anonymous visitors have no table privileges'
);
select is_empty(
  $$select tablename from pg_tables where schemaname = 'public'
    and (has_table_privilege('authenticated', format('%I.%I', schemaname, tablename), 'INSERT')
      or has_table_privilege('authenticated', format('%I.%I', schemaname, tablename), 'DELETE'))$$,
  'signed-in users cannot insert or delete rows directly; all writes go through checked functions'
);
select ok(
  not has_function_privilege('authenticated', 'public.purge_finish()', 'EXECUTE')
    and not has_function_privilege('authenticated', 'public.purge_candidates()', 'EXECUTE'),
  'signed-in users cannot run the purge'
);

select pg_temp.make_user('00000000-0000-0000-0000-0000000000a1', 'owner@test.local');
select pg_temp.make_user('00000000-0000-0000-0000-0000000000a2', 'care@test.local');
select pg_temp.make_user('00000000-0000-0000-0000-0000000000a3', 'viewer@test.local');

insert into public.patients (id, full_name, date_of_birth, created_by)
values ('00000000-0000-0000-0000-0000000000b1', 'Ramesh Test', '1957-03-04', '00000000-0000-0000-0000-0000000000a1');
insert into public.caregiver_links (patient_id, user_id, role) values
  ('00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-0000000000a1', 'OWNER'),
  ('00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-0000000000a2', 'CAREGIVER'),
  ('00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-0000000000a3', 'VIEWER');
insert into public.medical_documents (id, patient_id, uploaded_by, file_path, mime_type, size_bytes, sha256, document_type)
values (
  '00000000-0000-0000-0000-0000000000c1', '00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-0000000000a1',
  '00000000-0000-0000-0000-0000000000b1/00000000-0000-0000-0000-0000000000c1.jpg', 'image/jpeg', 100, repeat('a', 64), 'PRESCRIPTION'
);

select pg_temp.login('00000000-0000-0000-0000-0000000000a2');
select lives_ok($$select public.check_rate_limit('PARSE') from generate_series(1, 20)$$, 'the first 20 parse calls in an hour are allowed');
select throws_ok($$select public.check_rate_limit('PARSE')$$, 'P0001', 'RATE_LIMITED', 'the 21st parse call in an hour is refused');
select throws_ok($$select public.check_rate_limit('ANYTHING')$$, 'P0001', 'VALIDATION_FAILED', 'an unknown rate-limit action is refused');
select throws_ok($$select public.soft_delete_patient('00000000-0000-0000-0000-0000000000b1')$$, 'P0001', 'FORBIDDEN', 'FR-2.3 a caregiver cannot delete a patient');
select ok(
  public.export_patient('00000000-0000-0000-0000-0000000000b1') ?& array['patient', 'people', 'consents', 'documents', 'medications', 'schedules', 'doses', 'checkups'],
  'FR-2.4 a caregiver exports every section'
);
reset role;

select is((select count(*)::int from public.audit_logs where action = 'EXPORT'), 1, 'FR-2.4 the export is audited');

select pg_temp.login('00000000-0000-0000-0000-0000000000a3');
select throws_ok($$select public.export_patient('00000000-0000-0000-0000-0000000000b1')$$, 'P0001', 'FORBIDDEN', 'FR-2.4 a viewer cannot export');
reset role;

select pg_temp.login('00000000-0000-0000-0000-0000000000a1');
select lives_ok($$select public.soft_delete_document('00000000-0000-0000-0000-0000000000c1')$$, 'FR-4.4 the owner deletes a document');
reset role;
select pg_temp.login('00000000-0000-0000-0000-0000000000a3');
select is((select count(*)::int from public.medical_documents), 0, 'FR-4.4 a deleted document disappears for everyone');
reset role;

select pg_temp.login('00000000-0000-0000-0000-0000000000a1');
select lives_ok($$select public.soft_delete_patient('00000000-0000-0000-0000-0000000000b1')$$, 'FR-2.3 the owner deletes a patient');
select is((select count(*)::int from public.patients), 0, 'FR-2.3 the deleted patient disappears for the owner');
reset role;
select pg_temp.login('00000000-0000-0000-0000-0000000000a2');
select is((select count(*)::int from public.patients), 0, 'FR-2.3 the deleted patient disappears for the caregiver');
reset role;

update public.medical_documents set deleted_at = now() - interval '31 days' where id = '00000000-0000-0000-0000-0000000000c1';
update public.patients set deleted_at = now() - interval '31 days' where id = '00000000-0000-0000-0000-0000000000b1';
select is(
  (select count(*)::int from public.purge_candidates() where path = '00000000-0000-0000-0000-0000000000b1/00000000-0000-0000-0000-0000000000c1.jpg'),
  1,
  'FR-4.4 a document deleted 31 days ago is listed for purging'
);
select is(
  public.purge_finish(),
  '{"documents": 1, "patients": 1}'::jsonb,
  'FR-2.3 FR-4.4 the purge removes the document row and then the patient'
);

select * from finish();
rollback;
