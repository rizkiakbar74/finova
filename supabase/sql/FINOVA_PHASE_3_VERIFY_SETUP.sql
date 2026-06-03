-- =========================================================
-- FINOVA PHASE 3 VERIFY SETUP
-- Paste this into Supabase SQL Editor after setup.
-- =========================================================

-- 1. Expected public tables
select
  table_name
from information_schema.tables
where table_schema = 'public'
  and table_name in (
    'profiles',
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
  )
order by table_name;

-- 2. RLS status
select
  schemaname,
  tablename,
  rowsecurity
from pg_tables
where schemaname = 'public'
  and tablename in (
    'profiles',
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
  )
order by tablename;

-- 3. Policy count by table
select
  schemaname,
  tablename,
  count(*) as policy_count
from pg_policies
where schemaname = 'public'
group by schemaname, tablename
order by tablename;

-- 4. Storage bucket status
select
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
from storage.buckets
where id = 'receipts';

-- 5. Storage policies for receipts
select
  schemaname,
  tablename,
  policyname,
  cmd
from pg_policies
where schemaname = 'storage'
  and tablename = 'objects'
  and policyname like 'receipts_%'
order by policyname;

-- 6. Auth trigger exists
select
  trigger_name,
  event_manipulation,
  event_object_schema,
  event_object_table
from information_schema.triggers
where event_object_schema = 'auth'
  and event_object_table = 'users'
  and trigger_name = 'on_auth_user_created';

-- 7. Functions exist
select
  n.nspname as schema,
  p.proname as function_name
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in (
    'handle_new_user',
    'create_default_categories',
    'set_updated_at',
    'validate_transaction_category_type',
    'validate_budget_item_category'
  )
order by p.proname;

-- 8. Backfill check for existing auth users
select
  (select count(*) from auth.users) as auth_users,
  (select count(*) from public.profiles) as profiles,
  (select count(*) from public.user_settings) as user_settings,
  (select count(*) from public.notification_preferences) as notification_preferences;
