-- ============================================================
-- 2026-10-22  guard_team_members: members cannot change their own role ticks
-- Already run live in the Supabase SQL Editor. This file is the record.
-- Before: a general member could (technically, not from the screen) change
-- their own role ticks (can_write, can_camera ...). Now the self-edit check
-- also covers the 12 older role ticks plus can_idea and can_publish.
-- Still allowed for the member: name, nickname, designation, photo, phone, whatsapp.
-- Owner and Managers: unchanged. Only the error text and the checked list changed.
-- ============================================================

begin;

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
        new.can_change_presenter, new.can_change_channel, new.can_approve_script, new.can_review_video,
        new.can_write, new.can_edit_video, new.can_produce, new.can_camera, new.can_present,
        new.can_light, new.can_vfx, new.can_color, new.can_sound_record, new.can_audio_mix,
        new.can_video_switch, new.can_live_audio, new.can_idea, new.can_publish)
       is distinct from
       (old.role, old.active, old.email, old.user_id, old.employee_id,
        old.can_edit_script, old.can_edit_metadata, old.can_assign_editor, old.can_reschedule,
        old.can_change_presenter, old.can_change_channel, old.can_approve_script, old.can_review_video,
        old.can_write, old.can_edit_video, old.can_produce, old.can_camera, old.can_present,
        old.can_light, old.can_vfx, old.can_color, old.can_sound_record, old.can_audio_mix,
        old.can_video_switch, old.can_live_audio, old.can_idea, old.can_publish) then
      raise exception 'You can only change your own name, nickname, designation, photo and phone numbers';
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
-- ROLLBACK: restore the previous version of the function from
-- sql/2026-10-21_team_contact_fields.sql (run its create or replace function block only).
-- ============================================================
