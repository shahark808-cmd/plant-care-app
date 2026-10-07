-- Strava OAuth tokens: server-side only. RLS is on with NO policies, so only the
-- service role (edge functions) can read or write them; clients never see tokens.
create table public.strava_tokens (
  user_id uuid primary key references auth.users (id) on delete cascade,
  athlete_id bigint not null unique,
  access_token text not null,
  refresh_token text not null,
  expires_at timestamptz not null,
  updated_at timestamptz not null default now()
);
alter table public.strava_tokens enable row level security;

-- Runs synced from Strava. Clients may only read their own rows.
create table public.strava_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  strava_id bigint not null,
  date date not null,
  distance_km numeric(7,2) not null,
  duration_sec integer not null,
  avg_hr integer,
  max_hr integer,
  name text,
  sport text,
  created_at timestamptz not null default now(),
  unique (user_id, strava_id)
);
alter table public.strava_runs enable row level security;
create policy "read own strava runs" on public.strava_runs
  for select to authenticated using ((select auth.uid()) = user_id);
create index strava_runs_user_date_idx on public.strava_runs (user_id, date desc);
