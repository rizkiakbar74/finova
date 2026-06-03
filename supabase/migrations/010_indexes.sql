-- 010_indexes.sql
-- Query performance indexes for dashboard, reports, filters, and notifications

create index if not exists user_settings_user_idx
on public.user_settings (user_id);

create index if not exists notification_preferences_user_idx
on public.notification_preferences (user_id);

create index if not exists wallets_user_idx
on public.wallets (user_id)
where deleted_at is null;

create index if not exists categories_user_type_idx
on public.categories (user_id, type)
where deleted_at is null;

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

create index if not exists debt_payments_user_debt_idx
on public.debt_payments (user_id, debt_id);

create index if not exists notifications_user_read_created_idx
on public.notifications (user_id, is_read, created_at desc);

create index if not exists notifications_user_metadata_rule_idx
on public.notifications (user_id, ((metadata ->> 'rule')), created_at desc);

create index if not exists report_exports_user_created_idx
on public.report_exports (user_id, created_at desc);

create index if not exists audit_logs_user_created_idx
on public.audit_logs (user_id, created_at desc);
