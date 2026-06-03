# Developer Handoff Finova

## Cara Melanjutkan

1. Baca `README.md`.
2. Pastikan `.env.local` terisi.
3. Jalankan validasi:

```bash
npm run typecheck
npm run lint
npm run build
```

## Area Penting

- `app/` untuk route dan API route.
- `components/` untuk UI.
- `lib/services/` untuk workflow dan agregasi.
- `lib/repositories/` untuk akses data.
- `lib/validators/` untuk validasi input.
- `supabase/` untuk SQL dan migration.

## Aturan Coding

- Jangan menerima `user_id` dari client.
- Gunakan session Supabase.
- Validasi semua input mutation.
- Jaga UI tetap Bahasa Indonesia.
- Format uang memakai IDR.
- Jangan menambah data dummy production.
