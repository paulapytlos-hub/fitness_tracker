-- =====================================================================
-- PLIK 3/6: workout_sessions + session_exercises + exercise_sets
--
-- To jest najważniejsza część schematu — realizuje zasadę
-- "nie nadpisujemy historii" (sekcja 16 instrukcji projektu).
--
-- session_exercises to KOPIA (snapshot) danych z exercises w momencie
-- Start Workout. Jeśli użytkownik później zmieni ciężar w planie
-- (np. 70 kg -> 75 kg) albo usunie ćwiczenie z planu, historyczny
-- trening pokazuje dokładnie to, co skopiowano wtedy — nic się nie zmienia.
-- =====================================================================

create table if not exists public.workout_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  -- ON DELETE SET NULL: usunięcie planu nie kasuje historii sesji,
  -- tylko odrywa od niej odniesienie do (już nieistniejącego) planu.
  plan_id uuid references public.workout_plans(id) on delete set null,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists workout_sessions_user_id_idx on public.workout_sessions(user_id);
create index if not exists workout_sessions_plan_id_idx on public.workout_sessions(plan_id);

alter table public.workout_sessions enable row level security;

drop policy if exists "workout_sessions_select_own" on public.workout_sessions;
create policy "workout_sessions_select_own" on public.workout_sessions
  for select using (auth.uid() = user_id);

drop policy if exists "workout_sessions_insert_own" on public.workout_sessions;
create policy "workout_sessions_insert_own" on public.workout_sessions
  for insert with check (auth.uid() = user_id);

drop policy if exists "workout_sessions_update_own" on public.workout_sessions;
create policy "workout_sessions_update_own" on public.workout_sessions
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "workout_sessions_delete_own" on public.workout_sessions;
create policy "workout_sessions_delete_own" on public.workout_sessions
  for delete using (auth.uid() = user_id);


-- session_exercises: snapshot jednego ćwiczenia w ramach jednej sesji.
create table if not exists public.session_exercises (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.workout_sessions(id) on delete cascade,
  -- Odniesienie do oryginalnego ćwiczenia z planu — tylko "dla ciekawości"
  -- / linkowania w UI. Może zniknąć (SET NULL), historia i tak przetrwa,
  -- bo name/target_* poniżej są już skopiowane.
  source_exercise_id uuid references public.exercises(id) on delete set null,
  name text not null,
  position integer not null default 0,
  target_sets integer,
  target_rep_range text,
  target_weight numeric(6,2),
  target_rpe numeric(3,1),
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists session_exercises_session_id_idx on public.session_exercises(session_id);

alter table public.session_exercises enable row level security;

-- session_exercises nie ma własnego user_id — sprawdzamy przez
-- workout_sessions, do której należy.
drop policy if exists "session_exercises_select_own" on public.session_exercises;
create policy "session_exercises_select_own" on public.session_exercises
  for select using (
    exists (
      select 1 from public.workout_sessions ws
      where ws.id = session_exercises.session_id and ws.user_id = auth.uid()
    )
  );

drop policy if exists "session_exercises_insert_own" on public.session_exercises;
create policy "session_exercises_insert_own" on public.session_exercises
  for insert with check (
    exists (
      select 1 from public.workout_sessions ws
      where ws.id = session_exercises.session_id and ws.user_id = auth.uid()
    )
  );

drop policy if exists "session_exercises_update_own" on public.session_exercises;
create policy "session_exercises_update_own" on public.session_exercises
  for update using (
    exists (
      select 1 from public.workout_sessions ws
      where ws.id = session_exercises.session_id and ws.user_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.workout_sessions ws
      where ws.id = session_exercises.session_id and ws.user_id = auth.uid()
    )
  );

drop policy if exists "session_exercises_delete_own" on public.session_exercises;
create policy "session_exercises_delete_own" on public.session_exercises
  for delete using (
    exists (
      select 1 from public.workout_sessions ws
      where ws.id = session_exercises.session_id and ws.user_id = auth.uid()
    )
  );


-- exercise_sets: pojedyncza wykonana seria (reps x weight).
create table if not exists public.exercise_sets (
  id uuid primary key default gen_random_uuid(),
  session_exercise_id uuid not null references public.session_exercises(id) on delete cascade,
  set_number integer not null,
  reps integer,
  weight numeric(6,2),
  rpe numeric(3,1),
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists exercise_sets_session_exercise_id_idx on public.exercise_sets(session_exercise_id);

alter table public.exercise_sets enable row level security;

-- Tu łańcuch jest o jedno ogniwo dłuższy:
-- exercise_sets -> session_exercises -> workout_sessions -> user_id.
drop policy if exists "exercise_sets_select_own" on public.exercise_sets;
create policy "exercise_sets_select_own" on public.exercise_sets
  for select using (
    exists (
      select 1 from public.session_exercises se
      join public.workout_sessions ws on ws.id = se.session_id
      where se.id = exercise_sets.session_exercise_id and ws.user_id = auth.uid()
    )
  );

drop policy if exists "exercise_sets_insert_own" on public.exercise_sets;
create policy "exercise_sets_insert_own" on public.exercise_sets
  for insert with check (
    exists (
      select 1 from public.session_exercises se
      join public.workout_sessions ws on ws.id = se.session_id
      where se.id = exercise_sets.session_exercise_id and ws.user_id = auth.uid()
    )
  );

drop policy if exists "exercise_sets_update_own" on public.exercise_sets;
create policy "exercise_sets_update_own" on public.exercise_sets
  for update using (
    exists (
      select 1 from public.session_exercises se
      join public.workout_sessions ws on ws.id = se.session_id
      where se.id = exercise_sets.session_exercise_id and ws.user_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.session_exercises se
      join public.workout_sessions ws on ws.id = se.session_id
      where se.id = exercise_sets.session_exercise_id and ws.user_id = auth.uid()
    )
  );

drop policy if exists "exercise_sets_delete_own" on public.exercise_sets;
create policy "exercise_sets_delete_own" on public.exercise_sets
  for delete using (
    exists (
      select 1 from public.session_exercises se
      join public.workout_sessions ws on ws.id = se.session_id
      where se.id = exercise_sets.session_exercise_id and ws.user_id = auth.uid()
    )
  );
