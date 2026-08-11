-- Single editable home highlight ("Going viral" block).

alter table public.shop_settings
  add column if not exists home_highlight jsonb not null default '{
    "enabled": true,
    "kicker": "Going viral",
    "title": "Last night''s OP-05 chase hit 40K views",
    "body": "Manga rare pulled live on stream — catch the replay, then lock a slot for tonight''s opening.",
    "primaryLabel": "Watch schedule",
    "primaryAction": "schedule",
    "primaryUrl": null,
    "secondaryLabel": "Shop catalog",
    "secondaryAction": "shop",
    "secondaryUrl": null
  }'::jsonb;

comment on column public.shop_settings.home_highlight is
  'Homepage promo card: enabled, kicker, title, body, CTA labels/actions (schedule|shop|url).';

-- Allow signed-in admin to update shop settings (highlight, etc.).
drop policy if exists "Authenticated update shop settings" on public.shop_settings;
create policy "Authenticated update shop settings"
  on public.shop_settings for update
  to authenticated
  using (true)
  with check (true);
