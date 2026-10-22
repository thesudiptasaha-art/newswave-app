-- ============================================================
-- 2026-10-22  notify_content_insert: same role names as notify_content_update
-- Already run live in the Supabase SQL Editor. This file is the record.
-- Before: a new content notified "Research & Script" and "Video editor";
--   an edit notified "Research & Script Writer" and "Video Editor".
-- After:  both use "Research & Script Writer", "Presenter", "Video Editor".
-- Only the label text changed. Who gets notified is unchanged.
-- ============================================================

begin;

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
  from (values ('Research & Script Writer', new.writer),
               ('Presenter', new.presenter_name),
               ('Video Editor', new.video_editor)) as a(role_label, person)
  join team_members tm
    on tm.organization_id = new.organization_id
   and tm.active
   and tm.full_name = a.person
  where a.person is not null
    and tm.full_name is distinct from actor_name;

  return new;
end;
$function$;

commit;
