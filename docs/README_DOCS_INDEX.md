# Indeks Dokumentasi Finova

Dokumentasi ini berisi ringkasan kebutuhan produk, desain teknis, setup Supabase, checklist pengujian, dan panduan deployment.

## Dokumen Utama

- `01_PRD_FINOVA.md` - kebutuhan produk.
- `02_SRS_FINOVA.md` - kebutuhan sistem.
- `03_SDD_FINOVA.md` - desain teknis.
- `DATABASE_SCHEMA.md` - struktur database.
- `API_SPEC.md` - kontrak API.
- `SUPABASE_NEW_PROJECT_GUIDE.md` - setup Supabase.
- `DEPLOYMENT_GUIDE_FINOVA.md` - deployment production.
- `TESTING_CHECKLIST.md` - checklist pengujian.
- `LAUNCH_CHECKLIST.md` - checklist sebelum launch.

## Prinsip

- Data pengguna harus terpisah per akun.
- Semua query dan mutation memakai Supabase session.
- Client tidak boleh mengirim `user_id` sebagai dasar ownership.
- Service role key hanya boleh dipakai di server.
