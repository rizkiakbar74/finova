# Scope Lock Finova

Dokumen ini membatasi ruang lingkup Finova agar produk tetap fokus dan aman.

## Masuk Scope

- Autentikasi pengguna.
- Onboarding dengan mata uang IDR.
- Dompet dan kategori.
- Transaksi pemasukan dan pengeluaran.
- Dashboard real data.
- Anggaran dan tujuan tabungan.
- Laporan dan export CSV.
- Pengaturan profil dan notifikasi.
- Tagihan rutin dan langganan.
- Notifikasi berbasis aturan.
- Deployment ke Vercel dan Supabase.

## Di Luar Scope

- Koneksi rekening bank otomatis.
- Import mutasi bank otomatis.
- AI/LLM untuk insight finansial.
- Multi-tenant organisasi.
- Payroll, invoice, atau akuntansi bisnis penuh.

## Aturan Keamanan

- Semua data pengguna wajib memakai ownership berbasis session.
- Client tidak boleh menentukan `user_id`.
- Service role key hanya untuk server.
- RLS wajib aktif sebelum launch.
