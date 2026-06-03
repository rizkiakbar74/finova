-- 012_storage_policies.sql
-- Private Supabase Storage bucket and folder-based access policies for receipt attachments

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'receipts',
  'receipts',
  false,
  5242880,
  array['image/png', 'image/jpeg', 'application/pdf']
)
on conflict (id) do update set
  public = false,
  file_size_limit = 5242880,
  allowed_mime_types = array['image/png', 'image/jpeg', 'application/pdf'];

-- File path convention:
-- {user_id}/{transaction_id}/{timestamp}-{file_name}

drop policy if exists receipts_select_own on storage.objects;
create policy receipts_select_own
on storage.objects
for select
to authenticated
using (
  bucket_id = 'receipts'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists receipts_insert_own on storage.objects;
create policy receipts_insert_own
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'receipts'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists receipts_update_own on storage.objects;
create policy receipts_update_own
on storage.objects
for update
to authenticated
using (
  bucket_id = 'receipts'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'receipts'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists receipts_delete_own on storage.objects;
create policy receipts_delete_own
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'receipts'
  and (storage.foldername(name))[1] = auth.uid()::text
);
