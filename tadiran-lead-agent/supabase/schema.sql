-- טבלת הלידים + אבטחה. להריץ ב-Supabase SQL Editor.
create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  sector text,
  employees_estimate int,
  employees_confidence text check (employees_confidence in ('verified','estimated','unknown')),
  employees_source text,
  score int,
  rationale text,
  pain_signals jsonb,
  channels_today text,
  contact_center_notes text,
  contact_role text,
  sources jsonb,
  status text not null default 'new' check (status in ('new','rejected')),
  reject_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;
drop trigger if exists leads_touch on public.leads;
create trigger leads_touch before update on public.leads
  for each row execute function public.touch_updated_at();

alter table public.leads enable row level security;

-- רק משתמש מחובר (אבא, דרך Supabase Auth) קורא; הסוכן משתמש ב-service_role שעוקף RLS
drop policy if exists auth_read on public.leads;
create policy auth_read on public.leads for select to authenticated using (true);
drop policy if exists auth_update on public.leads;
create policy auth_update on public.leads for update to authenticated using (true) with check (true);

-- משתמש מחובר יכול לשנות רק status ו-reject_reason
revoke all on public.leads from anon, authenticated;
grant select on public.leads to authenticated;
grant update (status, reject_reason) on public.leads to authenticated;
