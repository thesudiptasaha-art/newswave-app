-- ============================================================
-- 2026-10-22  Team nickname (one English word shown in the UI)
-- Already run live in the Supabase SQL Editor. This file is the record.
-- Adds nickname to team_members (optional).
-- Rule: English letters only, one word, 1 to 20 characters.
-- Two members of the same organization cannot share a nickname
-- (case does not matter).
-- ============================================================

begin;

alter table public.team_members add column if not exists nickname text;

alter table public.team_members drop constraint if exists team_members_nickname_one_word;
alter table public.team_members
  add constraint team_members_nickname_one_word
  check (nickname is null or nickname ~ '^[A-Za-z]{1,20}$');

create unique index if not exists team_members_nickname_unique
  on public.team_members (organization_id, lower(nickname))
  where nickname is not null;

commit;

-- ============================================================
-- ROLLBACK (only if needed; it removes the column and its data):
--   drop index if exists public.team_members_nickname_unique;
--   alter table public.team_members drop column nickname;
-- ============================================================
