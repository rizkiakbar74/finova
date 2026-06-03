-- =========================================================
-- FINOVA PHASE 3 NEW SUPABASE PROJECT SETUP
-- Safe for a brand-new Supabase project.
-- Paste this entire file into Supabase SQL Editor and Run.
--
-- IMPORTANT:
-- - This file DOES NOT delete from storage.objects.
-- - This file DOES NOT delete storage.buckets.
-- - This file DOES NOT delete auth.users.
-- - This file creates/updates Finova schema in public.
-- =========================================================

begin;

-- =========================================================
-- 001 Extensions
-- =========================================================
create extension if not exists pgcrypto;

-- =========================================================
-- 002 Helper Functions
-- =========================================================
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- =========================================================
-- 003 Profiles, Settings, Preferences
-- =========================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  plan_type text not null default 'free'
    check (plan_type in ('free', 'premium', 'lifetime')),
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz
);

create table if not exists public.user_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  currency text not null default 'USD',
  language text not null default 'en',
  theme text not null default 'light'
    check (theme in ('light', 'dark', 'system')),
  timezone text,
  date_format text,
  created_at timestamptz not null default now(),
  updated_at timestamptz,
  constraint user_settings_user_unique unique (user_id)
);

create table if not exists public.notification_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  budget_alerts boolean not null default true,
  bill_reminders boolean not null default true,
  goal_milestones boolean not null default true,
  subscription_renewals boolean not null default true,
  security_alerts boolean not null default true,
  quiet_hours_enabled boolean not null default false,
  quiet_hours_start time,
  quiet_hours_end time,
  created_at timestamptz not null default now(),
  updated_at timestamptz,
  constraint notification_preferences_user_unique unique (user_id)
);

-- =========================================================
-- 004 Wallets, Categories
-- =========================================================
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

-- =========================================================
-- 005 Transactions, Attachments
-- =========================================================
create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  wallet_id uuid not null,
  category_id uuid not null,
  type text not null check (type in ('income', 'expense')),
  amount numeric(14,2) not null check (amount > 0),
  transaction_date date not null,
  merchant text,
  notes text,
  status text not null default 'posted'
    check (status in ('posted', 'pending')),
  is_recurring boolean not null default false,
  recurring_bill_id uuid,
  subscription_id uuid,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz,
  constraint transactions_id_user_unique unique (id, user_id),
  constraint transactions_wallet_owner_fk
    foreign key (wallet_id, user_id)
    references public.wallets(id, user_id),
  constraint transactions_category_owner_fk
    foreign key (category_id, user_id)
    references public.categories(id, user_id),
  constraint transactions_merchant_length
    check (merchant is null or char_length(merchant) <= 120),
  constraint transactions_notes_length
    check (notes is null or char_length(notes) <= 500)
);

create table if not exists public.attachments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  transaction_id uuid,
  file_name text not null,
  file_path text not null,
  file_type text not null
    check (file_type in ('png', 'jpg', 'jpeg', 'pdf')),
  file_size integer not null check (file_size > 0 and file_size <= 5242880),
  bucket text not null default 'receipts',
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  constraint attachments_transaction_owner_fk
    foreign key (transaction_id, user_id)
    references public.transactions(id, user_id)
);

-- =========================================================
-- 006 Budgets
-- =========================================================
create table if not exists public.budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  period_type text not null default 'monthly'
    check (period_type in ('monthly')),
  period_start date not null,
  period_end date not null,
  total_limit numeric(14,2),
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz,
  constraint budgets_id_user_unique unique (id, user_id),
  constraint budgets_name_length check (char_length(trim(name)) between 1 and 100),
  constraint budgets_valid_period check (period_start <= period_end)
);

create unique index if not exists budgets_user_period_unique
on public.budgets (user_id, period_start, period_end)
where deleted_at is null;

create table if not exists public.budget_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  budget_id uuid not null,
  category_id uuid not null,
  limit_amount numeric(14,2) not null check (limit_amount > 0),
  alert_threshold numeric(5,2) not null default 80
    check (alert_threshold > 0 and alert_threshold <= 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz,
  constraint budget_items_budget_owner_fk
    foreign key (budget_id, user_id)
    references public.budgets(id, user_id)
    on delete cascade,
  constraint budget_items_category_owner_fk
    foreign key (category_id, user_id)
    references public.categories(id, user_id),
  constraint budget_items_budget_category_unique unique (budget_id, category_id)
);

