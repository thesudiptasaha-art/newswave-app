-- WaveDesk Database Migration: Notice UID & Daily Counter
-- Date: 2026-10-12
-- Description:
--   1. Adds 'notice_uid' column to 'notices' table for human-readable IDs (e.g. NOTICE-YYYYMMDD_001).
--   2. Creates 'notice_uid_counters' table for atomic per-day sequence generation (Asia/Dhaka timezone).
--   3. Creates trigger function 'notices_assign_uid' to automatically assign NOTICE-YYYYMMDD_NNN before insert.
--   4. Backfills any existing notices without a notice_uid.

-- 1. Add notice_uid column
alter table notices add column if not exists notice_uid text unique;

-- 2. Create counter table for daily sequence
create table if not exists notice_uid_counters (
  day text primary key, -- 'YYYYMMDD' in Asia/Dhaka
  last_seq int not null default 0
);

-- Enable RLS on notice_uid_counters (managed by trigger with security definer)
alter table notice_uid_counters enable row level security;

-- Allow authenticated users to read counters if needed
drop policy if exists "Authenticated read notice_uid_counters" on notice_uid_counters;
create policy "Authenticated read notice_uid_counters" on notice_uid_counters
  for select to authenticated using (true);

-- 3. Trigger function to assign NOTICE-YYYYMMDD_NNN
create or replace function notices_assign_uid()
returns trigger as $$
declare
  today_str text;
  next_val int;
begin
  if new.notice_uid is null or trim(new.notice_uid) = '' then
    -- Format Asia/Dhaka date as YYYYMMDD
    today_str := to_char(timezone('Asia/Dhaka', coalesce(new.created_at, now())), 'YYYYMMDD');

    insert into notice_uid_counters (day, last_seq)
    values (today_str, 1)
    on conflict (day)
    do update set last_seq = notice_uid_counters.last_seq + 1
    returning last_seq into next_val;

    new.notice_uid := 'NOTICE-' || today_str || '_' || lpad(next_val::text, 3, '0');
  end if;
  return new;
end;
$$ language plpgsql security definer;

-- 4. Attach trigger before insert on notices table
drop trigger if exists trg_notices_assign_uid on notices;
create trigger trg_notices_assign_uid
before insert on notices
for each row
execute function notices_assign_uid();

-- 5. Backfill any existing notices that do not have a notice_uid
do $$
declare
  rec record;
  today_str text;
  next_val int;
begin
  for rec in select id, created_at from notices where notice_uid is null or trim(notice_uid) = '' order by created_at asc loop
    today_str := to_char(timezone('Asia/Dhaka', rec.created_at), 'YYYYMMDD');

    insert into notice_uid_counters (day, last_seq)
    values (today_str, 1)
    on conflict (day)
    do update set last_seq = notice_uid_counters.last_seq + 1
    returning last_seq into next_val;

    update notices
    set notice_uid = 'NOTICE-' || today_str || '_' || lpad(next_val::text, 3, '0')
    where id = rec.id;
  end loop;
end;
$$;
