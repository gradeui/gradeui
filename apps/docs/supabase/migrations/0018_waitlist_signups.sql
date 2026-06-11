-- 0018: waitlist_signups — early-access signups from /waitlist.
--
-- Written exclusively through the service-role client in
-- app/api/waitlist/route.ts. RLS is enabled with no policies, so the
-- anon/authenticated keys can neither read nor write rows — the public
-- API route is the only door in, and reading the list happens in the
-- Supabase dashboard (or a future admin surface).

create table if not exists public.waitlist_signups (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  first_name text not null,
  last_name text not null,
  company text,
  team_size text,
  role text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.waitlist_signups enable row level security;

-- Keep updated_at honest on upsert.
create or replace function public.waitlist_signups_touch()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists waitlist_signups_touch on public.waitlist_signups;
create trigger waitlist_signups_touch
  before update on public.waitlist_signups
  for each row execute function public.waitlist_signups_touch();
