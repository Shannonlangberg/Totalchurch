-- TOTAL CHURCH · Stewardship platform · initial schema
-- Movements: create / connect / develop

-- ============ PROFILES ============
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '',
  email text not null default '',
  phone text,
  role text not null default 'member' check (role in ('member', 'admin')),
  onboarded boolean not null default false,
  created_at timestamptz not null default now()
);

-- auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email, phone, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce(new.email, ''),
    nullif(new.raw_user_meta_data ->> 'phone', ''),
    case when lower(coalesce(new.email, '')) = 'shannon.langberg@futures.church' then 'admin' else 'member' end
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============ STEWARDSHIPS ============
create table public.stewardships (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  movement text not null check (movement in ('create', 'connect', 'develop')),
  purpose text not null default '',
  time_commitment text not null default '',
  frequency text not null default '',
  responsibilities text[] not null default '{}',
  playbook text not null default '',
  location text not null default '',
  resources text not null default '',
  capacity int not null default 1 check (capacity >= 1),
  status text not null default 'active' check (status in ('active', 'archived')),
  created_at timestamptz not null default now()
);

-- ============ ASSIGNMENTS ============
create table public.assignments (
  id uuid primary key default gen_random_uuid(),
  stewardship_id uuid not null references public.stewardships (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  status text not null default 'active' check (status in ('active', 'stepped_down')),
  started_at timestamptz not null default now(),
  ended_at timestamptz
);

create unique index one_active_assignment_per_pair
  on public.assignments (stewardship_id, profile_id)
  where status = 'active';

-- ============ REQUESTS ============
create table public.requests (
  id uuid primary key default gen_random_uuid(),
  stewardship_id uuid not null references public.stewardships (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  type text not null check (type in ('join', 'step_down')),
  message text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'declined')),
  created_at timestamptz not null default now(),
  decided_at timestamptz,
  decided_by uuid references public.profiles (id)
);

create unique index one_pending_request_per_pair
  on public.requests (stewardship_id, profile_id, type)
  where status = 'pending';

-- ============ ABSENCES (sick / away) ============
create table public.absences (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  stewardship_id uuid not null references public.stewardships (id) on delete cascade,
  kind text not null default 'sick' check (kind in ('sick', 'away', 'other')),
  note text,
  date_from date not null default current_date,
  date_to date,
  created_at timestamptz not null default now()
);

-- ============ NOTIFICATIONS LOG ============
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  kind text not null,
  payload jsonb not null default '{}',
  email_to text[] not null default '{}',
  sent boolean not null default false,
  created_at timestamptz not null default now()
);

-- ============ HELPERS ============
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- Approve a join request atomically: create assignment, mark request
create or replace function public.approve_request(req_id uuid)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  req record;
begin
  if not public.is_admin() then
    raise exception 'Only leaders can approve requests';
  end if;

  select * into req from public.requests where id = req_id and status = 'pending';
  if req is null then
    raise exception 'Request not found or already decided';
  end if;

  if req.type = 'join' then
    insert into public.assignments (stewardship_id, profile_id)
    values (req.stewardship_id, req.profile_id)
    on conflict do nothing;
  elsif req.type = 'step_down' then
    update public.assignments
    set status = 'stepped_down', ended_at = now()
    where stewardship_id = req.stewardship_id
      and profile_id = req.profile_id
      and status = 'active';
  end if;

  update public.requests
  set status = 'approved', decided_at = now(), decided_by = auth.uid()
  where id = req_id;
end;
$$;

create or replace function public.decline_request(req_id uuid)
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Only leaders can decline requests';
  end if;
  update public.requests
  set status = 'declined', decided_at = now(), decided_by = auth.uid()
  where id = req_id and status = 'pending';
end;
$$;

-- ============ ROW LEVEL SECURITY ============
alter table public.profiles enable row level security;
alter table public.stewardships enable row level security;
alter table public.assignments enable row level security;
alter table public.requests enable row level security;
alter table public.absences enable row level security;
alter table public.notifications enable row level security;

-- profiles: read own; admins read all; authed users can read names of stewards
create policy "profiles: self read" on public.profiles
  for select using (auth.uid() = id or public.is_admin());
