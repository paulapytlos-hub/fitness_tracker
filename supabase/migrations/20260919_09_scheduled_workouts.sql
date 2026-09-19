-- =====================================================================
-- PLIK 9/9: kalendarz — wyjątki od szablonu tygodniowego per konkretna data
-- =====================================================================
-- Domyślnie dana data pokazuje to, co wynika z szablonu
-- (exercises.day_of_week dla naturalnego dnia tygodnia tej daty) —
-- bez żadnego wiersza tutaj. Wiersz powstaje tylko gdy coś odbiega
-- od szablonu DLA TEJ KONKRETNEJ DATY: przeniesiono tu inny dzień,
-- oznaczono jako REST mimo że szablon mówi inaczej, albo oznaczono
-- jako wykonane. Zmiana nie dotyka szablonu — inne tygodnie
-- pozostają bez zmian.

create table if not exists public.scheduled_workouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_id uuid not null references public.workout_plans(id) on delete cascade,
  scheduled_date date not null,
  -- Który day_of_week z szablonu pokazać dla tej daty. NULL = REST.
  source_day_of_week smallint check (source_day_of_week between 0 and 6),
  status text not null default 'planned' check (status in ('planned', 'completed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (plan_id, scheduled_date)
);

create index if not exists scheduled_workouts_plan_id_idx on public.scheduled_workouts(plan_id);
create index if not exists scheduled_workouts_user_id_idx on public.scheduled_workouts(user_id);

alter table public.scheduled_workouts enable row level security;

drop trigger if exists scheduled_workouts_set_updated_at on public.scheduled_workouts;
create trigger scheduled_workouts_set_updated_at
  before update on public.scheduled_workouts
  for each row execute procedure public.set_updated_at();

drop policy if exists "scheduled_workouts_select_own" on public.scheduled_workouts;
create policy "scheduled_workouts_select_own" on public.scheduled_workouts
  for select using (auth.uid() = user_id);

drop policy if exists "scheduled_workouts_insert_own" on public.scheduled_workouts;
create policy "scheduled_workouts_insert_own" on public.scheduled_workouts
  for insert with check (auth.uid() = user_id);

drop policy if exists "scheduled_workouts_update_own" on public.scheduled_workouts;
create policy "scheduled_workouts_update_own" on public.scheduled_workouts
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "scheduled_workouts_delete_own" on public.scheduled_workouts;
create policy "scheduled_workouts_delete_own" on public.scheduled_workouts
  for delete using (auth.uid() = user_id);
