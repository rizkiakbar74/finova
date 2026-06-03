# Supabase Setup — Finova Phase 3

Phase 3 adds the database schema, indexes, triggers, Row Level Security policies, storage bucket configuration, default category function, and verification SQL.

## Migration Order

Run files in `supabase/migrations` in this order:

1. `001_extensions.sql`
2. `002_core_functions.sql`
3. `003_profiles_settings.sql`
4. `004_wallets_categories.sql`
5. `005_transactions_attachments.sql`
6. `006_budgets.sql`
7. `007_goals.sql`
8. `008_recurring_subscriptions_debts.sql`
9. `009_notifications_reports_audit.sql`
10. `010_indexes.sql`
11. `011_rls_policies.sql`
12. `012_storage_policies.sql`
13. `013_default_categories.sql`
14. `014_backfill_existing_auth_users.sql`

For Supabase SQL Editor, you may paste `supabase/sql/RUN_ALL_PHASE_3.sql` into the editor and run it once on a clean project.

## Verify

After running migrations, run:

```text
supabase/sql/VERIFY_PHASE_3.sql
```

## Important

SQL Editor verification is not enough to prove RLS, because SQL Editor uses elevated privileges. You must test RLS using real authenticated users through the app or Supabase client.

## Current Phase Boundary

Phase 3 does not implement wallet/category/transaction UI. It only prepares database and security foundation.

Real onboarding with first wallet and default categories is Phase 5.
