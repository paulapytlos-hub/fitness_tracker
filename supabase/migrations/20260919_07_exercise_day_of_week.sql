-- =====================================================================
-- PLIK 7/7: dzień tygodnia dla ćwiczeń
-- =====================================================================
-- Pozwala pogrupować ćwiczenia w planie wg dnia tygodnia
-- (0 = poniedziałek ... 6 = niedziela). Dzień bez ćwiczeń traktowany
-- jest w UI jako dzień odpoczynku (REST).

alter table public.exercises
  add column if not exists day_of_week smallint;

alter table public.exercises
  drop constraint if exists exercises_day_of_week_check;

alter table public.exercises
  add constraint exercises_day_of_week_check
  check (day_of_week is null or day_of_week between 0 and 6);

create index if not exists exercises_plan_id_day_of_week_idx
  on public.exercises(plan_id, day_of_week);
