# Panduan Implementasi Finova

Dokumen ini merangkum kondisi implementasi Finova setelah aplikasi siap diuji dan dideploy.

## Status Saat Ini

Finova sudah memiliki fondasi lengkap untuk aplikasi keuangan pribadi:

- Autentikasi Supabase.
- Onboarding pengguna.
- Dompet dan kategori.
- Transaksi pemasukan dan pengeluaran.
- Dashboard real data.
- Anggaran.
- Tujuan tabungan.
- Laporan dan export CSV.
- Pengaturan profil dan preferensi.
- Tagihan rutin dan langganan.
- Notifikasi berbasis aturan.
- Layout responsif mobile dan desktop.
- Panduan deployment.

## Aturan Implementasi

1. Gunakan data dari Supabase session.
2. Jangan menerima `user_id` dari client sebagai dasar ownership.
3. Semua mutation wajib validasi input.
4. Semua data milik pengguna harus dilindungi RLS.
5. Jangan expose service role key ke client.
6. Jangan gunakan data dummy untuk UI production.
7. Mata uang utama aplikasi adalah IDR.
8. Bahasa utama aplikasi adalah Bahasa Indonesia.

## Validasi Teknis

Jalankan:

```bash
npm run typecheck
npm run lint
npm run build
```

Semua command harus berhasil sebelum deployment.

## Uji Manual Wajib

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
-> Ubah pengaturan
-> Keluar
-> Masuk kembali
```

## Uji Keamanan

Buat dua akun berbeda:

- `user_a@example.com`
- `user_b@example.com`

Pastikan User A tidak dapat melihat, mengubah, atau menghapus data User B.

## Deployment

Gunakan:

```text
docs/DEPLOYMENT_GUIDE_FINOVA.md
```

Sebelum launch, pastikan:

- Build production berhasil.
- RLS aktif.
- Bucket `receipts` private.
- Auth redirect URL sesuai domain production.
- Tidak ada secret key di client bundle.
