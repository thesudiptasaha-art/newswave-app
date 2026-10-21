-- ============================================================
-- 2026-10-21  Roles: own ticks for Idea and Publisher
-- Already run live in the Supabase SQL Editor. This file is the record.
-- Adds can_idea and can_publish to team_members (default false), then fills them
-- once from the old behaviour so nobody loses an option in the dropdowns:
--   can_idea    = can_write (Idea used the writers list before)
--   can_publish = anyone already named as uploader on a content
-- Owners and managers always appear in every list (handled in the app).
-- ============================================================

begin;

alter table public.team_members add column if not exists can_idea boolean not null default false;
alter table public.team_members add column if not exists can_publish boolean not null default false;

-- Idea: who could be picked before (can_write) keeps the option
update public.team_members set can_idea = true where can_write = true;

-- Publisher: anyone already named as uploader on a content keeps the option
update public.team_members set can_publish = true
where full_name in (
  select distinct uploader from public.contents
  where uploader is not null and uploader <> ''
);

commit;

-- ============================================================
-- ROLLBACK (only if needed; it removes both columns and their data):
--   alter table public.team_members drop column can_idea, drop column can_publish;
-- ============================================================
