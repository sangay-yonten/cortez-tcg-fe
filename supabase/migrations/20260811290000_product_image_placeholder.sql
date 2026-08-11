-- Replace legacy bundled art keys with the placeholder sentinel.
-- Uploaded Storage URLs are left unchanged.

update public.products
set image_url = 'placeholder'
where image_url is null
   or trim(image_url) = ''
   or image_url in ('op05', 'op06', 'op07', 'op08');
