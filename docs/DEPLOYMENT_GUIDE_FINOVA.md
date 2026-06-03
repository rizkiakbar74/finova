# Panduan Deployment Finova

Finova dapat dideploy ke Vercel dengan backend Supabase production.

## Validasi Sebelum Deploy

```bash
npm run typecheck
npm run lint
npm run build
```

Semua command harus berhasil.

## Environment Vercel

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-publishable-or-anon-key
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-or-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-server-only-service-role-or-secret-key
SUPABASE_SECRET_KEY=your-server-only-service-role-or-secret-key
NEXT_PUBLIC_APP_URL=https://your-production-domain.com
APP_ENV=production
SUPABASE_STORAGE_BUCKET=receipts
```

## Aturan Secret

- Jangan membuat variable `NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY`.
- Jangan membuat variable `NEXT_PUBLIC_SUPABASE_SECRET_KEY`.
- Service role key hanya boleh dipakai di server.

## Setup Supabase

1. Buat project Supabase production.
2. Jalankan `supabase/sql/FINOVA_PHASE_3_NEW_PROJECT_SETUP.sql`.
3. Jalankan `supabase/sql/FINOVA_PHASE_3_VERIFY_SETUP.sql`.
4. Pastikan semua tabel muncul.
5. Pastikan RLS aktif.
6. Pastikan bucket `receipts` private.
7. Pastikan trigger signup dan function default categories tersedia.

## Redirect Auth

Tambahkan URL berikut di Supabase Auth:

```text
https://your-production-domain.com
https://your-production-domain.com/login
https://your-production-domain.com/signup
https://your-production-domain.com/onboarding
https://your-production-domain.com/dashboard
```

Untuk lokal:

```text
http://localhost:3000
http://localhost:3000/login
http://localhost:3000/signup
http://localhost:3000/onboarding
http://localhost:3000/dashboard
```

## Smoke Test Production

```text
Beranda
-> Daftar
-> Onboarding
-> Buat dompet
-> Tambah pemasukan
-> Tambah pengeluaran
-> Dashboard
-> Anggaran
-> Tujuan tabungan
-> Laporan CSV
-> Pengaturan
-> Keluar
-> Masuk kembali
```

## Rollback

Jika smoke test gagal, rollback ke deployment Vercel terakhir yang stabil. Jangan mematikan RLS untuk memperbaiki masalah akses data.
