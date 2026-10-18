-- ============================================================================
-- WaveDesk N36-B (18 Oct 2026) - ALREADY RUN on the live database by the owner.
-- Kept here as the record (rule: every database change lives in sql/).
-- Do NOT run again unless rebuilding a database. Safe to re-run: drops and
-- recreates the same policies.
--
-- 1) storage 'documents' bucket: nobody can update or delete objects; only
--    active members can insert. Public read stays (existing links are public URLs).
-- 2) platforms: select, insert and delete now require an ACTIVE team member.
-- Run in: Supabase SQL Editor. All-or-nothing (begin/commit).
-- ============================================================================

begin;

drop policy if exists "Authenticated users can delete reference documents" on storage.objects;
drop policy if exists "Authenticated users can update reference documents" on storage.objects;
drop policy if exists "Authenticated users can upload reference documents" on storage.objects;
drop policy if exists "nw_documents_insert_active" on storage.objects;

create policy "nw_documents_insert_active" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'documents' and public.i_am_active());

drop policy if exists platforms_select on public.platforms;
drop policy if exists platforms_insert on public.platforms;
drop policy if exists platforms_delete on public.platforms;

create policy platforms_select on public.platforms
  for select to authenticated
  using (
    organization_id is null
    or organization_id in (
      select tm.organization_id from public.team_members tm
      where tm.auth_user_id = auth.uid() and tm.active
    )
  );

create policy platforms_insert on public.platforms
  for insert to authenticated
  with check (
    organization_id in (
      select tm.organization_id from public.team_members tm
      where tm.auth_user_id = auth.uid() and tm.active
        and tm.role in ('owner', 'manager')
    )
  );

create policy platforms_delete on public.platforms
  for delete to authenticated
  using (
    organization_id in (
      select tm.organization_id from public.team_members tm
      where tm.auth_user_id = auth.uid() and tm.active
        and tm.role in ('owner', 'manager')
    )
  );

commit;

-- ============================================================================
-- Rollback (only if something went wrong): re-create the old policies:
--   "Authenticated users can delete reference documents" (DELETE, authenticated,
--   using bucket_id = 'documents'), "Authenticated users can update reference
--   documents" (UPDATE, authenticated, using and with check bucket_id = 'documents'),
--   "Authenticated users can upload reference documents" (INSERT, authenticated,
--   with check bucket_id = 'documents'); drop policy nw_documents_insert_active;
--   and re-create the old platforms_select / platforms_insert / platforms_delete
--   policies for role public WITHOUT the "tm.active" check.
-- ============================================================================
