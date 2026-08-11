-- Seed Cortez TCG catalog + shop config from the original FE mock data.
-- image_url is a public Storage URL, or "placeholder" when none uploaded.

truncate table public.order_items restart identity cascade;
truncate table public.orders cascade;
truncate table public.products cascade;
truncate table public.streams cascade;
truncate table public.shipping_zones cascade;
truncate table public.shop_settings cascade;

insert into public.shop_settings (
  id,
  shop_name,
  gst_rate,
  payment_accounts,
  payment_qr_url
) values (
  'default',
  'Cortez TCG Live',
  0.05,
  '[
    {
      "bank": "Bank of Bhutan (BOB)",
      "accountName": "Cortez TCG Live",
      "accountNumber": "0001234567890"
    },
    {
      "bank": "Bhutan National Bank (BNB)",
      "accountName": "Cortez TCG Live",
      "accountNumber": "1009876543210"
    }
  ]'::jsonb,
  null
);

insert into public.shipping_zones (id, label, detail, fee, sort_order) values
  ('thimphu', 'Thimphu', 'Free delivery within Thimphu · 1–2 days', 0, 1),
  ('paro', 'Paro', 'Lowest courier rate · 1–3 days', 50, 2),
  ('rest-bhutan', 'Rest of Bhutan', 'Domestic courier · 2–5 days', 150, 3);

insert into public.streams (id, title, day, time, focus, status, sort_order) values
  ('stream-tue', 'OP-05 Loose Pack Night', 'Tue', '7:00 PM ET', 'Awakening of the New Era singles & slots', 'tonight', 1),
  ('stream-wed', 'Hit or Miss Mystery Slots', 'Wed', '8:00 PM ET', 'Community picks · chase alt arts', 'upcoming', 2),
  ('stream-thu', 'OP-06 Case Break', 'Thu', '8:00 PM ET', 'Wings of the Captain full case', 'upcoming', 3),
  ('stream-fri', 'Friday Night Emperors', 'Fri', '7:30 PM ET', 'OP-09 rip night with giveaways', 'upcoming', 4),
  ('stream-sat', 'Weekend Pull Party', 'Sat', '6:00 PM ET', 'Mixed set openings · nakama chat', 'upcoming', 5),
  ('stream-sun', 'Sunday Special Arts', 'Sun', '5:00 PM ET', 'Premium booster spotlight', 'upcoming', 6);

insert into public.products (
  id, name, price, compare_at, image_url, badge, stock, is_active, sort_order
) values
  ('op-05', 'OP-05 Awakening', 95, null, 'placeholder', 'favorite', 40, true, 1),
  ('op-06', 'OP-06 Wings', 95, null, 'placeholder', 'hot', 40, true, 2),
  ('op-07', 'OP-07 Future', 81, 95, 'placeholder', 'hot', 40, true, 3),
  ('op-08', 'OP-08 Legends', 95, null, 'placeholder', 'new', 40, true, 4),
  ('op-09', 'OP-09 Emperors', 88, 95, 'placeholder', 'hot', 40, true, 5),
  ('op-01', 'OP-01 Romance', 122, null, 'placeholder', 'favorite', 30, true, 6),
  ('op-02', 'OP-02 Paramount', 102, null, 'placeholder', null, 30, true, 7),
  ('op-03', 'OP-03 Pillars', 95, null, 'placeholder', null, 30, true, 8),
  ('op-04', 'OP-04 Kingdoms', 95, null, 'placeholder', null, 30, true, 9),
  ('op-10', 'OP-10 Royal', 95, null, 'placeholder', 'new', 30, true, 10),
  ('eb-01', 'EB-01 Memorial', 109, 122, 'placeholder', 'hot', 25, true, 11),
  ('op-11', 'OP-11 Divine', 95, null, 'placeholder', null, 30, true, 12),
  ('st-01', 'ST-01 Straw Hat', 272, 340, 'placeholder', 'favorite', 15, true, 13),
  ('st-02', 'ST-02 Worst Gen', 272, null, 'placeholder', null, 15, true, 14),
  ('op-12', 'OP-12 Legacy', 95, null, 'placeholder', 'new', 30, true, 15),
  ('prb-01', 'PRB-01 The Best', 204, 231, 'placeholder', 'favorite', 20, true, 16),
  ('op-05b', 'OP-05 Slot', 68, 95, 'placeholder', 'hot', 50, true, 17),
  ('op-06b', 'OP-06 Live Slot', 75, 95, 'placeholder', 'hot', 50, true, 18),
  ('op-08b', 'OP-08 Art Bundle', 407, null, 'placeholder', 'favorite', 10, true, 19),
  ('op-09b', 'OP-09 5-Pack', 435, 475, 'placeholder', 'hot', 12, true, 20);
