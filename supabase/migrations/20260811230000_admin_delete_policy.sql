-- Allow authenticated owner to remove catalog rows from the admin desk.
drop policy if exists "Authenticated delete products" on public.products;
create policy "Authenticated delete products"
  on public.products for delete
  to authenticated
  using (true);
