-- =====================================================================
-- PLIK 2/6: workout_plans + exercises
-- =====================================================================

-- Funkcja pomocnicza: automatycznie ustawia updated_at przy każdym UPDATE.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.workout_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists workout_plans_user_id_idx on public.workout_plans(user_id);

alter table public.workout_plans enable row level security;

drop trigger if exists workout_plans_set_updated_at on public.workout_plans;
create trigger workout_plans_set_updated_at
  before update on public.workout_plans
  for each row execute procedure public.set_updated_at();

-- workout_plans ma własną kolumnę user_id, więc polityka jest prosta:
-- "auth.uid() = user_id" dla każdej operacji.
drop policy if exists "workout_plans_select_own" on public.workout_plans;
create policy "workout_plans_select_own" on public.workout_plans
  for select using (auth.uid() = user_id);

drop policy if exists "workout_plans_insert_own" on public.workout_plans;
create policy "workout_plans_insert_own" on public.workout_plans
  for insert with check (auth.uid() = user_id);

drop policy if exists "workout_plans_update_own" on public.workout_plans;
create policy "workout_plans_update_own" on public.workout_plans
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "workout_plans_delete_own" on public.workout_plans;
create policy "workout_plans_delete_own" on public.workout_plans
  for delete using (auth.uid() = user_id);


-- exercises NIE MA własnej kolumny user_id — należy do planu (plan_id),
-- a plan należy do użytkownika. Dlatego polityka sprawdza "czy plan,
-- do którego to ćwiczenie należy, jest mój?" przez podzapytanie EXISTS.
create table if not exists public.exercises (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.workout_plans(id) on delete cascade,
  name text not null,
  position integer not null default 0,
  sets integer,
  rep_range text,
  target_weight numeric(6,2),
  target_rpe numeric(3,1),
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists exercises_plan_id_idx on public.exercises(plan_id);

alter table public.exercises enable row level security;

drop policy if exists "exercises_select_own" on public.exercises;
create policy "exercises_select_own" on public.exercises
  for select using (
    exists (
      select 1 from public.workout_plans wp
      where wp.id = exercises.plan_id and wp.user_id = auth.uid()
    )
  );

drop policy if exists "exercises_insert_own" on public.exercises;
create policy "exercises_insert_own" on public.exercises
  for insert with check (
    exists (
      select 1 from public.workout_plans wp
      where wp.id = exercises.plan_id and wp.user_id = auth.uid()
    )
  );

drop policy if exists "exercises_update_own" on public.exercises;
create policy "exercises_update_own" on public.exercises
  for update using (
    exists (
      select 1 from public.workout_plans wp
      where wp.id = exercises.plan_id and wp.user_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.workout_plans wp
      where wp.id = exercises.plan_id and wp.user_id = auth.uid()
    )
  );

drop policy if exists "exercises_delete_own" on public.exercises;
create policy "exercises_delete_own" on public.exercises
  for delete using (
    exists (
      select 1 from public.workout_plans wp
      where wp.id = exercises.plan_id and wp.user_id = auth.uid()
    )
  );
