create or replace function public.acknowledge_dose(p_reminder uuid, p_action text)
returns public.medication_reminders
language plpgsql
security definer
set search_path = ''
as $$
declare
  reminder public.medication_reminders%rowtype;
  caller_role text;
begin
  if p_action is null or p_action not in ('ACKNOWLEDGED', 'SKIPPED') then
    raise exception 'VALIDATION_FAILED';
  end if;
  select * into reminder from public.medication_reminders where id = p_reminder for update;
  if not found then
    raise exception 'NOT_FOUND';
  end if;
  caller_role := public.my_role(reminder.patient_id);
  if caller_role is null then
    raise exception 'NOT_FOUND';
  end if;
  if caller_role <> 'PATIENT' then
    raise exception 'FORBIDDEN';
  end if;
  if reminder.status = p_action then
    return reminder;
  end if;
  if reminder.scheduled_for > now() + interval '2 hours' then
    raise exception 'TOO_EARLY';
  end if;
  if reminder.status = 'PENDING' or (reminder.status = 'MISSED' and p_action = 'ACKNOWLEDGED') then
    update public.medication_reminders
    set status = p_action, acknowledged_at = now(), acknowledged_by = auth.uid()
    where id = reminder.id
    returning * into reminder;
    return reminder;
  end if;
  raise exception 'CONFLICT';
end;
$$;

create or replace function public.doses_for_day(p_patient uuid, p_day date default null)
returns table (
  reminder_id uuid,
  scheduled_for timestamptz,
  status text,
  acknowledged_at timestamptz,
  slot text,
  medication_name text,
  dosage text,
  instructions text
)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    r.id,
    r.scheduled_for,
    r.status,
    r.acknowledged_at,
    s.slot,
    m.name::text,
    m.dosage::text,
    m.instructions
  from public.medication_reminders r
  join public.medication_schedules s on s.id = r.schedule_id
  join public.medications m on m.id = s.medication_id
  join public.patients p on p.id = r.patient_id
  where r.patient_id = p_patient
    and r.scheduled_for >= (coalesce(p_day, (now() at time zone p.timezone)::date)::timestamp at time zone p.timezone)
    and r.scheduled_for < ((coalesce(p_day, (now() at time zone p.timezone)::date) + 1)::timestamp at time zone p.timezone)
  order by r.scheduled_for, m.name;
$$;

revoke all on function public.acknowledge_dose(uuid, text) from public, anon;
revoke all on function public.doses_for_day(uuid, date) from public, anon;
grant execute on function public.acknowledge_dose(uuid, text) to authenticated;
grant execute on function public.doses_for_day(uuid, date) to authenticated;
