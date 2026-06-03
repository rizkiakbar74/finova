-- 011_rls_policies.sql
-- Row Level Security policies for all user-owned Finova tables

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

-- Profiles use id instead of user_id.
drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own
on public.profiles
for select
to authenticated
using (id = auth.uid());

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own
on public.profiles
for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

-- Helper block for user_id-owned tables.
do $$
declare
  table_name text;
begin
  foreach table_name in array array[
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
    execute format('drop policy if exists %I on public.%I', table_name || '_select_own', table_name);
    execute format('drop policy if exists %I on public.%I', table_name || '_insert_own', table_name);
    execute format('drop policy if exists %I on public.%I', table_name || '_update_own', table_name);
    execute format('drop policy if exists %I on public.%I', table_name || '_delete_own', table_name);

    execute format('
      create policy %I on public.%I
      for select
      to authenticated
      using (user_id = auth.uid())', table_name || '_select_own', table_name);

    execute format('
      create policy %I on public.%I
      for insert
      to authenticated
      with check (user_id = auth.uid())', table_name || '_insert_own', table_name);

    execute format('
      create policy %I on public.%I
      for update
      to authenticated
      using (user_id = auth.uid())
      with check (user_id = auth.uid())', table_name || '_update_own', table_name);

    execute format('
      create policy %I on public.%I
      for delete
      to authenticated
      using (user_id = auth.uid())', table_name || '_delete_own', table_name);
  end loop;
end;
$$;
