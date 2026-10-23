-- סכמת אפליקציית תקציב זוגית. כל הסכומים באגורות (bigint).

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default '',
  created_at timestamptz not null default now()
);

create table public.households (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'משק הבית',
  -- יום תחילת החודש הפיננסי (חישובים בלבד)
  period_start_day smallint not null default 10 check (period_start_day between 1 and 31),
  invite_code text not null unique default upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8)),
  created_at timestamptz not null default now()
);

create table public.household_members (
  household_id uuid not null references public.households (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (household_id, user_id),
  -- משק בית אחד לכל משתמש
  unique (user_id)
);

create table public.accounts (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null,
  kind text not null check (kind in ('cash', 'bank', 'credit_card')),
  -- יום החיוב בחודש לכרטיס אשראי (ברירת מחדל: 2)
  charge_day smallint check (charge_day between 1 and 31),
  created_at timestamptz not null default now()
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  name text not null,
  icon text not null default 'circle',
  color text not null default '#0f766e',
  kind text not null default 'expense' check (kind in ('expense', 'income')),
  sort_order int not null default 0,
  archived boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  account_id uuid references public.accounts (id) on delete set null,
  amount bigint not null check (amount > 0),
  type text not null check (type in ('income', 'expense')),
  category_id uuid references public.categories (id) on delete set null,
  date date not null default current_date,
  charge_date date,
  visibility text not null default 'private' check (visibility in ('private', 'shared')),
  paid_by uuid not null default auth.uid() references auth.users (id),
  -- אחוז מהסכום שהמשלם עצמו נושא בו (50 = חלוקה שווה)
  split_ratio smallint not null default 50 check (split_ratio between 0 and 100),
  note text,
  installment_index smallint,
  installments_total smallint,
  source text not null default 'manual' check (source in ('manual', 'import')),
  external_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (installments_total is null or (installments_total >= 1 and installment_index between 1 and installments_total))
);

create unique index transactions_owner_external_id_key
  on public.transactions (owner_id, external_id) where external_id is not null;
create index transactions_household_date_idx on public.transactions (household_id, date desc);
create index transactions_owner_date_idx on public.transactions (owner_id, date desc);

-- טבלאות לשלבים מאוחרים (נוצרות כבר עם RLS)
create table public.budgets (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  visibility text not null default 'private' check (visibility in ('private', 'shared')),
  category_id uuid references public.categories (id) on delete cascade,
  period_start date not null,
  amount bigint not null check (amount >= 0),
  created_at timestamptz not null default now()
);

create table public.recurring_rules (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  visibility text not null default 'private' check (visibility in ('private', 'shared')),
  category_id uuid references public.categories (id) on delete set null,
  amount bigint not null check (amount > 0),
  type text not null check (type in ('income', 'expense')),
  day_of_month smallint not null check (day_of_month between 1 and 31),
  note text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.goals (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  visibility text not null default 'shared' check (visibility in ('private', 'shared')),
  name text not null,
  target_amount bigint not null check (target_amount > 0),
  saved_amount bigint not null default 0 check (saved_amount >= 0),
  created_at timestamptz not null default now()
);

create table public.settlements (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  paid_by uuid not null references auth.users (id),
  paid_to uuid not null references auth.users (id),
  amount bigint not null check (amount > 0),
  settled_at timestamptz not null default now()
);

create or replace function public.touch_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger transactions_touch before update on public.transactions
  for each row execute function public.touch_updated_at();
