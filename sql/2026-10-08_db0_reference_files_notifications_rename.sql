-- ============================================================================
-- WaveDesk DB-0 (8 Oct 2026) - ALREADY RUN on the live database by the owner.
-- Kept here as the record (rule: every database change lives in sql/).
-- Do NOT run again unless rebuilding a database. Safe to re-run: all steps are
-- idempotent (add column if not exists, create or replace function).
--
-- 1) contents.reference_files jsonb  (Assets tab saves reference files here)
-- 2) assignment notifications say "Research & Script" instead of "Writer"
-- 3) cascade_member_rename also renames the other credit columns
-- Run in: Supabase SQL Editor. All-or-nothing (begin/commit).
-- ============================================================================

begin;

-- 1) reference files column
alter table public.contents
  add column if not exists reference_files jsonb not null default '[]'::jsonb;

-- 2) assignment notifications
create or replace function public.notify_content_insert()
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

  insert into notifications (organization_id, member_id, content_id, message)
  select tm.organization_id, tm.id, new.id::text,
         'You were assigned as ' || a.role_label || ' on ' || label
  from (values ('Research & Script', new.writer),
               ('Presenter', new.presenter_name),
               ('Video editor', new.video_editor)) as a(role_label, person)
  join team_members tm
    on tm.organization_id = new.organization_id
   and tm.active
   and tm.full_name = a.person
  where a.person is not null
    and tm.full_name is distinct from actor_name;

  return new;
end;
$function$;

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
        or (tm.can_approve_script and new.status = 'Script Submitted')
        or (tm.can_review_video and new.status = 'Video Review')
      );
  end if;

  insert into notifications (organization_id, member_id, content_id, message)
  select tm.organization_id, tm.id, new.id::text,
         'You were assigned as ' || a.role_label || ' on ' || label
  from (values ('Research & Script', new.writer, old.writer),
               ('Presenter', new.presenter_name, old.presenter_name),
               ('Video editor', new.video_editor, old.video_editor)) as a(role_label, cur, prev)
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

-- 3) member rename cascade (all credit columns)
create or replace function public.cascade_member_rename()
 returns trigger
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
begin
  if new.full_name is distinct from old.full_name and old.full_name is not null then
    perform set_config('nw.bypass_guard', '1', true);
    update public.contents set writer = new.full_name where organization_id = new.organization_id and writer = old.full_name;
    update public.contents set presenter_name = new.full_name where organization_id = new.organization_id and presenter_name = old.full_name;
    update public.contents set video_editor = new.full_name where organization_id = new.organization_id and video_editor = old.full_name;
    update public.contents set camera_person = new.full_name where organization_id = new.organization_id and camera_person = old.full_name;
    update public.contents set publisher = new.full_name where organization_id = new.organization_id and publisher = old.full_name;
    update public.contents set
      idea_by         = case when idea_by         = old.full_name then new.full_name else idea_by         end,
      producer        = case when producer        = old.full_name then new.full_name else producer        end,
      uploader        = case when uploader        = old.full_name then new.full_name else uploader        end,
      vfx             = case when vfx             = old.full_name then new.full_name else vfx             end,
      colorist        = case when colorist        = old.full_name then new.full_name else colorist        end,
      light_designer  = case when light_designer  = old.full_name then new.full_name else light_designer  end,
      sound_recordist = case when sound_recordist = old.full_name then new.full_name else sound_recordist end,
      audio_mixer     = case when audio_mixer     = old.full_name then new.full_name else audio_mixer     end,
      video_switcher  = case when video_switcher  = old.full_name then new.full_name else video_switcher  end,
      live_audio      = case when live_audio      = old.full_name then new.full_name else live_audio      end
    where organization_id = new.organization_id
      and old.full_name in (idea_by, producer, uploader, vfx, colorist, light_designer,
                            sound_recordist, audio_mixer, video_switcher, live_audio);
    perform set_config('nw.bypass_guard', '', true);
  end if;
  return null;
end;
$function$;

commit;

-- ============================================================================
-- Check (run after): all three columns should say true
-- ============================================================================
-- select
--   exists (select 1 from information_schema.columns where table_schema='public' and table_name='contents' and column_name='reference_files') as reference_files_added,
--   (select pg_get_functiondef(p.oid) like '%Research & Script%' from pg_proc p where p.proname='notify_content_update' and p.pronamespace='public'::regnamespace) as update_notice_fixed,
--   (select pg_get_functiondef(p.oid) like '%live_audio%' from pg_proc p where p.proname='cascade_member_rename' and p.pronamespace='public'::regnamespace) as rename_fixed;

-- ============================================================================
-- Rollback (only if something went wrong). It restores the OLD behaviour:
--   - drops contents.reference_files (WARNING: deletes reference files saved after DB-0)
--   - notification text goes back to "Writer"
--   - cascade_member_rename goes back to renaming only 5 columns
-- To roll back: re-create the three functions with the bodies above, changing
-- 'Research & Script' to 'Writer' in notify_content_insert/update, and removing
-- the big "update public.contents set idea_by ..." block from cascade_member_rename;
-- then run: alter table public.contents drop column if exists reference_files;
-- ============================================================================
