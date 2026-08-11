-- Collapse product naming to a single `name` column.
-- Safe to re-run if `short_name` was already removed.

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'products'
      and column_name = 'short_name'
  ) then
    -- Prefer the compact label as the display name when present.
    update public.products
    set name = short_name
    where coalesce(trim(short_name), '') <> ''
      and short_name is distinct from name;
  end if;
end $$;

-- Patch create_order (uses products%rowtype / name in error text).
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
      raise exception 'insufficient stock for %', v_product.name;
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


alter table public.products drop column if exists short_name;
