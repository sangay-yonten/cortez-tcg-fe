-- Cortez TCG shop schema: catalog, config, orders, RLS, create_order RPC, storage

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Catalog & shop config
-- ---------------------------------------------------------------------------

create type public.product_badge as enum ('hot', 'favorite', 'new');
create type public.stream_status as enum ('live', 'tonight', 'upcoming');
create type public.order_status as enum (
  'pending_payment',
  'paid',
  'packed',
  'shipped',
  'cancelled'
);

create table public.products (
  id text primary key,
  name text not null,
  short_name text not null,
  price integer not null check (price >= 0),
  compare_at integer check (compare_at is null or compare_at >= 0),
  image_url text not null,
  badge public.product_badge,
  stock integer not null default 0 check (stock >= 0),
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.streams (
  id text primary key,
  title text not null,
  day text not null,
  time text not null,
  focus text not null,
  status public.stream_status not null default 'upcoming',
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.shipping_zones (
  id text primary key,
  label text not null,
  detail text not null,
  fee integer not null default 0 check (fee >= 0),
  sort_order integer not null default 0
);

create table public.shop_settings (
  id text primary key default 'default' check (id = 'default'),
  shop_name text not null default 'Cortez TCG Live',
  gst_rate numeric(6, 4) not null default 0.05 check (gst_rate >= 0),
  payment_accounts jsonb not null default '[]'::jsonb,
  payment_qr_url text,
  updated_at timestamptz not null default now()
);

create table public.orders (
  id text primary key,
  full_name text not null,
  phone text not null,
  address text not null,
  zone_id text not null references public.shipping_zones (id),
  notes text not null default '',
  payment_reference text not null,
  proof_path text not null,
  subtotal integer not null check (subtotal >= 0),
  gst integer not null check (gst >= 0),
  shipping_fee integer not null check (shipping_fee >= 0),
  grand_total integer not null check (grand_total >= 0),
  gst_rate numeric(6, 4) not null,
  status public.order_status not null default 'pending_payment',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.order_items (
  id bigint generated always as identity primary key,
  order_id text not null references public.orders (id) on delete cascade,
  product_id text not null references public.products (id),
  product_name text not null,
  unit_price integer not null check (unit_price >= 0),
  quantity integer not null check (quantity > 0)
);

create index products_active_sort_idx on public.products (is_active, sort_order, id);
create index streams_sort_idx on public.streams (sort_order, id);
create index shipping_zones_sort_idx on public.shipping_zones (sort_order, id);
create index orders_created_at_idx on public.orders (created_at desc);
create index orders_status_idx on public.orders (status);
create index order_items_order_id_idx on public.order_items (order_id);

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger products_set_updated_at
before update on public.products
for each row execute function public.set_updated_at();

create trigger orders_set_updated_at
before update on public.orders
for each row execute function public.set_updated_at();

create trigger shop_settings_set_updated_at
before update on public.shop_settings
for each row execute function public.set_updated_at();

create or replace function public.generate_order_id()
returns text
language plpgsql
as $$
declare
  stamp text;
  rand_part text;
  candidate text;
begin
  stamp := upper(substr(to_hex(extract(epoch from now())::bigint), -6));
  rand_part := lpad((floor(random() * 90) + 10)::text, 2, '0');
  candidate := 'CTL-' || stamp || rand_part;
  while exists (select 1 from public.orders where id = candidate) loop
    rand_part := lpad((floor(random() * 90) + 10)::text, 2, '0');
    candidate := 'CTL-' || stamp || rand_part;
  end loop;
  return candidate;
end;
$$;

-- Atomically validate stock, price from DB, insert order, decrement inventory.
create or replace function public.create_order(
  p_full_name text,
  p_phone text,
  p_address text,
  p_zone_id text,
  p_notes text,
  p_payment_reference text,
  p_proof_path text,
  p_items jsonb
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order_id text;
  v_zone public.shipping_zones%rowtype;
  v_settings public.shop_settings%rowtype;
  v_item jsonb;
  v_product public.products%rowtype;
  v_qty integer;
  v_subtotal integer := 0;
  v_gst integer;
  v_shipping integer;
  v_grand integer;
begin
  if p_full_name is null or length(trim(p_full_name)) = 0 then
    raise exception 'full_name is required';
  end if;
  if p_phone is null or length(trim(p_phone)) < 7 then
    raise exception 'phone is required';
  end if;
  if p_address is null or length(trim(p_address)) < 8 then
    raise exception 'address is required';
  end if;
  if p_payment_reference is null or length(trim(p_payment_reference)) = 0 then
    raise exception 'payment_reference is required';
  end if;
  if p_proof_path is null or length(trim(p_proof_path)) = 0 then
    raise exception 'proof_path is required';
  end if;
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'items are required';
  end if;

  select * into v_zone from public.shipping_zones where id = p_zone_id;
  if not found then
    raise exception 'invalid shipping zone';
  end if;

  select * into v_settings from public.shop_settings where id = 'default';
  if not found then
    raise exception 'shop settings missing';
  end if;

  -- Lock products and validate stock / build subtotal using DB prices.
  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_qty := (v_item ->> 'quantity')::integer;
    if v_qty is null or v_qty <= 0 then
      raise exception 'invalid quantity';
    end if;

    select * into v_product
    from public.products
    where id = v_item ->> 'product_id'
      and is_active = true
    for update;

    if not found then
      raise exception 'product unavailable: %', v_item ->> 'product_id';
    end if;

    if v_product.stock < v_qty then
      raise exception 'insufficient stock for %', v_product.short_name;
    end if;

    v_subtotal := v_subtotal + (v_product.price * v_qty);
  end loop;

  v_gst := round(v_subtotal * v_settings.gst_rate)::integer;
  v_shipping := v_zone.fee;
  v_grand := v_subtotal + v_gst + v_shipping;
  v_order_id := public.generate_order_id();

  insert into public.orders (
    id,
    full_name,
    phone,
    address,
    zone_id,
    notes,
    payment_reference,
    proof_path,
    subtotal,
    gst,
    shipping_fee,
    grand_total,
    gst_rate,
    status
  ) values (
    v_order_id,
    trim(p_full_name),
    trim(p_phone),
    trim(p_address),
    p_zone_id,
    coalesce(trim(p_notes), ''),
    trim(p_payment_reference),
    trim(p_proof_path),
    v_subtotal,
    v_gst,
    v_shipping,
    v_grand,
    v_settings.gst_rate,
    'pending_payment'
  );

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_qty := (v_item ->> 'quantity')::integer;

    select * into v_product
    from public.products
    where id = v_item ->> 'product_id'
    for update;

    update public.products
    set stock = stock - v_qty
    where id = v_product.id;

    insert into public.order_items (
      order_id,
      product_id,
      product_name,
      unit_price,
      quantity
    ) values (
      v_order_id,
      v_product.id,
      v_product.name,
      v_product.price,
      v_qty
    );
  end loop;

  return v_order_id;
end;
$$;

revoke all on function public.create_order(
  text, text, text, text, text, text, text, jsonb
) from public;
grant execute on function public.create_order(
  text, text, text, text, text, text, text, jsonb
) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.products enable row level security;
alter table public.streams enable row level security;
alter table public.shipping_zones enable row level security;
alter table public.shop_settings enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

create policy "Public read active products"
  on public.products for select
  to anon, authenticated
  using (is_active = true);

create policy "Public read streams"
  on public.streams for select
  to anon, authenticated
  using (true);

create policy "Public read shipping zones"
  on public.shipping_zones for select
  to anon, authenticated
  using (true);

create policy "Public read shop settings"
  on public.shop_settings for select
  to anon, authenticated
  using (true);

-- Orders / items are created only via security definer RPC.
-- Authenticated owners can read/update via dashboard (service role bypasses RLS).

create policy "Authenticated read orders"
  on public.orders for select
  to authenticated
  using (true);

create policy "Authenticated update orders"
  on public.orders for update
  to authenticated
  using (true)
  with check (true);

create policy "Authenticated read order items"
  on public.order_items for select
  to authenticated
  using (true);

-- ---------------------------------------------------------------------------
-- Storage: payment proof screenshots
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'payment-proofs',
  'payment-proofs',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do nothing;

create policy "Anon can upload payment proofs"
  on storage.objects for insert
  to anon, authenticated
  with check (
    bucket_id = 'payment-proofs'
    and (storage.foldername(name))[1] is not null
  );

create policy "Authenticated can read payment proofs"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'payment-proofs');
