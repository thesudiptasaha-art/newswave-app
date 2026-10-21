-- ============================================================
-- 2026-10-22  Roles and Access rename (clean database naming)
-- Already run live in the Supabase SQL Editor in one transaction. This file is the record.
-- team_members: 7 Access columns and 14 Role columns renamed (can_change_channel kept its name);
--   2 new roles added (role_graphic_designer, role_voice_over_artist).
-- contents: credit columns renamed (publisher became published_by, uploader became publisher,
--   idea_by became concept_creator, camera_person became camera_operator, vfx became
--   motion_graphics_designer, video_switcher became live_video_switcher, live_audio became
--   live_audio_mixer); 2 new credit columns (graphic_designer, voice_over_artist).
-- Functions recreated with the new names: guard_team_members, guard_contents_update,
--   cascade_member_rename, notify_content_update.
-- The app code for this change was merged to main at commit b8be752.
-- ============================================================

begin;

-- 0. Pre-check: old columns must exist, new columns must not exist yet
do $$
declare
  r record;
  bad text := '';
begin
  for r in
    select * from (values
      ('team_members','can_edit_script','can_write_edit_scripts'),
      ('team_members','can_approve_script','can_approve_scripts'),
      ('team_members','can_edit_metadata','can_edit_content_details'),
      ('team_members','can_reschedule','can_reschedule_content'),
      ('team_members','can_assign_editor','can_assign_video_editor'),
      ('team_members','can_change_presenter','can_assign_presenter'),
      ('team_members','can_review_video','can_review_videos'),
      ('team_members','can_write','role_research_script_writer'),
      ('team_members','can_idea','role_concept_creator'),
      ('team_members','can_produce','role_producer'),
      ('team_members','can_present','role_presenter'),
      ('team_members','can_camera','role_camera_operator'),
      ('team_members','can_light','role_light_designer'),
      ('team_members','can_sound_record','role_sound_recordist'),
      ('team_members','can_edit_video','role_video_editor'),
      ('team_members','can_vfx','role_motion_graphics_designer'),
      ('team_members','can_color','role_colorist'),
      ('team_members','can_audio_mix','role_audio_mixer'),
      ('team_members','can_video_switch','role_live_video_switcher'),
      ('team_members','can_live_audio','role_live_audio_mixer'),
      ('team_members','can_publish','role_publisher'),
      ('contents','publisher','published_by'),
      ('contents','idea_by','concept_creator'),
      ('contents','camera_person','camera_operator'),
      ('contents','vfx','motion_graphics_designer'),
      ('contents','video_switcher','live_video_switcher'),
      ('contents','live_audio','live_audio_mixer'),
      ('contents','uploader','publisher')
    ) as t(tbl, old_name, new_name)
  loop
    if not exists (select 1 from information_schema.columns
                   where table_schema = 'public' and table_name = r.tbl and column_name = r.old_name) then
      bad := bad || r.tbl || '.' || r.old_name || ' is missing; ';
    end if;
    -- contents.publisher is freed by the first rename, so it is not checked here
    if r.new_name <> 'publisher' and exists (select 1 from information_schema.columns
                   where table_schema = 'public' and table_name = r.tbl and column_name = r.new_name) then
      bad := bad || r.tbl || '.' || r.new_name || ' already exists; ';
    end if;
  end loop;

  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'team_members' and column_name in ('role_graphic_designer','role_voice_over_artist'))
     or exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'contents' and column_name in ('graphic_designer','voice_over_artist')) then
    bad := bad || 'a new Graphic Designer / Voice Over Artist column already exists; ';
  end if;

  if bad <> '' then
    raise exception 'Pre-check failed: %', bad;
  end if;
end $$;

-- 1. team_members: Access columns
alter table public.team_members rename column can_edit_script      to can_write_edit_scripts;
alter table public.team_members rename column can_approve_script   to can_approve_scripts;
alter table public.team_members rename column can_edit_metadata    to can_edit_content_details;
alter table public.team_members rename column can_reschedule       to can_reschedule_content;
alter table public.team_members rename column can_assign_editor    to can_assign_video_editor;
alter table public.team_members rename column can_change_presenter to can_assign_presenter;
alter table public.team_members rename column can_review_video     to can_review_videos;

