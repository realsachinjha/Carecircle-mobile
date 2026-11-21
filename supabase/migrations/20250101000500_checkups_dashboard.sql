create table public.checkup_schedules (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients (id) on delete cascade,
  checkup_type text not null default 'CONSULTATION' check (checkup_type in ('CONSULTATION', 'LAB_TEST', 'DIAGNOSTIC', 'OTHER')),
  doctor_name varchar(128) not null check (length(trim(doctor_name)) > 0),
  clinic_location text check (length(clinic_location) <= 500),
  appointment_time timestamptz not null,
  reminder_hours_before integer not null default 24 check (reminder_hours_before between 1 and 168),
  reminded_at timestamptz,
  notes text check (length(notes) <= 2000),
  created_by uuid not null references public.profiles (id),
  created_at timestamptz not null default now(),
  unique (id, patient_id)
);

create index checkup_schedules_patient_time on public.checkup_schedules (patient_id, appointment_time);
create index checkup_schedules_due on public.checkup_schedules (appointment_time) where reminded_at is null;

create table public.checkup_completions (
  id uuid primary key default gen_random_uuid(),
  checkup_id uuid not null unique,
  patient_id uuid not null,
  completed_at timestamptz not null default now(),
  completed_by uuid not null references public.profiles (id),
  clinical_notes text check (length(clinical_notes) <= 4000),
  foreign key (checkup_id, patient_id) references public.checkup_schedules (id, patient_id) on delete cascade
);

