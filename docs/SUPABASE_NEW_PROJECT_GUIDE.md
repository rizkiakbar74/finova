# Panduan Setup Supabase Project Baru

Gunakan panduan ini untuk menyiapkan backend Finova pada project Supabase baru.

## Ambil Key Project

Buka Supabase:

```text
Project Settings -> API
```

Ambil:

- Project URL.
- Publishable atau anon key.
- Secret atau service role key.

## Isi Environment

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=public_key
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=public_key
SUPABASE_SERVICE_ROLE_KEY=server_only_secret_key
SUPABASE_SECRET_KEY=server_only_secret_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
APP_ENV=development
SUPABASE_STORAGE_BUCKET=receipts
```

## Jalankan SQL

Di SQL Editor, jalankan:

```text
supabase/sql/FINOVA_PHASE_3_NEW_PROJECT_SETUP.sql
```

Lalu verifikasi:

```text
supabase/sql/FINOVA_PHASE_3_VERIFY_SETUP.sql
```

## Checklist

- Semua tabel Finova tersedia.
- RLS aktif.
- Policy ownership tersedia.
- Bucket `receipts` private.
- Trigger signup aktif.
- Function default categories aktif.
