# Checklist Pengujian Finova

## Automated Test

```bash
npm run typecheck
npm run lint
npm run build
```

## Auth

- User bisa daftar.
- User bisa masuk.
- User bisa keluar.
- User tanpa login tidak bisa membuka route aplikasi.
- User yang belum onboarding diarahkan ke onboarding.

## Data Keuangan

- Dompet bisa dibuat dan diedit.
- Kategori bisa dibuat dan diedit.
- Transaksi pemasukan bisa dibuat.
- Transaksi pengeluaran bisa dibuat.
- Dashboard menghitung saldo, pemasukan, pengeluaran, dan arus kas dengan benar.
- Anggaran hanya menghitung transaksi expense.
- Tujuan tabungan menghitung kontribusi dengan benar.
- CSV export hanya berisi data user aktif.

## Keamanan

- User A tidak bisa mengakses data User B.
- API route menolak request tanpa session.
- Service role key tidak ada di client.
- Bucket `receipts` tidak public.

## Mobile

- Bottom nav tidak menutup konten penting.
- Tombol keluar tetap mudah diakses.
- Tidak ada horizontal overflow.
