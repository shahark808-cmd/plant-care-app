-- Stage 2: households, household_members, settings, join/create RPCs, RLS.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table households (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'הבית שלנו',
  invite_code text not null unique,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id)
);

create table household_members (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  display_name text,
  joined_at timestamptz not null default now(),
  unique (household_id, user_id)
);

create table settings (
  household_id uuid primary key references households(id) on delete cascade,
  latitude double precision not null default 32.9646,   -- Tzfat
  longitude double precision not null default 35.4960,
  timezone text not null default 'Asia/Jerusalem',
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Helper: is the current user a member of this household?
-- ---------------------------------------------------------------------------

create or replace function is_household_member(hh_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from household_members
    where household_id = hh_id and user_id = auth.uid()
  );
$$;

-- ---------------------------------------------------------------------------
-- Invite codes: 8 chars, uppercase, no ambiguous characters (0/O, 1/I/L)
-- ---------------------------------------------------------------------------

create or replace function generate_invite_code()
returns text
language plpgsql
as $$
declare
  chars text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  result text := '';
  i int;
begin
  for i in 1..8 loop
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  end loop;
  return result;
end;
$$;

-- ---------------------------------------------------------------------------
-- create_household: creates a household, makes the caller its first member,
-- and seeds default settings. SECURITY DEFINER so it can insert the caller's
-- own membership row before any RLS policy on household_members would apply.
-- ---------------------------------------------------------------------------

create or replace function create_household(household_name text default 'הבית שלנו', member_display_name text default null)
returns table (household_id uuid, invite_code text)
language plpgsql
security definer
set search_path = public
as $$
declare
  new_household_id uuid;
  new_code text;
begin
  if auth.uid() is null then
    raise exception 'יש להתחבר לפני יצירת בית';
  end if;

  new_code := generate_invite_code();

  insert into households (name, invite_code, created_by)
  values (household_name, new_code, auth.uid())
  returning id into new_household_id;

  insert into household_members (household_id, user_id, display_name)
  values (new_household_id, auth.uid(), member_display_name);

  insert into settings (household_id)
  values (new_household_id);

  return query select new_household_id, new_code;
end;
$$;

-- ---------------------------------------------------------------------------
-- join_household_by_code: joins the caller to an existing household.
-- ---------------------------------------------------------------------------

create or replace function join_household_by_code(code text, member_display_name text default null)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  target_household_id uuid;
begin
  if auth.uid() is null then
    raise exception 'יש להתחבר לפני הצטרפות לבית';
  end if;

  select id into target_household_id
  from households
  where invite_code = upper(trim(code));

  if target_household_id is null then
    raise exception 'קוד הזמנה לא תקין';
  end if;

  insert into household_members (household_id, user_id, display_name)
  values (target_household_id, auth.uid(), member_display_name)
  on conflict (household_id, user_id) do nothing;

  return target_household_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table households enable row level security;
alter table household_members enable row level security;
alter table settings enable row level security;

create policy "members can read their household"
  on households for select
  using (is_household_member(id));

create policy "members can read their household's members"
  on household_members for select
  using (is_household_member(household_id));

create policy "members can read their household's settings"
  on settings for select
  using (is_household_member(household_id));

create policy "members can update their household's settings"
  on settings for update
  using (is_household_member(household_id));

-- No direct insert/update/delete policies on households / household_members:
-- all writes to those two tables go through the SECURITY DEFINER functions
-- above, which bypass RLS deliberately and validate membership themselves.
