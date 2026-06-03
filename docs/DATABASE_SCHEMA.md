# Skema Database Finova

Database Finova memakai Supabase PostgreSQL dengan RLS aktif pada semua tabel milik pengguna.

## Tabel Utama

- `profiles`
- `user_settings`
- `notification_preferences`
- `wallets`
- `categories`
- `transactions`
- `attachments`
- `budgets`
- `budget_items`
- `savings_goals`
- `goal_contributions`
- `recurring_bills`
- `subscriptions`
- `notifications`
- `report_exports`
- `audit_logs`

## Ownership

Tabel milik pengguna memakai kolom `user_id`. Tabel `profiles` memakai `id` yang sama dengan auth user id.

## RLS

Policy wajib memastikan:

```sql
user_id = auth.uid()
```

Untuk `profiles`:

```sql
id = auth.uid()
```

## Storage

Bucket `receipts` wajib private. Path object harus diawali user id agar policy storage dapat membatasi akses per pengguna.
