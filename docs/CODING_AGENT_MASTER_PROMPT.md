# Panduan Agent Coding Finova

Gunakan panduan ini saat meminta agent coding melanjutkan Finova.

## Konteks

Finova adalah aplikasi keuangan pribadi berbasis Next.js dan Supabase. Antarmuka memakai Bahasa Indonesia dan mata uang IDR.

## Instruksi Utama

- Baca struktur project sebelum mengubah file.
- Jangan ubah scope tanpa alasan jelas.
- Jangan menerima `user_id` dari client.
- Gunakan session Supabase untuk ownership.
- Validasi semua input.
- Jangan expose service role key.
- Jalankan typecheck, lint, dan build setelah perubahan besar.

## Validasi

```bash
npm run typecheck
npm run lint
npm run build
```