create policy "profiles: self update" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id and role = (select role from public.profiles where id = auth.uid()));
create policy "profiles: admin update" on public.profiles
  for update using (public.is_admin());

-- stewardships: anyone signed in can browse; only admins write
create policy "stewardships: read" on public.stewardships
  for select using (auth.role() = 'authenticated');
create policy "stewardships: admin insert" on public.stewardships
  for insert with check (public.is_admin());
create policy "stewardships: admin update" on public.stewardships
  for update using (public.is_admin());
create policy "stewardships: admin delete" on public.stewardships
  for delete using (public.is_admin());

-- assignments: read all (so the whole house can see who stewards what & gaps)
create policy "assignments: read" on public.assignments
  for select using (auth.role() = 'authenticated');
create policy "assignments: admin write" on public.assignments
  for insert with check (public.is_admin());
create policy "assignments: admin update" on public.assignments
  for update using (public.is_admin());

-- requests: create own, see own; admins see and decide all
create policy "requests: self insert" on public.requests
  for insert with check (auth.uid() = profile_id);
create policy "requests: read own or admin" on public.requests
  for select using (auth.uid() = profile_id or public.is_admin());

-- absences: create own, see own; admins see all
create policy "absences: self insert" on public.absences
  for insert with check (auth.uid() = profile_id);
create policy "absences: read own or admin" on public.absences
  for select using (auth.uid() = profile_id or public.is_admin());

-- notifications: admin read only (writes happen via service role / edge fn)
create policy "notifications: admin read" on public.notifications
  for select using (public.is_admin());

-- ============ SEED: the three movements' first stewardships ============
insert into public.stewardships (title, movement, purpose, time_commitment, frequency, responsibilities, playbook, location, resources, capacity) values
('Auditorium', 'create', 'Prepare a space where nothing distracts from people meeting Jesus. An excellent room says: you were expected.', '90 minutes', 'Weekly — Sunday morning', array['Set the auditorium before service', 'Reset between services', 'Leave the room better than you found it'], 'Arrive 7:30am. Check seating alignment, stage clear, bibles stocked. Walk every row. Reset after each service.', 'Main Auditorium', 'Setup checklist in the storeroom', 3),
('Coffee', 'connect', 'A great coffee is a small act of hospitality that tells a guest: you are welcome here, and we thought about you before you arrived.', '2.5 hours', 'Weekly — Sunday morning', array['Open the cafe by 8:15am', 'Serve with warmth and excellence', 'Clean and close the machine'], 'Machine on by 8am. Dial in the grind. Greet every person by name where you can.', 'Foyer Cafe', 'Barista guide behind the counter', 4),
('New People Follow Up', 'connect', 'Nobody should visit God''s House and be forgotten. Every new person gets a personal touch within 48 hours.', '1 hour', 'Weekly — flexible', array['Contact each new person within 48 hours', 'Record the connection', 'Hand off to a group or leader'], 'Collect connect cards Sunday. Message or call by Tuesday. Warm, personal, unhurried.', 'Flexible / from home', 'Connect card workflow doc', 2),
('Kids — Sunday Team', 'develop', 'The next generation learns what God''s House feels like from us. Safe, joyful, intentional environments form lifelong disciples.', '3 hours', 'Fortnightly — Sunday', array['Prepare your room before families arrive', 'Lead your group with energy and care', 'Connect with parents at pickup'], 'Arrive 8:30am. Room set by 9am. Follow the curriculum guide. Two leaders per room, always.', 'Kids Wing', 'Curriculum + safety policy in Kids HQ', 6),
('Prayer', 'develop', 'Every move of God begins in prayer. We steward the engine room of the House.', '1 hour', 'Weekly — Tuesday night', array['Host the prayer meeting', 'Gather and carry the requests of the church', 'Pray for Sunday'], 'Tuesdays 7pm in the chapel. Open the room, lead the hour, close in worship.', 'Chapel', 'Prayer guide', 2),
('Gardens', 'create', 'The grounds preach before the preacher does. A cared-for garden tells the neighbourhood somebody loves this place.', '2 hours', 'Monthly — Saturday', array['Mow, edge and tidy the grounds', 'Water and maintain plantings', 'Flag anything needing repair'], 'First Saturday of the month, 8am. Tools in the shed. Coffee provided.', 'Church grounds', 'Shed key from the office', 4);
