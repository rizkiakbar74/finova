-- 008_recurring_subscriptions_debts.sql
-- Recurring bills, subscriptions, debts, and debt payments

create table if not exists public.recurring_bills (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  amount numeric(14,2) not null check (amount > 0),
  category_id uuid,
  wallet_id uuid,
  frequency text not null check (frequency in ('weekly', 'monthly', 'yearly')),
  next_due_date date not null,
  reminder_days integer not null default 3 check (reminder_days >= 0),
  auto_pay boolean not null default false,
  status text not null default 'active'
    check (status in ('active', 'paused', 'overdue')),
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz,
  constraint recurring_bills_id_user_unique unique (id, user_id),
  constraint recurring_bills_category_owner_fk
    foreign key (category_id, user_id)
    references public.categories(id, user_id),
  constraint recurring_bills_wallet_owner_fk
    foreign key (wallet_id, user_id)
    references public.wallets(id, user_id),
  constraint recurring_bills_name_length check (char_length(trim(name)) between 1 and 120)
);

drop trigger if exists set_recurring_bills_updated_at on public.recurring_bills;
create trigger set_recurring_bills_updated_at
before update on public.recurring_bills
for each row execute function public.set_updated_at();

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  amount numeric(14,2) not null check (amount > 0),
  billing_cycle text not null check (billing_cycle in ('monthly', 'yearly')),
  next_renewal_date date not null,
  category text,
  auto_renew boolean not null default true,
  status text not null default 'active'
    check (status in ('active', 'cancelled', 'paused')),
  unused_flag boolean not null default false,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz,
  constraint subscriptions_id_user_unique unique (id, user_id),
  constraint subscriptions_name_length check (char_length(trim(name)) between 1 and 120)
);

drop trigger if exists set_subscriptions_updated_at on public.subscriptions;
create trigger set_subscriptions_updated_at
before update on public.subscriptions
for each row execute function public.set_updated_at();

create table if not exists public.debts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  initial_amount numeric(14,2) not null check (initial_amount > 0),
  current_balance numeric(14,2) not null check (current_balance >= 0),
  apr numeric(5,2) not null default 0 check (apr >= 0),
  minimum_payment numeric(14,2) not null default 0 check (minimum_payment >= 0),
  payoff_strategy text not null default 'custom'
    check (payoff_strategy in ('avalanche', 'snowball', 'custom')),
  status text not null default 'active'
    check (status in ('active', 'paid', 'archived')),
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz,
  constraint debts_id_user_unique unique (id, user_id),
  constraint debts_name_length check (char_length(trim(name)) between 1 and 120)
);

drop trigger if exists set_debts_updated_at on public.debts;
create trigger set_debts_updated_at
before update on public.debts
for each row execute function public.set_updated_at();

create table if not exists public.debt_payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  debt_id uuid not null,
  amount numeric(14,2) not null check (amount > 0),
  payment_date date not null,
  notes text,
  created_at timestamptz not null default now(),
  constraint debt_payments_debt_owner_fk
    foreign key (debt_id, user_id)
    references public.debts(id, user_id)
    on delete cascade,
  constraint debt_payments_notes_length
    check (notes is null or char_length(notes) <= 500)
);
