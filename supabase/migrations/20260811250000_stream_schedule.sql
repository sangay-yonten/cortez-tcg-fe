-- Stream schedule: link + real window + ended status
-- Run after 20260811240000_product_meta_and_streams_admin.sql

do $$
begin
  if not exists (
    select 1
    from pg_enum e
    join pg_type t on e.enumtypid = t.oid
    where t.typname = 'stream_status'
      and e.enumlabel = 'ended'
  ) then
    alter type public.stream_status add value 'ended';
  end if;
end $$;

alter table public.streams
  add column if not exists stream_url text;

alter table public.streams
  add column if not exists starts_at timestamptz;

alter table public.streams
  add column if not exists ends_at timestamptz;

create index if not exists streams_window_idx
  on public.streams (starts_at, ends_at);
