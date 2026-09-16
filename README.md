# Monitoring backend + dashboard (Next.js + Supabase + Vercel)

Backend penerima sync data dari Android app (browser activity, lokasi, absensi) + web dashboard buat lihat datanya. Didesain buat demo/prototype dulu.

## 1. Setup Supabase

1. Bikin project baru di https://supabase.com
2. Buka **SQL Editor**, jalankan isi file `supabase/schema.sql`
3. Buka **Project Settings > API**, catat:
   - `Project URL` → jadi `NEXT_PUBLIC_SUPABASE_URL`
   - `service_role` key (bukan `anon` key!) → jadi `SUPABASE_SERVICE_ROLE_KEY` 
4. Daftarkan minimal 1 karyawan/device dulu buat testing — di **Table Editor > employees**, insert row manual: isi `name`, `email`, `device_id` (bebas, misal `"device-test-1"`). Kolom `api_key` otomatis ter-generate.

## 2. Jalanin lokal

```bash
npm install
cp .env.example .env.local   # isi dengan value dari Supabase
npm run dev
```

Buka `http://localhost:3000/dashboard`.

## 3. Deploy ke Vercel

```bash
npm i -g vercel
vercel
```

Atau connect repo GitHub-nya lewat vercel.com/new. Set environment variables yang sama seperti `.env.example` di **Project Settings > Environment Variables** di Vercel.

## 4. Alur dari Android

1. Android app panggil `POST /api/auth/device` dengan `{ "device_id": "device-test-1" }` sekali di awal → dapat `api_key`, simpan di local storage/SharedPreferences device tsb.
2. Setiap sync (misal via WorkManager tiap 5-15 menit), Android kirim batch data yang belum ke-sync:
   - `POST /api/sync/browser-activity` — header `Authorization: Bearer <api_key>`, body `{ "entries": [...] }`
   - `POST /api/sync/location` — sama pola-nya
   - `POST /api/sync/attendance` — 1 event per request (check_in/check_out)
3. Kalau response gagal (network error / 5xx), Android tetap simpan row di SQLite lokal dengan flag `synced = 0`, retry di siklus sync berikutnya.

## 5. Yang masih perlu ditambah sebelum production (bukan cuma demo)

- **Auth dashboard**: sekarang halaman `/dashboard` belum ada login sama sekali — semua orang yang tahu URL bisa lihat data karyawan. Minimal tambah password gate atau proper auth (NextAuth / Supabase Auth) sebelum dipakai beneran.
- **Rate limiting** di endpoint sync, supaya device yang salah konfigurasi gak spam insert.
- **Rotasi api_key** per device, bukan static selamanya.
- **Consent & kebijakan privasi**: karena ini monitoring device karyawan (browser activity + lokasi), pastikan ada persetujuan tertulis dan kebijakan yang jelas ke karyawan sesuai regulasi ketenagakerjaan/privasi yang berlaku di wilayah kamu.
- **Retensi data**: tentuin berapa lama data disimpan sebelum di-purge.

## Struktur folder

```
monitoring-backend/
  app/
    api/
      auth/device/route.ts          # klaim api_key untuk device terdaftar
      sync/browser-activity/route.ts
      sync/location/route.ts
      sync/attendance/route.ts
      dashboard/summary/route.ts
      dashboard/browser-activity/route.ts
    dashboard/page.tsx               # halaman dashboard web
    layout.tsx
    globals.css
  lib/
    supabase.ts                      # service-role client (server only)
    auth.ts                          # validasi api_key dari Android
  supabase/schema.sql                # jalankan ini di Supabase SQL Editor
```
