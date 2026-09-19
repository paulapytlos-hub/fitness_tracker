-- =====================================================================
-- PLIK 8/8: własne nazwy dni w planie (np. "Glute Day")
-- =====================================================================
-- Jeden wiersz na (plan, dzień tygodnia) — powstaje dopiero gdy
-- użytkownik nada dniowi nazwę. Brak wiersza = dzień bez nazwy
-- (pokazywany w UI jako REST, jeśli nie ma też ćwiczeń).

create table if not exists public.plan_days (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.workout_plans(id) on delete cascade,
  day_of_week smallint not null check (day_of_week between 0 and 6),
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (plan_id, day_of_week)
);

create index if not exists plan_days_plan_id_idx on public.plan_days(plan_id);

alter table public.plan_days enable row level security;

drop trigger if exists plan_days_set_updated_at on public.plan_days;
create trigger plan_days_set_updated_at
  before update on public.plan_days
  for each row execute procedure public.set_updated_at();

-- plan_days NIE MA własnej kolumny user_id — tak jak exercises,
-- należy do planu, więc polityka sprawdza właściciela planu.
drop policy if exists "plan_days_select_own" on public.plan_days;
create policy "plan_days_select_own" on public.plan_days
  for select using (
    exists (
      select 1 from public.workout_plans wp
      where wp.id = plan_days.plan_id and wp.user_id = auth.uid()
    )
  );

drop policy if exists "plan_days_insert_own" on public.plan_days;
create policy "plan_days_insert_own" on public.plan_days
  for insert with check (
    exists (
      select 1 from public.workout_plans wp
      where wp.id = plan_days.plan_id and wp.user_id = auth.uid()
    )
  );

drop policy if exists "plan_days_update_own" on public.plan_days;
create policy "plan_days_update_own" on public.plan_days
  for update using (
    exists (
      select 1 from public.workout_plans wp
      where wp.id = plan_days.plan_id and wp.user_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.workout_plans wp
      where wp.id = plan_days.plan_id and wp.user_id = auth.uid()
    )
  );

drop policy if exists "plan_days_delete_own" on public.plan_days;
create policy "plan_days_delete_own" on public.plan_days
  for delete using (
    exists (
      select 1 from public.workout_plans wp
      where wp.id = plan_days.plan_id and wp.user_id = auth.uid()
    )
  );
