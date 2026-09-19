-- =====================================================================
-- PLIK 5/6: goals
-- =====================================================================

create table if not exists public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text,
  -- 'exercise_weight': cel typu "Hip Thrust 80kg x 8"
  -- 'workout_count':   cel typu "10 treningów w tym miesiącu"
  -- 'custom':          dowolny inny cel
  goal_type text not null check (goal_type in ('exercise_weight', 'workout_count', 'custom')),
  target_value numeric,
  current_value numeric not null default 0,
  deadline date,
  completed boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists goals_user_id_idx on public.goals(user_id);

alter table public.goals enable row level security;

drop policy if exists "goals_select_own" on public.goals;
create policy "goals_select_own" on public.goals
  for select using (auth.uid() = user_id);

drop policy if exists "goals_insert_own" on public.goals;
create policy "goals_insert_own" on public.goals
  for insert with check (auth.uid() = user_id);

drop policy if exists "goals_update_own" on public.goals;
create policy "goals_update_own" on public.goals
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "goals_delete_own" on public.goals;
create policy "goals_delete_own" on public.goals
  for delete using (auth.uid() = user_id);
