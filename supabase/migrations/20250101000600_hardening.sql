create table public.rate_limits (
  key text not null,
  window_start timestamptz not null,
  hits integer not null default 1,
  primary key (key, window_start)
);

alter table public.rate_limits enable row level security;
revoke all on table public.rate_limits from anon, authenticated;

create or replace function public.check_rate_limit(p_action text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  limit_count integer;
  window_seconds integer;
  bucket timestamptz;
  used integer;
begin
  if auth.uid() is null then
    raise exception 'UNAUTHENTICATED';
  end if;
  case p_action
    when 'PARSE' then
      limit_count := 20;
      window_seconds := 3600;
    when 'INVITE_CREATE' then
      limit_count := 20;
      window_seconds := 3600;
    when 'INVITE_ACCEPT' then
      limit_count := 10;
      window_seconds := 600;
    else
      raise exception 'VALIDATION_FAILED';
  end case;
  bucket := to_timestamp(floor(extract(epoch from now()) / window_seconds) * window_seconds);
  insert into public.rate_limits (key, window_start, hits)
  values (p_action || ':' || auth.uid()::text, bucket, 1)
  on conflict (key, window_start) do update set hits = public.rate_limits.hits + 1
  returning hits into used;
  if used > limit_count then
    raise exception 'RATE_LIMITED';
  end if;
end;
$$;

create or replace function public.soft_delete_patient(p_patient uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if public.my_role(p_patient) is null then
    raise exception 'NOT_FOUND';
  end if;
  if not public.has_role(p_patient, array['OWNER']) then
    raise exception 'FORBIDDEN';
  end if;
  update public.patients set deleted_at = now() where id = p_patient and deleted_at is null;
end;
$$;

create or replace function public.soft_delete_document(p_document uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  doc public.medical_documents%rowtype;
begin
  select * into doc from public.medical_documents where id = p_document and deleted_at is null for update;
  if not found or public.my_role(doc.patient_id) is null then
    raise exception 'NOT_FOUND';
  end if;
  if not public.has_role(doc.patient_id, array['OWNER']) then
    raise exception 'FORBIDDEN';
  end if;
  update public.medical_documents set deleted_at = now() where id = doc.id;
end;
$$;

create or replace function public.export_patient(p_patient uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  result jsonb;
begin
  if public.my_role(p_patient) is null then
    raise exception 'NOT_FOUND';
  end if;
  if not public.has_role(p_patient, array['OWNER', 'CAREGIVER']) then
    raise exception 'FORBIDDEN';
  end if;
  select jsonb_build_object(
    'exportedAt', now(),
    'patient', (select to_jsonb(p) - 'deleted_at' from public.patients p where p.id = p_patient),
    'people', coalesce((
      select jsonb_agg(jsonb_build_object('role', cl.role, 'status', cl.status, 'name', pr.full_name, 'email', pr.email, 'since', cl.created_at))
      from public.caregiver_links cl join public.profiles pr on pr.id = cl.user_id
      where cl.patient_id = p_patient
    ), '[]'::jsonb),
    'patientLogin', (
      select jsonb_build_object('name', pr.full_name, 'email', pr.email, 'since', pl.created_at)
      from public.patient_links pl join public.profiles pr on pr.id = pl.user_id
      where pl.patient_id = p_patient
    ),
    'consents', coalesce((select jsonb_agg(to_jsonb(c)) from public.consents c where c.patient_id = p_patient), '[]'::jsonb),
    'documents', coalesce((
      select jsonb_agg(to_jsonb(d) - 'deleted_at') from public.medical_documents d
      where d.patient_id = p_patient and d.deleted_at is null
    ), '[]'::jsonb),
    'medications', coalesce((select jsonb_agg(to_jsonb(m)) from public.medications m where m.patient_id = p_patient), '[]'::jsonb),
    'schedules', coalesce((select jsonb_agg(to_jsonb(s)) from public.medication_schedules s where s.patient_id = p_patient), '[]'::jsonb),
    'doses', coalesce((
      select jsonb_agg(to_jsonb(r) order by r.scheduled_for) from public.medication_reminders r where r.patient_id = p_patient
    ), '[]'::jsonb),
    'checkups', coalesce((select jsonb_agg(to_jsonb(cs)) from public.checkup_schedules cs where cs.patient_id = p_patient), '[]'::jsonb),
    'checkupCompletions', coalesce((select jsonb_agg(to_jsonb(cc)) from public.checkup_completions cc where cc.patient_id = p_patient), '[]'::jsonb)
  ) into result;
  insert into public.audit_logs (actor_id, patient_id, action, target_table, target_id, ip)
  values (auth.uid(), p_patient, 'EXPORT', 'patients', p_patient, public.request_ip());
  return result;
end;
$$;

create or replace function public.purge_candidates()
returns table (path text)
language sql
stable
security definer
set search_path = ''
as $$
  select d.file_path
  from public.medical_documents d
  join public.patients p on p.id = d.patient_id
  where d.deleted_at < now() - interval '30 days' or p.deleted_at < now() - interval '30 days'
  union
  select o.name
  from storage.objects o
  where o.bucket_id = 'medical-documents'
    and o.created_at < now() - interval '1 day'
    and not exists (select 1 from public.medical_documents d where d.file_path = o.name);
$$;

create or replace function public.purge_finish()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  documents_deleted integer;
  patients_deleted integer;
begin
  delete from public.medical_documents d
  using public.patients p
  where p.id = d.patient_id
    and (d.deleted_at < now() - interval '30 days' or p.deleted_at < now() - interval '30 days')
    and not exists (select 1 from storage.objects o where o.bucket_id = 'medical-documents' and o.name = d.file_path);
  get diagnostics documents_deleted = row_count;
  delete from public.patients p
  where p.deleted_at < now() - interval '30 days'
    and not exists (select 1 from public.medical_documents d where d.patient_id = p.id);
  get diagnostics patients_deleted = row_count;
  delete from public.rate_limits where window_start < now() - interval '1 day';
  return jsonb_build_object('documents', documents_deleted, 'patients', patients_deleted);
end;
$$;

revoke all on function public.check_rate_limit(text) from public, anon;
revoke all on function public.soft_delete_patient(uuid) from public, anon;
revoke all on function public.soft_delete_document(uuid) from public, anon;
revoke all on function public.export_patient(uuid) from public, anon;
revoke all on function public.purge_candidates() from public, anon, authenticated;
revoke all on function public.purge_finish() from public, anon, authenticated;

grant execute on function public.check_rate_limit(text) to authenticated;
grant execute on function public.soft_delete_patient(uuid) to authenticated;
grant execute on function public.soft_delete_document(uuid) to authenticated;
grant execute on function public.export_patient(uuid) to authenticated;
grant execute on function public.purge_candidates() to service_role;
grant execute on function public.purge_finish() to service_role;