-- 2. team_members: Role columns
alter table public.team_members rename column can_write        to role_research_script_writer;
alter table public.team_members rename column can_idea         to role_concept_creator;
alter table public.team_members rename column can_produce      to role_producer;
alter table public.team_members rename column can_present      to role_presenter;
alter table public.team_members rename column can_camera       to role_camera_operator;
alter table public.team_members rename column can_light        to role_light_designer;
alter table public.team_members rename column can_sound_record to role_sound_recordist;
alter table public.team_members rename column can_edit_video   to role_video_editor;
alter table public.team_members rename column can_vfx          to role_motion_graphics_designer;
alter table public.team_members rename column can_color        to role_colorist;
alter table public.team_members rename column can_audio_mix    to role_audio_mixer;
alter table public.team_members rename column can_video_switch to role_live_video_switcher;
alter table public.team_members rename column can_live_audio   to role_live_audio_mixer;
alter table public.team_members rename column can_publish      to role_publisher;

-- 3. team_members: two new roles
alter table public.team_members add column role_graphic_designer boolean not null default false;
alter table public.team_members add column role_voice_over_artist boolean not null default false;

-- 4. contents: credit columns (publisher must move first)
alter table public.contents rename column publisher     to published_by;
alter table public.contents rename column uploader      to publisher;
alter table public.contents rename column idea_by       to concept_creator;
alter table public.contents rename column camera_person to camera_operator;
alter table public.contents rename column vfx           to motion_graphics_designer;
alter table public.contents rename column video_switcher to live_video_switcher;
alter table public.contents rename column live_audio    to live_audio_mixer;
alter table public.contents add column graphic_designer  text;
alter table public.contents add column voice_over_artist text;

-- 5. guard_team_members
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
        new.can_write_edit_scripts, new.can_approve_scripts, new.can_edit_content_details,
        new.can_change_channel, new.can_reschedule_content, new.can_assign_video_editor,
        new.can_assign_presenter, new.can_review_videos,
        new.role_research_script_writer, new.role_concept_creator, new.role_producer,
        new.role_presenter, new.role_camera_operator, new.role_light_designer,
        new.role_sound_recordist, new.role_voice_over_artist, new.role_video_editor,
        new.role_motion_graphics_designer, new.role_graphic_designer, new.role_colorist,
        new.role_audio_mixer, new.role_live_video_switcher, new.role_live_audio_mixer,
        new.role_publisher)
       is distinct from
       (old.role, old.active, old.email, old.user_id, old.employee_id,
        old.can_write_edit_scripts, old.can_approve_scripts, old.can_edit_content_details,
        old.can_change_channel, old.can_reschedule_content, old.can_assign_video_editor,
        old.can_assign_presenter, old.can_review_videos,
        old.role_research_script_writer, old.role_concept_creator, old.role_producer,
        old.role_presenter, old.role_camera_operator, old.role_light_designer,
        old.role_sound_recordist, old.role_voice_over_artist, old.role_video_editor,
        old.role_motion_graphics_designer, old.role_graphic_designer, old.role_colorist,
        old.role_audio_mixer, old.role_live_video_switcher, old.role_live_audio_mixer,
        old.role_publisher) then
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

-- 6. guard_contents_update
create or replace function public.guard_contents_update()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  me public.team_members;
  mgr boolean;
  ok boolean := false;
