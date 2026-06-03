# System Requirements Specification Finova

## Kebutuhan Fungsional

- Sistem harus mendukung signup, login, dan logout.
- Sistem harus membuat profil pengguna setelah signup.
- Sistem harus memandu onboarding sebelum dashboard dapat dipakai.
- Sistem harus menyimpan dompet, kategori, transaksi, anggaran, tujuan tabungan, laporan, notifikasi, tagihan rutin, dan langganan.
- Sistem harus menghitung saldo, pemasukan, pengeluaran, arus kas, dan progres anggaran dari data nyata.
- Sistem harus mengekspor laporan dalam format CSV.

## Kebutuhan Non-Fungsional

- Aplikasi harus responsif di mobile dan desktop.
- Aplikasi harus memakai TypeScript strict.
- Aplikasi harus lolos typecheck, lint, dan production build.
- Aplikasi harus melindungi data pengguna dengan RLS.
- Aplikasi harus memakai IDR sebagai mata uang utama.

## Kebutuhan Keamanan

- Semua route aplikasi harus terlindungi.
- Semua query data pengguna harus berdasarkan session.
- Secret key tidak boleh masuk client bundle.
- Bucket storage receipt harus private.
