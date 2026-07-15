-- The Field: safe read-only views so the whole House can see the team
-- (profiles RLS stays locked down; these expose names + current absences only)

create or replace view public.steward_names as
  select id, full_name from public.profiles;
grant select on public.steward_names to authenticated;
revoke select on public.steward_names from anon;

create or replace view public.current_absences as
  select a.stewardship_id, a.profile_id, a.kind, a.date_from, a.date_to
  from public.absences a
  where a.date_from >= current_date - 7
     or (a.date_to is not null and a.date_to >= current_date);
grant select on public.current_absences to authenticated;
revoke select on public.current_absences from anon;
