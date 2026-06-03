# Finova

Finova adalah aplikasi keuangan pribadi berbasis Next.js dan Supabase untuk mencatat pemasukan, pengeluaran, dompet, kategori, anggaran, tujuan tabungan, laporan, tagihan rutin, langganan, dan notifikasi.

## Ringkasan

- Frontend: Next.js App Router, TypeScript, Tailwind CSS.
- Backend: Supabase Auth, Database, RLS, dan Storage private.
- Mata uang utama: IDR.
- Bahasa antarmuka: Indonesia.
- Data keuangan hanya memakai data pengguna aktif, bukan data dummy production.

## Menjalankan Lokal

```bash
npm install
cp .env.example .env.local
npm run dev
```

Buka:

```text
http://localhost:3000
```

## Environment

Isi `.env.local` dengan nilai project Supabase:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=public_or_publishable_key
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=public_or_publishable_key
SUPABASE_SERVICE_ROLE_KEY=server_only_secret_key
SUPABASE_SECRET_KEY=server_only_secret_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
APP_ENV=development
SUPABASE_STORAGE_BUCKET=receipts
```

Jangan pernah menaruh service role atau secret key di variable `NEXT_PUBLIC_*`.

## Validasi

```bash
npm run typecheck
npm run lint
npm run build
```

## Setup Supabase

Jalankan SQL berikut di Supabase SQL Editor untuk project baru:

```text
supabase/sql/FINOVA_PHASE_3_NEW_PROJECT_SETUP.sql
```

Lalu verifikasi:

```text
supabase/sql/FINOVA_PHASE_3_VERIFY_SETUP.sql
```

## Alur Uji Utama

```text
Daftar akun
-> Onboarding
-> Buat dompet pertama
-> Tambah pemasukan
-> Tambah pengeluaran
-> Cek dashboard
-> Buat anggaran
-> Buat tujuan tabungan
-> Export laporan CSV
-> Keluar
-> Masuk kembali
```

## Aturan Keamanan

```text
No RLS, no launch.
```

Semua tabel milik pengguna wajib memakai RLS berbasis `auth.uid()`.
