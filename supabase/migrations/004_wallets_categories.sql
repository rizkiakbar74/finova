-- 004_wallets_categories.sql
-- Wallets/accounts and income/expense categories

create table if not exists public.wallets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  type text not null
    check (type in ('cash', 'bank', 'e_wallet', 'credit_card', 'investment', 'other')),
  initial_balance numeric(14,2) not null default 0,
  currency text not null default 'USD',
  color text,
  icon text,
  is_archived boolean not null default false,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz,
  constraint wallets_id_user_unique unique (id, user_id),
  constraint wallets_name_length check (char_length(trim(name)) between 1 and 80)
);

drop trigger if exists set_wallets_updated_at on public.wallets;
create trigger set_wallets_updated_at
before update on public.wallets
for each row execute function public.set_updated_at();

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  type text not null check (type in ('income', 'expense')),
  color text,
  icon text,
  is_default boolean not null default false,
  is_archived boolean not null default false,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz,
  constraint categories_id_user_unique unique (id, user_id),
  constraint categories_name_length check (char_length(trim(name)) between 1 and 60)
);

create unique index if not exists categories_user_type_name_unique
on public.categories (user_id, type, lower(name))
where deleted_at is null;

drop trigger if exists set_categories_updated_at on public.categories;
create trigger set_categories_updated_at
before update on public.categories
for each row execute function public.set_updated_at();
