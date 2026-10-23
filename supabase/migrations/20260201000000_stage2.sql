-- שלב 2: תקציב חכם. קבוצות 50/30/20, הוצאות קבועות אוטומטיות, תשלומים.

alter table public.categories
  add column bucket text check (bucket in ('needs', 'wants', 'savings'));

-- שיוך ברירת מחדל לקטגוריות הקיימות, והוספת קטגוריית חיסכון למשקי בית קיימים
update public.categories set bucket = case name
  when 'סופר' then 'needs' when 'תחבורה' then 'needs' when 'בית וחשבונות' then 'needs' when 'בריאות' then 'needs'
  when 'אוכל בחוץ' then 'wants' when 'בילויים' then 'wants' when 'קניות' then 'wants' when 'אחר' then 'wants'
  else null end
where kind = 'expense' and bucket is null;

insert into public.categories (household_id, name, icon, color, kind, sort_order, bucket)
select h.id, 'חיסכון', 'wallet', '#0f766e', 'expense', 9, 'savings'
from public.households h
where not exists (select 1 from public.categories c where c.household_id = h.id and c.bucket = 'savings');

-- מקור 'recurring' להוצאות קבועות שנוצרו אוטומטית
alter table public.transactions drop constraint transactions_source_check;
alter table public.transactions
  add constraint transactions_source_check check (source in ('manual', 'import', 'recurring'));

alter table public.recurring_rules
  add column is_subscription boolean not null default false,
  add column last_materialized date,
  add column account_id uuid references public.accounts (id) on delete set null;

-- תקציב אחד לכל קטגוריה בתקופה (upsert), התקף קדימה עד שמוגדר חדש
alter table public.budgets
  add constraint budgets_owner_category_period_key unique (owner_id, category_id, period_start, visibility);

-- יצירת משק בית: קטגוריות ברירת מחדל כולל קבוצות 50/30/20
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

  insert into public.categories (household_id, name, icon, color, kind, sort_order, bucket) values
    (hid, 'סופר', 'shopping-cart', '#16a34a', 'expense', 1, 'needs'),
    (hid, 'אוכל בחוץ', 'utensils', '#ea580c', 'expense', 2, 'wants'),
    (hid, 'תחבורה', 'car', '#2563eb', 'expense', 3, 'needs'),
    (hid, 'בית וחשבונות', 'home', '#7c3aed', 'expense', 4, 'needs'),
    (hid, 'בילויים', 'ticket', '#db2777', 'expense', 5, 'wants'),
    (hid, 'בריאות', 'heart-pulse', '#dc2626', 'expense', 6, 'needs'),
    (hid, 'קניות', 'shopping-bag', '#0891b2', 'expense', 7, 'wants'),
    (hid, 'אחר', 'circle', '#64748b', 'expense', 8, 'wants'),
    (hid, 'חיסכון', 'wallet', '#0f766e', 'expense', 9, 'savings'),
    (hid, 'משכורת', 'wallet', '#16a34a', 'income', 1, null),
    (hid, 'הכנסה אחרת', 'plus-circle', '#0f766e', 'income', 2, null);

  return hid;
end;
$$;

-- יוצר תנועות מהוצאות קבועות שהגיע מועדן. security invoker: רץ תחת RLS של המשתמש ורק על הכללים שלו.
-- idempotent: last_materialized + אינדקס ייחודי על external_id.
create or replace function public.materialize_recurring(p_today date default current_date) returns int
language plpgsql set search_path = public as $$
declare
  r record;
  today date := least(p_today, current_date + 1);
  first_day date;
  m date;
  due date;
  inserted int;
  total int := 0;
begin
  for r in select * from public.recurring_rules where owner_id = auth.uid() and active loop
    first_day := coalesce(r.last_materialized + 1, r.created_at::date);
    m := date_trunc('month', first_day)::date;
    while m <= today loop
      due := m + (least(r.day_of_month, extract(day from (m + interval '1 month - 1 day'))::int) - 1);
      if due >= first_day and due <= today then
        insert into public.transactions
          (household_id, owner_id, paid_by, amount, type, category_id, date, visibility, note, source, external_id, account_id)
        values
          (r.household_id, r.owner_id, r.owner_id, r.amount, r.type, r.category_id, due, r.visibility, r.note,
           'recurring', 'rec:' || r.id || ':' || to_char(due, 'YYYY-MM'), r.account_id)
        on conflict (owner_id, external_id) where external_id is not null do nothing;
        get diagnostics inserted = row_count;
        total := total + inserted;
      end if;
      m := (m + interval '1 month')::date;
    end loop;
    update public.recurring_rules set last_materialized = today where id = r.id;
  end loop;
  return total;
end;
$$;

revoke execute on function public.materialize_recurring(date) from public, anon;
grant execute on function public.materialize_recurring(date) to authenticated;
