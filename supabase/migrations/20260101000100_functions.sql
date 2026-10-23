-- פונקציות עזר (security definer כדי למנוע רקורסיה ב-RLS) ו-RPC.

create or replace function public.is_household_member(hid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.household_members
    where household_id = hid and user_id = auth.uid()
  );
$$;

create or replace function public.is_member_of(hid uuid, uid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.household_members
    where household_id = hid and user_id = uid
  );
$$;

create or replace function public.shares_household_with(uid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1
    from public.household_members me
    join public.household_members other on other.household_id = me.household_id
    where me.user_id = auth.uid() and other.user_id = uid
  );
$$;

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(split_part(new.email, '@', 1), ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.create_household(p_name text default 'משק הבית') returns uuid
language plpgsql security definer set search_path = public as $$
declare
  hid uuid;
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'not authenticated';
  end if;
  if exists (select 1 from public.household_members where user_id = uid) then
    raise exception 'already in a household';
  end if;

  insert into public.households (name) values (coalesce(nullif(trim(p_name), ''), 'משק הבית'))
  returning id into hid;
  insert into public.household_members (household_id, user_id) values (hid, uid);

  insert into public.categories (household_id, name, icon, color, kind, sort_order) values
    (hid, 'סופר', 'shopping-cart', '#16a34a', 'expense', 1),
    (hid, 'אוכל בחוץ', 'utensils', '#ea580c', 'expense', 2),
    (hid, 'תחבורה', 'car', '#2563eb', 'expense', 3),
    (hid, 'בית וחשבונות', 'home', '#7c3aed', 'expense', 4),
    (hid, 'בילויים', 'ticket', '#db2777', 'expense', 5),
    (hid, 'בריאות', 'heart-pulse', '#dc2626', 'expense', 6),
    (hid, 'קניות', 'shopping-bag', '#0891b2', 'expense', 7),
    (hid, 'אחר', 'circle', '#64748b', 'expense', 8),
    (hid, 'משכורת', 'wallet', '#16a34a', 'income', 1),
    (hid, 'הכנסה אחרת', 'plus-circle', '#0f766e', 'income', 2);

  return hid;
end;
$$;

create or replace function public.join_household(p_code text) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  hid uuid;
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'not authenticated';
  end if;
  if exists (select 1 from public.household_members where user_id = uid) then
    raise exception 'already in a household';
  end if;

  select id into hid from public.households where invite_code = upper(trim(p_code));
  if hid is null then
    raise exception 'invalid invite code';
  end if;
  if (select count(*) from public.household_members where household_id = hid) >= 2 then
    raise exception 'household is full';
  end if;

  insert into public.household_members (household_id, user_id) values (hid, uid);
  return hid;
end;
$$;
