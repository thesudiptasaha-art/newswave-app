-- 2026-10-23: Scheduled step + real publish time.
-- STATUS: already run live in Supabase. This file is the record only.
-- 1) New column contents.went_live_at = the real time the content went live.
--    Reports use went_live_at and fall back to published_at (the time the button was clicked) for old rows.
-- 2) guard_contents_update changes:
--    - the assigned Publisher (contents.publisher = my full_name) or a manager may do:
--      Ready to Publish -> Scheduled, Ready to Publish -> Published, Scheduled -> Published, Scheduled -> Ready to Publish.
--    - Hold / Drop stay manager-only (also allowed from Scheduled).
--    - went_live_at may change only when status moves to Published (or by a manager), and cannot be later than now() + 5 minutes ("Publish time cannot be in the future").
-- ROLLBACK: move any Scheduled rows back to Ready to Publish first, then
--    alter table public.contents drop column went_live_at;
--    and re-run section 6 (guard_contents_update) of sql/2026-10-22_roles_access_rename.sql.
-- The full function body is the live function in Supabase: select pg_get_functiondef('public.guard_contents_update'::regproc);
alter table public.contents add column if not exists went_live_at timestamptz;
comment on column public.contents.went_live_at is 'Real time the content went live (reports use this; falls back to published_at for old rows).';
