-- ============================================================
-- 2026-10-21  Team contact fields: employee_id, phone, whatsapp
-- Already run live in the Supabase SQL Editor. This file is the record.
-- Adds three optional text columns to team_members.
-- guard_team_members: a member cannot change their own employee_id
-- (only the Owner and Managers can). Phone and whatsapp can be changed
-- by the member. All other rules of the function are unchanged.
-- ============================================================

begin;

alter table public.team_members add column if not exists employee_id text;
alter table public.team_members add column if not exists phone text;
alter table public.team_members add column if not exists whatsapp text;

create or replace function public.guard_team_members()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  me public.team_members;
  is_self boolean;
begin
  if auth.uid() is null then
    return new;  -- SQL Editor / server tools
  end if;
  select * into me from public.my_member_row();
  if new.organization_id is distinct from old.organization_id then
    raise exception 'A member cannot be moved to another organization';
  end if;
  if me.id is null or me.organization_id is distinct from old.organization_id then
    raise exception 'Not allowed';
  end if;
  is_self := (old.auth_user_id = auth.uid())
    or (old.auth_user_id is null and old.email is not null
        and lower(old.email) = lower(coalesce(auth.jwt() ->> 'email', '')));

  if me.role = 'owner' and coalesce(me.active, true) then
    return new;
  end if;

  if me.role = 'manager' and coalesce(me.active, true) and old.role = 'general' then
    if new.role is distinct from old.role then
      raise exception 'Only the Owner can change roles';
    end if;
    return new;
  end if;

  if is_self then
    if (new.role, new.active, new.email, new.user_id, new.employee_id,
        new.can_edit_script, new.can_edit_metadata, new.can_assign_editor, new.can_reschedule,
        new.can_change_presenter, new.can_change_channel, new.can_approve_script, new.can_review_video)
       is distinct from
       (old.role, old.active, old.email, old.user_id, old.employee_id,
        old.can_edit_script, old.can_edit_metadata, old.can_assign_editor, old.can_reschedule,
        old.can_change_presenter, old.can_change_channel, old.can_approve_script, old.can_review_video) then
      raise exception 'You can only change your own name, designation, photo and phone numbers';
    end if;
    if new.auth_user_id is distinct from old.auth_user_id
       and not (old.auth_user_id is null and new.auth_user_id = auth.uid()) then
      raise exception 'Login link cannot be changed';
    end if;
    return new;
  end if;

  raise exception 'Not allowed';
end;
$function$;

commit;

-- ============================================================
-- ROLLBACK (only if needed; it removes the three columns and their data):
--   alter table public.team_members drop column employee_id, drop column phone, drop column whatsapp;
-- The function would also need its previous version restored
-- (the old version did not mention employee_id and had the older error text).
-- ============================================================
