insert into storage.buckets (
  id,
  name,
  public
)
values (
  'laminas',
  'laminas',
  true
)
on conflict (id) do update
set public = true;


create policy "Public can view atlas images"
on storage.objects
for select
to public
using (
  bucket_id = 'laminas'
);


create policy "Authenticated users can upload atlas images"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'laminas'
);


create policy "Authenticated users can update atlas images"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'laminas'
)
with check (
  bucket_id = 'laminas'
);


create policy "Authenticated users can delete atlas images"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'laminas'
);
