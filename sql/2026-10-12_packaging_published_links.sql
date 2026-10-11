-- 2026-10-12_packaging_published_links.sql
-- Additive column for multi-platform published links on contents table

-- 1. Add published_links jsonb column (default empty object)
alter table contents
  add column if not exists published_links jsonb not null default '{}'::jsonb;

comment on column contents.published_links is 'Map of platform ID to published live URL, e.g. {"youtube": "https://...", "facebook": "https://..."}';
