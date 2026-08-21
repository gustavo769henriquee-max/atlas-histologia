create policy "Public can view published laminas"
on public.laminas
for select
to public
using (
  publicado = true
);


create policy "Authenticated users can create laminas"
on public.laminas
for insert
to authenticated
with check (
  true
);


create policy "Authenticated users can update laminas"
on public.laminas
for update
to authenticated
using (
  true
)
with check (
  true
);


create policy "Authenticated users can delete laminas"
on public.laminas
for delete
to authenticated
using (
  true
);
