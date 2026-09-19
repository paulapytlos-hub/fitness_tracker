-- =====================================================================
-- PLIK 4/6: weekly_reports + progress_photos
-- =====================================================================

create table if not exists public.weekly_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  week_start date not null,
  weight numeric(5,2),
  waist numeric(5,2),
  hips numeric(5,2),
  thigh numeric(5,2),
  -- Samopoczucie jako emoji, dokładnie jak w specyfikacji (sekcja 11).
  mood text check (mood in ('😞', '😐', '🙂', '😄', '🔥')),
  notes text,
  created_at timestamptz not null default now(),
  -- Jeden raport na tydzień na użytkownika.
  unique (user_id, week_start)
);

create index if not exists weekly_reports_user_id_idx on public.weekly_reports(user_id);

alter table public.weekly_reports enable row level security;

drop policy if exists "weekly_reports_select_own" on public.weekly_reports;
create policy "weekly_reports_select_own" on public.weekly_reports
  for select using (auth.uid() = user_id);

drop policy if exists "weekly_reports_insert_own" on public.weekly_reports;
create policy "weekly_reports_insert_own" on public.weekly_reports
  for insert with check (auth.uid() = user_id);

drop policy if exists "weekly_reports_update_own" on public.weekly_reports;
create policy "weekly_reports_update_own" on public.weekly_reports
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "weekly_reports_delete_own" on public.weekly_reports;
create policy "weekly_reports_delete_own" on public.weekly_reports
  for delete using (auth.uid() = user_id);


-- progress_photos trzyma tylko ŚCIEŻKĘ do pliku w Supabase Storage
-- (sekcja 11: "nie przechowuj samych plików zdjęć w PostgreSQL").
-- weekly_report_id jest opcjonalne, żeby dało się dodać zdjęcie bez
-- pełnego raportu tygodniowego.
create table if not exists public.progress_photos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  weekly_report_id uuid references public.weekly_reports(id) on delete cascade,
  photo_type text not null check (photo_type in ('front', 'side', 'back')),
  storage_path text not null,
  created_at timestamptz not null default now()
);

create index if not exists progress_photos_user_id_idx on public.progress_photos(user_id);
create index if not exists progress_photos_weekly_report_id_idx on public.progress_photos(weekly_report_id);

alter table public.progress_photos enable row level security;

drop policy if exists "progress_photos_select_own" on public.progress_photos;
create policy "progress_photos_select_own" on public.progress_photos
  for select using (auth.uid() = user_id);

drop policy if exists "progress_photos_insert_own" on public.progress_photos;
create policy "progress_photos_insert_own" on public.progress_photos
  for insert with check (auth.uid() = user_id);

drop policy if exists "progress_photos_update_own" on public.progress_photos;
create policy "progress_photos_update_own" on public.progress_photos
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "progress_photos_delete_own" on public.progress_photos;
create policy "progress_photos_delete_own" on public.progress_photos
  for delete using (auth.uid() = user_id);
