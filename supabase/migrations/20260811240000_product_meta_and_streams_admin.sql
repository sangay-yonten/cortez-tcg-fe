-- Product metadata hardening + streams admin write access
-- Run once in Supabase SQL Editor after prior migrations.

alter table public.product_card_details
  add column if not exists card_number text;

-- Optional pack identity (set code) for loose packs.
create table if not exists public.product_pack_details (
  product_id text primary key references public.products (id) on delete cascade,
  set_code text
);

alter table public.product_pack_details enable row level security;

drop policy if exists "Public read pack details" on public.product_pack_details;
create policy "Public read pack details"
  on public.product_pack_details for select
  to anon, authenticated
  using (true);

drop policy if exists "Authenticated manage pack details" on public.product_pack_details;
create policy "Authenticated manage pack details"
  on public.product_pack_details for all
  to authenticated
  using (true)
  with check (true);

-- Owner can schedule live streams from the admin desk.
drop policy if exists "Authenticated manage streams" on public.streams;
create policy "Authenticated manage streams"
  on public.streams for all
  to authenticated
  using (true)
  with check (true);

-- Backfill sample card numbers where missing.
update public.product_card_details
set card_number = coalesce(card_number, 'OP05-001')
where product_id = 'raw-luffy-op05' and card_number is null;

update public.product_card_details
set card_number = coalesce(card_number, 'OP06-001')
where product_id = 'raw-zoro-op06' and card_number is null;

update public.product_card_details
set card_number = coalesce(card_number, 'OP07-016')
where product_id = 'raw-nami-op07' and card_number is null;

update public.product_card_details
set card_number = coalesce(card_number, 'OP09-001')
where product_id = 'raw-shanks-op09' and card_number is null;
