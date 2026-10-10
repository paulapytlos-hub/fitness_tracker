-- =====================================================================
-- PLIK 10: powiązanie sesji treningowej z dniem w kalendarzu
-- =====================================================================
-- scheduled_date: której daty z kalendarza dotyczy trening (data w
--   kalendarzu, nie strefa czasowa serwera). Dzięki temu po zakończeniu
--   sesji wiemy, który dzień oznaczyć jako wykonany, a ponowne
--   kliknięcie "Rozpocznij trening" otwiera tę samą sesję.
-- title: KOPIA nazwy dnia (np. "Glute Day") w momencie startu — zmiana
--   nazwy dnia w planie nie zmienia historii (zasada z sekcji 16).

alter table public.workout_sessions
  add column if not exists scheduled_date date,
  add column if not exists title text;

create index if not exists workout_sessions_plan_id_scheduled_date_idx
  on public.workout_sessions(plan_id, scheduled_date);


-- Zakończony trening jest niezmienny: blokujemy dopisywanie i edycję
-- serii w sesji, która ma completed_at. Sprawdzane w bazie, nie tylko
-- w aplikacji. (DELETE celowo pominięty — kaskadowe usuwanie konta
-- musi dalej działać.)
create or replace function public.prevent_completed_session_set_changes()
returns trigger
language plpgsql
as $$
begin
  if exists (
    select 1
    from public.session_exercises se
    join public.workout_sessions ws on ws.id = se.session_id
    where se.id = new.session_exercise_id
      and ws.completed_at is not null
  ) then
    raise exception 'Ten trening jest już zakończony — nie można zmieniać serii.';
  end if;
  return new;
end;
$$;

drop trigger if exists exercise_sets_block_completed on public.exercise_sets;
create trigger exercise_sets_block_completed
  before insert or update on public.exercise_sets
  for each row execute procedure public.prevent_completed_session_set_changes();