begin
  if auth.uid() is null or coalesce(current_setting('nw.bypass_guard', true), '') = '1' then
    return new;
  end if;

  select * into me from public.my_member_row();
  if me.id is null or coalesce(me.active, true) = false
     or me.organization_id is distinct from old.organization_id then
    raise exception 'Not allowed';
  end if;
  mgr := me.role in ('owner', 'manager');

  if new.organization_id is distinct from old.organization_id then
    raise exception 'Content cannot be moved to another organization';
  end if;
  if old.content_uid like 'CON-%' and new.content_uid is distinct from old.content_uid then
    raise exception 'Content ID cannot be changed';
  end if;

  -- field permissions
  if new.script is distinct from old.script then
    if not public.perm_of(me, 'can_write_edit_scripts') then
      raise exception 'You need the "Write & Edit Scripts" access';
    end if;
    if coalesce(old.is_script_locked, false) and not mgr then
      raise exception 'This script is locked';
    end if;
  end if;
  if new.is_script_locked is distinct from old.is_script_locked and not mgr then
    raise exception 'Only Managers and the Owner can lock or unlock a script';
  end if;
  if (new.title is distinct from old.title
      or new.thumbnail_text is distinct from old.thumbnail_text
      or new.writer is distinct from old.writer
      or new.camera_operator is distinct from old.camera_operator
      or new.archive_shelf_id is distinct from old.archive_shelf_id
      or new.target_platforms is distinct from old.target_platforms
      or new.post_caption is distinct from old.post_caption
      or new.seo_keywords is distinct from old.seo_keywords
      or new.hashtags is distinct from old.hashtags)
     and not public.perm_of(me, 'can_edit_content_details') then
    raise exception 'You need the "Edit Content Details" access';
  end if;
  if new.channel is distinct from old.channel and not public.perm_of(me, 'can_change_channel') then
    raise exception 'You need the "Change Channel" access';
  end if;
  if new.scheduled_publish_time is distinct from old.scheduled_publish_time
     and not public.perm_of(me, 'can_reschedule_content') then
    raise exception 'You need the "Reschedule Content" access';
  end if;
  if new.presenter_name is distinct from old.presenter_name
     and not public.perm_of(me, 'can_assign_presenter') then
    raise exception 'You need the "Assign Presenter" access';
  end if;
  if new.video_editor is distinct from old.video_editor
     and not public.perm_of(me, 'can_assign_video_editor') then
    raise exception 'You need the "Assign Video Editor" access';
  end if;

  -- history can only grow
  if jsonb_typeof(old.audit_log) = 'array'
     and (jsonb_typeof(new.audit_log) is distinct from 'array'
          or not (new.audit_log @> old.audit_log)
          or jsonb_array_length(new.audit_log) < jsonb_array_length(old.audit_log)) then
    raise exception 'History cannot be edited';
  end if;
  if jsonb_typeof(old.revisions) = 'array'
     and (jsonb_typeof(new.revisions) is distinct from 'array'
          or not (new.revisions @> old.revisions)
          or jsonb_array_length(new.revisions) < jsonb_array_length(old.revisions)) then
    raise exception 'Revision notes cannot be edited';
  end if;

  -- publish stamp only moves together with the Publish step
  if (new.published_at is distinct from old.published_at or new.published_by is distinct from old.published_by)
     and new.status is not distinct from old.status and not mgr then
    raise exception 'Not allowed';
  end if;

  -- workflow: only the real steps, by the right people
  if new.status is distinct from old.status then
    ok := case
      when old.status = 'Draft' and new.status = 'Script Submitted'
        then public.perm_of(me, 'can_write_edit_scripts') and btrim(coalesce(new.script, '')) <> ''
      when old.status = 'Script Submitted'
           and new.status = (case old.content_type when 'LIVE' then 'Published' when 'PACKAGE' then 'Assign Editor' else 'Ready for Shoot' end)
        then public.perm_of(me, 'can_approve_scripts')
      when old.status = 'Script Submitted' and new.status = 'Draft'
        then public.perm_of(me, 'can_approve_scripts')
      when old.status = 'Ready for Shoot' and new.status = 'Shooting' then true
      when old.status = 'Shooting' and new.status = 'Assign Editor' then true
      when old.status = 'Assign Editor' and new.status = 'Editing'
        then public.perm_of(me, 'can_assign_video_editor') and btrim(coalesce(new.video_editor, '')) <> ''
      when old.status = 'Editing' and new.status = 'Video Review'
        then mgr or (old.video_editor is not null and old.video_editor = me.full_name)
      when old.status = 'Video Review' and new.status in ('Ready to Publish', 'Editing')
        then public.perm_of(me, 'can_review_videos')
      when old.status = 'Ready to Publish' and new.status = 'Published' then mgr
      when old.status = 'On Hold' and new.status = coalesce(old.previous_status, 'Draft') then mgr
      when old.status = 'Dropped' and new.status = 'Draft' then mgr
      when old.status = 'Re-Shoot' and new.status = 'Ready for Shoot' then true
      when old.status in ('Editing', 'Video Review') and new.status = 'Re-Shoot' then mgr
      when old.status not in ('Published', 'Dropped', 'On Hold') and new.status in ('On Hold', 'Dropped') then mgr
      else false
    end;
    if not ok then
      raise exception 'This status change is not allowed for you (% -> %)', old.status, new.status;
    end if;
  end if;

  return new;