create or replace function public.save_checkup(
  p_checkup uuid,
  p_patient uuid,
  p_checkup_type text,
  p_doctor_name text,
  p_clinic_location text,
  p_local_time timestamp,
  p_reminder_hours_before integer,
  p_notes text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  target public.checkup_schedules%rowtype;
  patient uuid;
  zone text;
  appointment timestamptz;
  new_id uuid;
begin
  if p_checkup is null then
    patient := p_patient;
  else
    select * into target from public.checkup_schedules where id = p_checkup for update;
    if not found then
      raise exception 'NOT_FOUND';
    end if;
    patient := target.patient_id;
  end if;
  if public.my_role(patient) is null then
    raise exception 'NOT_FOUND';
  end if;
  if not public.has_role(patient, array['OWNER', 'CAREGIVER']) then
    raise exception 'FORBIDDEN';
  end if;
  if p_local_time is null or p_doctor_name is null or length(trim(p_doctor_name)) = 0 then
    raise exception 'VALIDATION_FAILED';
  end if;
  select timezone into zone from public.patients where id = patient;
  appointment := p_local_time at time zone zone;
  if p_checkup is null then
    insert into public.checkup_schedules (
      patient_id, checkup_type, doctor_name, clinic_location, appointment_time, reminder_hours_before, notes, created_by
    )
    values (
      patient,
      coalesce(p_checkup_type, 'CONSULTATION'),
      trim(p_doctor_name),
      nullif(trim(p_clinic_location), ''),
      appointment,
      coalesce(p_reminder_hours_before, 24),
      nullif(trim(p_notes), ''),
      auth.uid()
    )
    returning id into new_id;
    return new_id;
  end if;
  update public.checkup_schedules
  set checkup_type = coalesce(p_checkup_type, checkup_type),
      doctor_name = trim(p_doctor_name),
      clinic_location = nullif(trim(p_clinic_location), ''),
      appointment_time = appointment,
      reminder_hours_before = coalesce(p_reminder_hours_before, reminder_hours_before),
      notes = nullif(trim(p_notes), ''),
      reminded_at = case
        when appointment_time is distinct from appointment
          or reminder_hours_before is distinct from coalesce(p_reminder_hours_before, reminder_hours_before)
        then null
        else reminded_at
      end
  where id = p_checkup;
  return p_checkup;
end;
$$;

create or replace function public.delete_checkup(p_checkup uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  target public.checkup_schedules%rowtype;
begin
  select * into target from public.checkup_schedules where id = p_checkup for update;
  if not found or public.my_role(target.patient_id) is null then
    raise exception 'NOT_FOUND';
  end if;
  if not public.has_role(target.patient_id, array['OWNER', 'CAREGIVER']) then
    raise exception 'FORBIDDEN';
  end if;
  delete from public.checkup_schedules where id = target.id;
end;
$$;

create or replace function public.complete_checkup(p_checkup uuid, p_notes text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  target public.checkup_schedules%rowtype;
  completion_id uuid;
begin
  select * into target from public.checkup_schedules where id = p_checkup;
  if not found or public.my_role(target.patient_id) is null then
    raise exception 'NOT_FOUND';
  end if;
  if not public.has_role(target.patient_id, array['OWNER', 'CAREGIVER']) then
    raise exception 'FORBIDDEN';
  end if;
  insert into public.checkup_completions (checkup_id, patient_id, completed_by, clinical_notes)
  values (target.id, target.patient_id, auth.uid(), nullif(trim(p_notes), ''))
  on conflict (checkup_id) do update set clinical_notes = excluded.clinical_notes
  returning id into completion_id;
  return completion_id;
end;
$$;

create or replace function public.send_checkup_reminders(p_now timestamptz default now())
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  reminded_count integer;
begin
  with due as (
    update public.checkup_schedules c
    set reminded_at = p_now
    from public.patients p
    where p.id = c.patient_id
      and p.deleted_at is null
      and c.reminded_at is null
      and c.appointment_time > p_now
      and c.appointment_time - make_interval(hours => c.reminder_hours_before) <= p_now
      and not exists (select 1 from public.checkup_completions cc where cc.checkup_id = c.id)
    returning c.id, c.patient_id, c.doctor_name, c.appointment_time, c.checkup_type
  ),
  recipients as (
    select d.*, cl.user_id
    from due d
    join public.caregiver_links cl on cl.patient_id = d.patient_id and cl.status = 'ACTIVE'
    union all
    select d.*, pl.user_id
    from due d
    join public.patient_links pl on pl.patient_id = d.patient_id
  ),
  notified as (
    insert into public.notifications (user_id, patient_id, kind, data)
    select
      r.user_id,
      r.patient_id,
      'CHECKUP_SOON',
      jsonb_build_object('checkupId', r.id, 'doctorName', r.doctor_name, 'appointmentTime', r.appointment_time, 'checkupType', r.checkup_type)
    from recipients r
    returning 1
  )
  select count(*)::int into reminded_count from due;
  return reminded_count;
end;
$$;

create or replace function public.compliance(p_patient uuid, p_days integer default 7, p_now timestamptz default now())
returns jsonb
language plpgsql
stable
security invoker
set search_path = ''
as $$
declare
  zone text;
  local_today date;
  result jsonb;
begin
  if p_days is null or p_days not between 1 and 90 then
    raise exception 'VALIDATION_FAILED';
  end if;
  select timezone into zone from public.patients where id = p_patient;
  if zone is null then
    raise exception 'NOT_FOUND';
  end if;
  local_today := (p_now at time zone zone)::date;
  select jsonb_build_object(
    'days', coalesce(
      jsonb_agg(
        jsonb_build_object('date', d.day, 'taken', c.taken, 'skipped', c.skipped, 'missed', c.missed, 'pending', c.pending)
        order by d.day
      ),
      '[]'::jsonb
    ),
    'totals', jsonb_build_object(
      'taken', coalesce(sum(c.taken), 0),
      'skipped', coalesce(sum(c.skipped), 0),
      'missed', coalesce(sum(c.missed), 0),
      'pending', coalesce(sum(c.pending), 0)
    )
  )
  into result
  from (
    select (local_today - offset_days) as day
    from generate_series(0, p_days - 1) as offset_days
  ) as d
  cross join lateral (
    select
      count(*) filter (where r.status = 'ACKNOWLEDGED')::int as taken,
      count(*) filter (where r.status = 'SKIPPED')::int as skipped,
      count(*) filter (where r.status = 'MISSED')::int as missed,
      count(*) filter (where r.status = 'PENDING')::int as pending
    from public.medication_reminders r
    where r.patient_id = p_patient
      and r.scheduled_for >= (d.day::timestamp at time zone zone)
      and r.scheduled_for < ((d.day + 1)::timestamp at time zone zone)
      and r.scheduled_for <= p_now
  ) as c;
  return result;
end;
$$;

create trigger audit_checkup_schedules after insert or update or delete on public.checkup_schedules
for each row execute function public.audit_row_change();
create trigger audit_checkup_completions after insert or update or delete on public.checkup_completions
for each row execute function public.audit_row_change();

alter table public.checkup_schedules enable row level security;
alter table public.checkup_completions enable row level security;

revoke all on table public.checkup_schedules, public.checkup_completions from anon, authenticated;
grant select on table public.checkup_schedules, public.checkup_completions to authenticated;

create policy checkup_schedules_select on public.checkup_schedules for select to authenticated
  using (public.my_role(patient_id) is not null);
create policy checkup_completions_select on public.checkup_completions for select to authenticated
  using (public.my_role(patient_id) is not null);

alter publication supabase_realtime add table public.medication_reminders, public.notifications;
alter table public.medication_reminders replica identity full;
alter table public.notifications replica identity full;

revoke all on function public.save_checkup(uuid, uuid, text, text, text, timestamp, integer, text) from public, anon;
revoke all on function public.delete_checkup(uuid) from public, anon;
revoke all on function public.complete_checkup(uuid, text) from public, anon;
revoke all on function public.send_checkup_reminders(timestamptz) from public, anon, authenticated;
revoke all on function public.compliance(uuid, integer, timestamptz) from public, anon;

grant execute on function public.save_checkup(uuid, uuid, text, text, text, timestamp, integer, text) to authenticated;
grant execute on function public.delete_checkup(uuid) to authenticated;
grant execute on function public.complete_checkup(uuid, text) to authenticated;
grant execute on function public.compliance(uuid, integer, timestamptz) to authenticated;

select cron.schedule('carecircle-checkup-reminders', '*/15 * * * *', $$select public.send_checkup_reminders()$$);
