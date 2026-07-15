-- Covers: step in for a week when someone's away
alter table public.stewardships add column if not exists needs_cover boolean not null default false;

create table if not exists public.covers (
  id uuid primary key default gen_random_uuid(),
  stewardship_id uuid not null references public.stewardships (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  date_from date not null default current_date,
  date_to date not null default current_date + 7,
  created_at timestamptz not null default now()
);

alter table public.covers enable row level security;
create policy "covers: self insert" on public.covers
  for insert with check (auth.uid() = profile_id);
create policy "covers: read" on public.covers
  for select using (auth.role() = 'authenticated');
create policy "covers: self delete" on public.covers
  for delete using (auth.uid() = profile_id or public.is_admin());

create or replace view public.current_covers as
  select stewardship_id, profile_id, date_from, date_to
  from public.covers where date_to >= current_date;
grant select on public.current_covers to authenticated;
revoke select on public.current_covers from anon;