end;
$function$;

-- 7. cascade_member_rename
create or replace function public.cascade_member_rename()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  if new.full_name is distinct from old.full_name and old.full_name is not null then
    perform set_config('nw.bypass_guard', '1', true);
    update public.contents set
      writer                   = case when writer                   = old.full_name then new.full_name else writer                   end,
      presenter_name           = case when presenter_name           = old.full_name then new.full_name else presenter_name           end,
      video_editor             = case when video_editor             = old.full_name then new.full_name else video_editor             end,
      camera_operator          = case when camera_operator          = old.full_name then new.full_name else camera_operator          end,
      published_by             = case when published_by             = old.full_name then new.full_name else published_by             end,
      concept_creator          = case when concept_creator          = old.full_name then new.full_name else concept_creator          end,
      producer                 = case when producer                 = old.full_name then new.full_name else producer                 end,
      publisher                = case when publisher                = old.full_name then new.full_name else publisher                end,
      motion_graphics_designer = case when motion_graphics_designer = old.full_name then new.full_name else motion_graphics_designer end,
      graphic_designer         = case when graphic_designer         = old.full_name then new.full_name else graphic_designer         end,
      voice_over_artist        = case when voice_over_artist        = old.full_name then new.full_name else voice_over_artist        end,
      colorist                 = case when colorist                 = old.full_name then new.full_name else colorist                 end,
      light_designer           = case when light_designer           = old.full_name then new.full_name else light_designer           end,
      sound_recordist          = case when sound_recordist          = old.full_name then new.full_name else sound_recordist          end,
      audio_mixer              = case when audio_mixer              = old.full_name then new.full_name else audio_mixer              end,
      live_video_switcher      = case when live_video_switcher      = old.full_name then new.full_name else live_video_switcher      end,
      live_audio_mixer         = case when live_audio_mixer         = old.full_name then new.full_name else live_audio_mixer         end
    where organization_id = new.organization_id
      and old.full_name in (writer, presenter_name, video_editor, camera_operator, published_by,
                            concept_creator, producer, publisher, motion_graphics_designer,
                            graphic_designer, voice_over_artist, colorist, light_designer,
                            sound_recordist, audio_mixer, live_video_switcher, live_audio_mixer);
    perform set_config('nw.bypass_guard', '', true);
  end if;
  return null;
end;
$function$;

-- 8. notify_content_update
create or replace function public.notify_content_update()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  actor_name text;
  label text;
  n int;
begin
  if new.organization_id is null then
    return new;
  end if;
  label := coalesce(nullif(new.slug_name, ''), nullif(new.title, ''), 'Content');
  begin
    n := jsonb_array_length(new.audit_log);
    if n > 0 then
      actor_name := new.audit_log -> (n - 1) ->> 'actor';
    end if;
  exception when others then
    actor_name := null;
  end;

  if new.status is distinct from old.status then
    insert into notifications (organization_id, member_id, content_id, message)
    select tm.organization_id, tm.id, new.id::text,
           label || ': ' || coalesce(old.status, '') || ' → ' || new.status
             || coalesce(' (by ' || actor_name || ')', '')
    from team_members tm
    where tm.organization_id = new.organization_id
      and tm.active
      and tm.full_name is distinct from actor_name
      and (
        tm.full_name in (new.writer, new.presenter_name, new.video_editor)
        or (tm.role in ('owner', 'manager')
            and new.status in ('Script Submitted', 'Video Review', 'Ready to Publish'))
        or (tm.can_approve_scripts and new.status = 'Script Submitted')
        or (tm.can_review_videos and new.status = 'Video Review')
      );
  end if;

  insert into notifications (organization_id, member_id, content_id, message)
  select tm.organization_id, tm.id, new.id::text,
         'You were assigned as ' || a.role_label || ' on ' || label
  from (values ('Research & Script Writer', new.writer, old.writer),
               ('Presenter', new.presenter_name, old.presenter_name),
               ('Video Editor', new.video_editor, old.video_editor)) as a(role_label, cur, prev)
  join team_members tm
    on tm.organization_id = new.organization_id
   and tm.active
   and tm.full_name = a.cur
  where a.cur is not null
    and a.cur is distinct from a.prev
    and tm.full_name is distinct from actor_name;

  return new;
end;
$function$;

commit;
