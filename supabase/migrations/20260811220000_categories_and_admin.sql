-- Categories for shared products catalog + admin (authenticated) inventory policies
-- Run once in Supabase SQL Editor after the init migration.

do $$ begin
  create type public.product_category as enum (
    'loose_pack',
    'raw_card',
    'booster_box'
  );
exception
  when duplicate_object then null;
end $$;

alter table public.products
  add column if not exists category public.product_category not null default 'loose_pack';

create index if not exists products_category_sort_idx
  on public.products (category, is_active, sort_order, id);

-- Optional type-specific details (nullable / 1:1). Packs need no extra table.
create table if not exists public.product_card_details (
  product_id text primary key references public.products (id) on delete cascade,
  set_code text,
  rarity text,
  condition text not null default 'NM',
  language text not null default 'EN'
);

create table if not exists public.product_box_details (
  product_id text primary key references public.products (id) on delete cascade,
  packs_per_box integer check (packs_per_box is null or packs_per_box > 0),
  sealed boolean not null default true
);

alter table public.product_card_details enable row level security;
alter table public.product_box_details enable row level security;

drop policy if exists "Public read card details" on public.product_card_details;
create policy "Public read card details"
  on public.product_card_details for select
  to anon, authenticated
  using (true);

drop policy if exists "Authenticated manage card details" on public.product_card_details;
create policy "Authenticated manage card details"
  on public.product_card_details for all
  to authenticated
  using (true)
  with check (true);

drop policy if exists "Public read box details" on public.product_box_details;
create policy "Public read box details"
  on public.product_box_details for select
  to anon, authenticated
  using (true);

drop policy if exists "Authenticated manage box details" on public.product_box_details;
create policy "Authenticated manage box details"
  on public.product_box_details for all
  to authenticated
  using (true)
  with check (true);

-- Admin inventory: signed-in owner can see inactive + edit stock/price/active.
drop policy if exists "Authenticated read all products" on public.products;
create policy "Authenticated read all products"
  on public.products for select
  to authenticated
  using (true);

drop policy if exists "Authenticated update products" on public.products;
create policy "Authenticated update products"
  on public.products for update
  to authenticated
  using (true)
  with check (true);

drop policy if exists "Authenticated insert products" on public.products;
create policy "Authenticated insert products"
  on public.products for insert
  to authenticated
  with check (true);

-- Seed category on existing rows (safe re-run).
update public.products
set category = 'loose_pack'
where category is null or category = 'loose_pack';

-- Sample raw mint cards + booster boxes (upsert).
insert into public.products (
  id, name, short_name, price, compare_at, image_url, badge, stock, is_active, sort_order, category
) values
  ('raw-luffy-op05', 'Monkey D. Luffy (OP05) — Raw Near Mint Single', 'Luffy OP05 NM', 450, 520, 'op05', 'hot', 3, true, 101, 'raw_card'),
  ('raw-zoro-op06', 'Roronoa Zoro (OP06) — Raw Near Mint Single', 'Zoro OP06 NM', 280, null, 'op06', 'favorite', 5, true, 102, 'raw_card'),
  ('raw-nami-op07', 'Nami (OP07) — Raw Near Mint Single', 'Nami OP07 NM', 160, 190, 'op07', 'new', 8, true, 103, 'raw_card'),
  ('raw-shanks-op09', 'Shanks (OP09) — Raw Near Mint Alt Art', 'Shanks OP09 AA', 1200, null, 'op05', 'hot', 1, true, 104, 'raw_card'),
  ('box-op05', 'One Piece TCG OP-05 Awakening — Sealed Booster Box (24)', 'OP-05 Box', 2100, 2300, 'op05', 'favorite', 4, true, 201, 'booster_box'),
  ('box-op06', 'One Piece TCG OP-06 Wings — Sealed Booster Box (24)', 'OP-06 Box', 2050, null, 'op06', 'hot', 3, true, 202, 'booster_box'),
  ('box-op08', 'One Piece TCG OP-08 Two Legends — Sealed Booster Box (24)', 'OP-08 Box', 2200, 2400, 'op08', 'new', 2, true, 203, 'booster_box')
on conflict (id) do update set
  name = excluded.name,
  short_name = excluded.short_name,
  price = excluded.price,
  compare_at = excluded.compare_at,
  image_url = excluded.image_url,
  badge = excluded.badge,
  stock = excluded.stock,
  is_active = excluded.is_active,
  sort_order = excluded.sort_order,
  category = excluded.category;

insert into public.product_card_details (product_id, set_code, rarity, condition, language) values
  ('raw-luffy-op05', 'OP-05', 'SR', 'NM', 'EN'),
  ('raw-zoro-op06', 'OP-06', 'SR', 'NM', 'EN'),
  ('raw-nami-op07', 'OP-07', 'R', 'NM', 'EN'),
  ('raw-shanks-op09', 'OP-09', 'SEC', 'NM', 'EN')
on conflict (product_id) do update set
  set_code = excluded.set_code,
  rarity = excluded.rarity,
  condition = excluded.condition,
  language = excluded.language;

insert into public.product_box_details (product_id, packs_per_box, sealed) values
  ('box-op05', 24, true),
  ('box-op06', 24, true),
  ('box-op08', 24, true)
on conflict (product_id) do update set
  packs_per_box = excluded.packs_per_box,
  sealed = excluded.sealed;
