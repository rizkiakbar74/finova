# Spesifikasi API Finova

Semua API route memakai session Supabase. Client tidak boleh mengirim `user_id` untuk menentukan ownership.

## Auth

- `GET /api/auth/me` - membaca profil user aktif.
- `POST /api/auth/onboarding` - menyelesaikan onboarding.

## Data Keuangan

- `GET /api/wallets`
- `POST /api/wallets`
- `PATCH /api/wallets/[id]`
- `DELETE /api/wallets/[id]`
- `GET /api/categories`
- `POST /api/categories`
- `PATCH /api/categories/[id]`
- `DELETE /api/categories/[id]`
- `GET /api/transactions`
- `POST /api/transactions`
- `PATCH /api/transactions/[id]`
- `DELETE /api/transactions/[id]`

## Planning

- `/api/budgets`
- `/api/budget-items`
- `/api/goals`
- `/api/goal-contributions`
- `/api/recurring-bills`
- `/api/subscriptions`

## Laporan dan Notifikasi

- `/api/dashboard/summary`
- `/api/dashboard/cashflow`
- `/api/dashboard/spending-category`
- `/api/reports/export`
- `/api/notifications`

## Format Response

```json
{
  "success": true,
  "data": {}
}
```

Untuk error:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Input tidak valid."
  }
}
```
