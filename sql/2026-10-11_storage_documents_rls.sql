-- ============================================================================
-- WaveDesk Database Migration: Storage 'documents' Bucket RLS Fix
-- Date: 2026-10-11
-- Target: Supabase SQL Editor (Run manually by owner)
-- Purpose:
--   Enables newsroom staff to upload and view reference documents/PDFs
--   in the drawer without encountering Storage RLS (AccessDenied) errors.
-- ============================================================================

begin;

-- 1. Ensure the 'documents' storage bucket exists and is public
-- (Public bucket allows <a href={url} target="_blank"> to open attachments cleanly)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'documents',
  'documents',
  true,
  52428800, -- 50 MB limit per reference attachment
  null      -- Allow any standard document, image, or PDF file type
)
on conflict (id) do update set
  public = true,
  file_size_limit = coalesce(storage.buckets.file_size_limit, 52428800);

-- 2. Clean up any existing duplicate/outdated policies for 'documents' bucket
drop policy if exists "Authenticated users can upload reference documents" on storage.objects;
drop policy if exists "Authenticated users can update reference documents" on storage.objects;
drop policy if exists "Authenticated users can delete reference documents" on storage.objects;
drop policy if exists "Anyone can read reference documents" on storage.objects;
drop policy if exists "Authenticated users can read reference documents" on storage.objects;

-- 3. Policy: Authenticated newsroom staff can upload (INSERT) files to 'documents'
create policy "Authenticated users can upload reference documents"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'documents'
);

-- 4. Policy: Anyone can read/download (SELECT) files from 'documents'
-- (Required for browser tab navigation via direct URL without Auth header)
create policy "Anyone can read reference documents"
on storage.objects
for select
to public
using (
  bucket_id = 'documents'
);

-- 5. Policy: Authenticated users can update/upsert (UPDATE) files in 'documents'
create policy "Authenticated users can update reference documents"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'documents'
)
with check (
  bucket_id = 'documents'
);

-- 6. Policy: Authenticated users can remove/trash (DELETE) files from 'documents'
create policy "Authenticated users can delete reference documents"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'documents'
);

commit;

-- ============================================================================
-- Verification Queries (Run in Supabase SQL editor to verify active setup):
-- ============================================================================
-- 1. Check bucket status:
--    select id, name, public, file_size_limit from storage.buckets where id = 'documents';
--
-- 2. Check active RLS policies:
--    select policyname, cmd, roles from pg_policies 
--    where schemaname = 'storage' and tablename = 'objects' 
--      and policyname ilike '%reference documents%';
-- ============================================================================
-- Rollback (if ever needed):
-- ============================================================================
-- drop policy if exists "Authenticated users can upload reference documents" on storage.objects;
-- drop policy if exists "Anyone can read reference documents" on storage.objects;
-- drop policy if exists "Authenticated users can update reference documents" on storage.objects;
-- drop policy if exists "Authenticated users can delete reference documents" on storage.objects;
-- ============================================================================
