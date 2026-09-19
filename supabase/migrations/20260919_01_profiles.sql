-- =====================================================================
-- PLIK 1/6: profiles
-- Wklej w Supabase SQL Editor jako pierwszy.
-- =====================================================================

-- gen_random_uuid() potrzebuje tego rozszerzenia (w Supabase zwykle
-- jest już włączone, ale "if not exists" nic nie zepsuje).
create extension if not exists pgcrypto;

-- Tabela profiles trzyma dane "publiczne" o użytkowniku (imię itp.).
-- Nie dubluje auth.users — profiles.id JEST auth.users.id (relacja 1:1),
-- więc nie potrzebujemy osobnej kolumny user_id.
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text,
  email text,
  created_at timestamptz not null default now()
);

-- RLS = Row Level Security. Domyślnie, dopóki nie dodamy żadnej polityki,
-- WŁĄCZONE RLS oznacza "nikt nic nie widzi" (nawet właściciel).
-- Każda polityka poniżej to wyjątek od tej reguły.
alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Uwaga: celowo NIE dodajemy polityki insert/delete dla użytkownika.
-- Wiersz w profiles powstaje automatycznie (patrz trigger niżej), więc
-- ręczny insert z frontendu nie powinien być w ogóle możliwy.

-- Automatyczne utworzenie profilu przy rejestracji nowego użytkownika.
-- "security definer" pozwala tej funkcji ominąć RLS tylko na czas
-- wstawienia jednego wiersza, dokładnie tego dla nowo utworzonego usera.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)),
    new.email
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