-- =========================================================
-- 007 Goals
-- =========================================================
create table if not exists public.savings_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  target_amount numeric(14,2) not null check (target_amount > 0),
  target_date date not null,
  icon text,
  color text,
  status text not null default 'active'
    check (status in ('active', 'completed', 'archived')),
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz,
  constraint savings_goals_id_user_unique unique (id, user_id),
  constraint savings_goals_name_length check (char_length(trim(name)) between 1 and 100)
);

create table if not exists public.goal_contributions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  goal_id uuid not null,
  wallet_id uuid,
  amount numeric(14,2) not null check (amount > 0),
  contribution_date date not null,
  notes text,
  created_at timestamptz not null default now(),
  constraint goal_contributions_goal_owner_fk
    foreign key (goal_id, user_id)
    references public.savings_goals(id, user_id)
    on delete cascade,
  constraint goal_contributions_wallet_owner_fk
    foreign key (wallet_id, user_id)
    references public.wallets(id, user_id),
  constraint goal_contributions_notes_length
    check (notes is null or char_length(notes) <= 500)
);

-- =========================================================
-- 008 Recurring Bills, Subscriptions, Debts
-- =========================================================
create table if not exists public.recurring_bills (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  amount numeric(14,2) not null check (amount > 0),
  category_id uuid,
  wallet_id uuid,
  frequency text not null
    check (frequency in ('weekly', 'monthly', 'yearly')),
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
  constraint recurring_bills_name_length
    check (char_length(trim(name)) between 1 and 120)
);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  amount numeric(14,2) not null check (amount > 0),
  billing_cycle text not null
    check (billing_cycle in ('monthly', 'yearly')),
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

-- =========================================================
-- 009 Notifications, Reports, Audit Logs
-- =========================================================
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null
    check (type in ('budget', 'bill', 'goal', 'account', 'security', 'subscription', 'system')),
  severity text not null default 'low'
    check (severity in ('low', 'medium', 'high')),
  title text not null,
  message text not null,
  action_url text,
  metadata jsonb not null default '{}'::jsonb,
  is_read boolean not null default false,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  constraint notifications_title_length
    check (char_length(trim(title)) between 1 and 160),
  constraint notifications_message_length
    check (char_length(trim(message)) between 1 and 500)
);

create table if not exists public.report_exports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  report_type text not null
    check (report_type in (
      'monthly_summary',
      'spending_by_category',
      'cashflow',
      'tax_summary',
      'savings_progress',
      'net_worth'
    )),
  export_format text not null
    check (export_format in ('csv', 'pdf')),
  date_from date not null,
  date_to date not null,
  file_path text,
  status text not null default 'pending'
    check (status in ('pending', 'completed', 'failed')),
  error_message text,
  created_at timestamptz not null default now(),
  constraint report_exports_valid_date_range check (date_from <= date_to)
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint audit_logs_action_length
    check (char_length(trim(action)) between 1 and 100),
  constraint audit_logs_entity_type_length
    check (char_length(trim(entity_type)) between 1 and 100)
);

-- =========================================================
-- 010 Triggers: updated_at
-- =========================================================
do $$
declare
  t text;
begin
  foreach t in array array[
    'profiles',
    'user_settings',
    'notification_preferences',
    'wallets',
    'categories',
    'transactions',
    'budgets',
    'budget_items',
    'savings_goals',
    'recurring_bills',
    'subscriptions',
    'debts'
  ]
  loop
    execute format('drop trigger if exists set_%I_updated_at on public.%I;', t, t);
    execute format('create trigger set_%I_updated_at before update on public.%I for each row execute function public.set_updated_at();', t, t);
  end loop;
end;
$$;

-- =========================================================
-- 011 Validation Functions and Triggers
-- =========================================================
create or replace function public.validate_transaction_category_type()
returns trigger
language plpgsql
as $$
declare
  category_type text;
begin
  select type
  into category_type
  from public.categories
  where id = new.category_id
    and user_id = new.user_id
    and deleted_at is null;

  if category_type is null then
    raise exception 'Invalid category';
  end if;

  if category_type <> new.type then
    raise exception 'Category type must match transaction type';
  end if;

  return new;
end;
$$;

drop trigger if exists validate_transaction_category_type_trigger on public.transactions;
create trigger validate_transaction_category_type_trigger
before insert or update of category_id, type
on public.transactions
for each row
execute function public.validate_transaction_category_type();

