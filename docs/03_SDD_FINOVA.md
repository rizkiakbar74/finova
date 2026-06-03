# Software Design Document Finova

## Arsitektur

Finova memakai Next.js App Router untuk UI, Supabase untuk auth/database/storage, dan RLS untuk keamanan data.

## Struktur Utama

- `app/` - route, page, layout, dan API route.
- `components/` - komponen UI dan layout.
- `lib/repositories/` - akses data tabel.
- `lib/services/` - logic agregasi dan workflow.
- `lib/validators/` - validasi input.
- `lib/supabase/` - helper client Supabase.
- `supabase/` - migration dan SQL setup.

## Pola Data

- Client mengirim input bisnis.
- Server membaca session Supabase.
- Repository selalu memakai user id dari session.
- RLS menjadi lapisan keamanan terakhir di database.

## Prinsip UI

- Tampilan bersih dan ringan.
- Bahasa Indonesia.
- Mata uang IDR.
- Navigasi konsisten di desktop dan mobile.
