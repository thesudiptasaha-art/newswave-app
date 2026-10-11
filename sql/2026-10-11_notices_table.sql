-- ============================================================================
-- WaveDesk Database Migration: Notices Table (N12)
-- Date: 2026-10-11
-- Target: Supabase SQL Editor (Run manually by owner)
-- Purpose:
--   Creates the 'notices' table for organization-wide announcements, bulletins,
--   and editorial notices.
--   Enables Row Level Security (RLS) so all active team members can read notices,
--   while only Owner and Manager roles can create, edit, or delete them.
--   Adds 'notices' to the Supabase Realtime publication.
-- ============================================================================

begin;

-- 1. Create notices table
create table if not exists notices (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  title text not null,
  body text not null,
  author_id uuid references team_members(id) on delete set null,
  author_name text not null,
  priority text not null default 'normal' check (priority in ('normal', 'urgent', 'info')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. Performance Index (Fast lookup by organization, newest first)
create index if not exists idx_notices_org_created on notices (organization_id, created_at desc);

-- 3. Enable Row Level Security (RLS)
alter table notices enable row level security;

-- 4. Clean up any existing policies
drop policy if exists "Active team members can read notices" on notices;
drop policy if exists "Managers can create notices" on notices;
drop policy if exists "Managers can update notices" on notices;
drop policy if exists "Managers can delete notices" on notices;

-- 5. RLS Policies
-- All active members of the same organization can view notices
create policy "Active team members can read notices"
on notices
for select
to authenticated
using (
  organization_id = my_org_id() and i_am_active()
);

-- Only Owner or Manager can post new notices
create policy "Managers can create notices"
on notices
for insert
to authenticated
with check (
  organization_id = my_org_id() and is_manager()
);

-- Only Owner or Manager can edit existing notices
create policy "Managers can update notices"
on notices
for update
to authenticated
using (
  organization_id = my_org_id() and is_manager()
)
with check (
  organization_id = my_org_id() and is_manager()
);

-- Only Owner or Manager can delete notices
create policy "Managers can delete notices"
on notices
for delete
to authenticated
using (
  organization_id = my_org_id() and is_manager()
);

-- 6. Add notices table to Supabase Realtime publication
-- (Checks if notices is already in the publication before adding to avoid duplicate errors)
do $$
begin
  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' and tablename = 'notices'
  ) then
    alter publication supabase_realtime add table notices;
  end if;
end $$;

commit;

-- ============================================================================
-- Verification Queries (Run in Supabase SQL editor to verify active setup):
-- ============================================================================
-- 1. Check table structure:
--    select column_name, data_type, is_nullable from information_schema.columns where table_name = 'notices';
--
-- 2. Check active RLS policies:
--    select policyname, cmd, roles from pg_policies where tablename = 'notices';
--
-- 3. Check realtime publication:
--    select * from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'notices';
-- ============================================================================
-- Rollback (if ever needed):
-- ============================================================================
-- alter publication supabase_realtime drop table if exists notices;
-- drop table if exists notices cascade;
-- ============================================================================