create or replace function public.validate_budget_item_category()
returns trigger
language plpgsql
as $$
declare
  category_type text;
begin
  select type
  into category_type
  from public.categories
  where id = new.category_id
    and user_id = new.user_id
    and deleted_at is null;

  if category_type is null then
    raise exception 'Invalid category';
  end if;

  if category_type <> 'expense' then
    raise exception 'Budget item category must be expense type';
  end if;

  return new;
end;
$$;

drop trigger if exists validate_budget_item_category_trigger on public.budget_items;
create trigger validate_budget_item_category_trigger
before insert or update of category_id
on public.budget_items
for each row
execute function public.validate_budget_item_category();

-- =========================================================
-- 012 Auth New User Trigger
-- =========================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', '')
  )
  on conflict (id) do nothing;

  insert into public.user_settings (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  insert into public.notification_preferences (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();

-- Backfill for users created before this setup.
insert into public.profiles (id, full_name)
select id, coalesce(raw_user_meta_data ->> 'full_name', '')
from auth.users
on conflict (id) do nothing;

insert into public.user_settings (user_id)
select id
from auth.users
on conflict (user_id) do nothing;

insert into public.notification_preferences (user_id)
select id
from auth.users
on conflict (user_id) do nothing;

-- =========================================================
-- 013 Default Categories Function
-- =========================================================
create or replace function public.create_default_categories(target_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null or target_user_id <> auth.uid() then
    raise exception 'Not allowed to create categories for another user';
  end if;

  insert into public.categories (user_id, name, type, color, icon, is_default)
  values
    (target_user_id, 'Salary', 'income', '#10B981', 'briefcase', true),
    (target_user_id, 'Freelance', 'income', '#3B82F6', 'laptop', true),
    (target_user_id, 'Business', 'income', '#8B5CF6', 'building', true),
    (target_user_id, 'Bonus', 'income', '#F59E0B', 'gift', true),
    (target_user_id, 'Other Income', 'income', '#6B7280', 'plus-circle', true),

    (target_user_id, 'Housing', 'expense', '#10B981', 'home', true),
    (target_user_id, 'Food & Dining', 'expense', '#F97316', 'utensils', true),
    (target_user_id, 'Transport', 'expense', '#3B82F6', 'car', true),
    (target_user_id, 'Shopping', 'expense', '#EC4899', 'shopping-bag', true),
    (target_user_id, 'Entertainment', 'expense', '#8B5CF6', 'gamepad-2', true),
    (target_user_id, 'Bills & Utilities', 'expense', '#F59E0B', 'bolt', true),
    (target_user_id, 'Health & Fitness', 'expense', '#14B8A6', 'heart-pulse', true),
    (target_user_id, 'Education', 'expense', '#6366F1', 'book-open', true),
    (target_user_id, 'Other', 'expense', '#6B7280', 'more-horizontal', true)
  on conflict do nothing;
end;
$$;

-- =========================================================
-- 014 Indexes
-- =========================================================
create index if not exists wallets_user_idx
on public.wallets (user_id);

create index if not exists categories_user_type_idx
on public.categories (user_id, type);

create index if not exists transactions_user_date_idx
on public.transactions (user_id, transaction_date desc)
where deleted_at is null;

create index if not exists transactions_user_type_idx
on public.transactions (user_id, type)
where deleted_at is null;

create index if not exists transactions_user_category_idx
on public.transactions (user_id, category_id)
where deleted_at is null;

create index if not exists transactions_user_wallet_idx
on public.transactions (user_id, wallet_id)
where deleted_at is null;

create index if not exists budgets_user_period_idx
on public.budgets (user_id, period_start, period_end)
where deleted_at is null;

create index if not exists budget_items_user_budget_idx
on public.budget_items (user_id, budget_id);

create index if not exists savings_goals_user_status_idx
on public.savings_goals (user_id, status)
where deleted_at is null;

create index if not exists goal_contributions_user_goal_idx
on public.goal_contributions (user_id, goal_id);

create index if not exists recurring_bills_user_due_idx
on public.recurring_bills (user_id, next_due_date)
where deleted_at is null;

create index if not exists subscriptions_user_renewal_idx
on public.subscriptions (user_id, next_renewal_date)
where deleted_at is null;

create index if not exists debts_user_status_idx
on public.debts (user_id, status)
where deleted_at is null;

create index if not exists notifications_user_read_created_idx
on public.notifications (user_id, is_read, created_at desc);

create index if not exists notifications_user_metadata_rule_idx
on public.notifications (user_id, ((metadata ->> 'rule')), created_at);

create index if not exists report_exports_user_created_idx
on public.report_exports (user_id, created_at desc);

create index if not exists audit_logs_user_created_idx
on public.audit_logs (user_id, created_at desc);

-- =========================================================
-- 015 RLS
-- =========================================================
alter table public.profiles enable row level security;
alter table public.user_settings enable row level security;
alter table public.notification_preferences enable row level security;
alter table public.wallets enable row level security;
alter table public.categories enable row level security;
alter table public.transactions enable row level security;
alter table public.attachments enable row level security;
alter table public.budgets enable row level security;
alter table public.budget_items enable row level security;
alter table public.savings_goals enable row level security;
alter table public.goal_contributions enable row level security;
alter table public.recurring_bills enable row level security;
alter table public.subscriptions enable row level security;
alter table public.debts enable row level security;
alter table public.debt_payments enable row level security;
alter table public.notifications enable row level security;
alter table public.report_exports enable row level security;
alter table public.audit_logs enable row level security;

drop policy if exists profiles_select_own on public.profiles;
drop policy if exists profiles_update_own on public.profiles;

create policy profiles_select_own
on public.profiles
for select
to authenticated
using (id = auth.uid());

create policy profiles_update_own
on public.profiles
for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

do $$
declare
  t text;
begin
  foreach t in array array[
    'user_settings',
    'notification_preferences',
    'wallets',
    'categories',
    'transactions',
    'attachments',
    'budgets',
    'budget_items',
    'savings_goals',
    'goal_contributions',
    'recurring_bills',
    'subscriptions',
    'debts',
    'debt_payments',
    'notifications',
    'report_exports',
    'audit_logs'
  ]
  loop
    execute format('drop policy if exists %I on public.%I;', t || '_select_own', t);
    execute format('drop policy if exists %I on public.%I;', t || '_insert_own', t);
    execute format('drop policy if exists %I on public.%I;', t || '_update_own', t);
    execute format('drop policy if exists %I on public.%I;', t || '_delete_own', t);

    execute format('create policy %I on public.%I for select to authenticated using (user_id = auth.uid());', t || '_select_own', t);
    execute format('create policy %I on public.%I for insert to authenticated with check (user_id = auth.uid());', t || '_insert_own', t);
    execute format('create policy %I on public.%I for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());', t || '_update_own', t);
    execute format('create policy %I on public.%I for delete to authenticated using (user_id = auth.uid());', t || '_delete_own', t);
  end loop;
end;
$$;

-- =========================================================
-- 016 Grants for Supabase Data API
-- RLS still controls row ownership.
-- =========================================================
grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant usage, select on all sequences in schema public to authenticated;

grant execute on function public.create_default_categories(uuid) to authenticated;
grant execute on function public.set_updated_at() to authenticated;
grant execute on function public.validate_transaction_category_type() to authenticated;
grant execute on function public.validate_budget_item_category() to authenticated;

-- =========================================================
-- 017 Storage Bucket + Storage Policies
-- IMPORTANT:
-- Do NOT delete from storage.objects directly.
-- Do NOT delete from storage.buckets directly.
-- =========================================================
insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'receipts',
  'receipts',
  false,
  5242880,
  array['image/png', 'image/jpeg', 'application/pdf']
)
on conflict (id) do update set
  public = false,
  file_size_limit = 5242880,
  allowed_mime_types = array['image/png', 'image/jpeg', 'application/pdf'];

drop policy if exists receipts_select_own on storage.objects;
drop policy if exists receipts_insert_own on storage.objects;
drop policy if exists receipts_update_own on storage.objects;
drop policy if exists receipts_delete_own on storage.objects;

create policy receipts_select_own
on storage.objects
for select
to authenticated
using (
  bucket_id = 'receipts'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy receipts_insert_own
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'receipts'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy receipts_update_own
on storage.objects
for update
to authenticated
using (
  bucket_id = 'receipts'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'receipts'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy receipts_delete_own
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'receipts'
  and (storage.foldername(name))[1] = auth.uid()::text
);

commit;

-- =========================================================
-- DONE
-- Next: run FINOVA_PHASE_3_VERIFY_SETUP.sql
-- =========================================================
