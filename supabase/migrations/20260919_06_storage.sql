-- =====================================================================
-- PLIK 6/6: Supabase Storage — bucket na zdjęcia progresowe
--
-- Konwencja ścieżki pliku: {user_id}/{report_id}/{photo_type}-{timestamp}.jpg
-- Polityki niżej pilnują, żeby PIERWSZY segment ścieżki (czyli user_id)
-- zgadzał się z auth.uid() — to jest odpowiednik RLS, ale dla plików.
-- =====================================================================

insert into storage.buckets (id, name, public)
values ('progress-photos', 'progress-photos', false)
on conflict (id) do nothing;

drop policy if exists "progress_photos_storage_select_own" on storage.objects;
create policy "progress_photos_storage_select_own" on storage.objects
  for select using (
    bucket_id = 'progress-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "progress_photos_storage_insert_own" on storage.objects;
create policy "progress_photos_storage_insert_own" on storage.objects
  for insert with check (
    bucket_id = 'progress-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "progress_photos_storage_update_own" on storage.objects;
create policy "progress_photos_storage_update_own" on storage.objects
  for update using (
    bucket_id = 'progress-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "progress_photos_storage_delete_own" on storage.objects;
create policy "progress_photos_storage_delete_own" on storage.objects
  for delete using (
    bucket_id = 'progress-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
