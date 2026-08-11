-- Multiple watch links per stream (YouTube, Twitch, Facebook, TikTok, …).
-- Safe to re-run.

alter table public.streams
  add column if not exists stream_urls jsonb not null default '[]'::jsonb;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'streams'
      and column_name = 'stream_url'
  ) then
    update public.streams
    set stream_urls = jsonb_build_array(trim(stream_url))
    where coalesce(trim(stream_url), '') <> ''
      and (
        stream_urls is null
        or stream_urls = '[]'::jsonb
      );

    alter table public.streams drop column stream_url;
  end if;
end $$;

comment on column public.streams.stream_urls is
  'JSON array of watch URL strings, e.g. ["https://youtube.com/…","https://twitch.tv/…"]';
