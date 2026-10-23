-- RLS על כל הטבלאות. פרטיות כברירת מחדל: שורה פרטית נראית רק לבעליה.

alter table public.profiles enable row level security;
alter table public.households enable row level security;
alter table public.household_members enable row level security;
alter table public.accounts enable row level security;
alter table public.categories enable row level security;
alter table public.transactions enable row level security;
alter table public.budgets enable row level security;
alter table public.recurring_rules enable row level security;
alter table public.goals enable row level security;
alter table public.settlements enable row level security;

-- profiles: את/ה ובן/בת הזוג
create policy profiles_select on public.profiles for select to authenticated
  using (id = auth.uid() or public.shares_household_with(id));
create policy profiles_update on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

-- households / members: קריאה לחברים; יצירה והצטרפות רק דרך RPC
create policy households_select on public.households for select to authenticated
  using (public.is_household_member(id));
create policy households_update on public.households for update to authenticated
  using (public.is_household_member(id)) with check (public.is_household_member(id));
create policy members_select on public.household_members for select to authenticated
  using (public.is_household_member(household_id));

-- accounts: פרטיים לבעלים
create policy accounts_all on public.accounts for all to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid() and public.is_household_member(household_id));

-- categories: קטלוג משותף לשני בני הזוג
create policy categories_all on public.categories for all to authenticated
  using (public.is_household_member(household_id))
  with check (public.is_household_member(household_id));

-- transactions
create policy transactions_select on public.transactions for select to authenticated
  using (
    owner_id = auth.uid()
    or (visibility = 'shared' and public.is_household_member(household_id))
  );
create policy transactions_insert on public.transactions for insert to authenticated
  with check (
    owner_id = auth.uid()
    and public.is_household_member(household_id)
    and public.is_member_of(household_id, paid_by)
  );
-- עריכה/מחיקה: רק היוצר (אישור דו-צדדי יתווסף בשלב 3)
create policy transactions_update on public.transactions for update to authenticated
  using (owner_id = auth.uid())
  with check (
    owner_id = auth.uid()
    and public.is_household_member(household_id)
    and public.is_member_of(household_id, paid_by)
  );
create policy transactions_delete on public.transactions for delete to authenticated
  using (owner_id = auth.uid());

-- budgets / recurring_rules / goals: אותו עקרון פרטי/משותף
create policy budgets_select on public.budgets for select to authenticated
  using (owner_id = auth.uid() or (visibility = 'shared' and public.is_household_member(household_id)));
create policy budgets_write on public.budgets for all to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid() and public.is_household_member(household_id));

create policy recurring_select on public.recurring_rules for select to authenticated
  using (owner_id = auth.uid() or (visibility = 'shared' and public.is_household_member(household_id)));
create policy recurring_write on public.recurring_rules for all to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid() and public.is_household_member(household_id));

create policy goals_select on public.goals for select to authenticated
  using (owner_id = auth.uid() or (visibility = 'shared' and public.is_household_member(household_id)));
create policy goals_write on public.goals for all to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid() and public.is_household_member(household_id));

-- settlements: ביניכם בלבד
create policy settlements_all on public.settlements for all to authenticated
  using (public.is_household_member(household_id))
  with check (
    public.is_household_member(household_id)
    and public.is_member_of(household_id, paid_by)
    and public.is_member_of(household_id, paid_to)
  );

-- הרשאות: אין גישה ל-anon; authenticated בכפוף ל-RLS
revoke all on all tables in schema public from anon;
revoke all on all functions in schema public from public, anon;
grant select, update on public.profiles to authenticated;
grant select, update on public.households to authenticated;
grant select on public.household_members to authenticated;
grant select, insert, update, delete on
  public.accounts, public.categories, public.transactions, public.budgets,
  public.recurring_rules, public.goals, public.settlements
  to authenticated;
grant execute on function
  public.is_household_member(uuid), public.is_member_of(uuid, uuid),
  public.shares_household_with(uuid), public.create_household(text), public.join_household(text)
  to authenticated;
