# Checklist Launch Finova

Finova tidak boleh launch jika ada blocker berikut.

## Blocker

- RLS tidak aktif.
- User dapat melihat data user lain.
- Dashboard salah hitung.
- Anggaran salah hitung.
- Tujuan tabungan salah hitung.
- Export CSV bocor data user lain.
- Protected route bisa dibuka tanpa login.
- Service role key terekspos ke browser.
- Bucket `receipts` public.
- Mobile bottom navigation menutup aksi penting.

## Checklist Production

- Build production berhasil.
- Environment Vercel benar.
- Auth redirect URL benar.
- Supabase SQL setup berhasil.
- Supabase verify SQL berhasil.
- Smoke test production lulus.
- RLS User A/B test lulus.

## Smoke Test

```text
Daftar
-> Onboarding
-> Buat dompet
-> Tambah pemasukan
-> Tambah pengeluaran
-> Cek dashboard
-> Buat anggaran
-> Buat tujuan tabungan
-> Export CSV
-> Keluar
-> Masuk kembali
```
