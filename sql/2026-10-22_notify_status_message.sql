-- ============================================================
-- 2026-10-22  notify_content_update: clearer status-change notification text
-- Already run live in the Supabase SQL Editor. This file is the record.
-- Before: "test content: Shooting -> Assign Editor (by Mamun Chowdhury)"
--   which looked as if Mamun had assigned an editor.
-- After:  "Mamun Chowdhury moved test content from Shooting to Assign Editor"
-- If the person who made the change is unknown, "Someone" is used.
-- Only the status-change message text changed. Who gets notified is unchanged.
-- Notifications created before this change keep their old text.
-- ============================================================

begin;

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
           coalesce(actor_name, 'Someone') || ' moved ' || label
             || ' from ' || coalesce(old.status, 'New') || ' to ' || new.status
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
