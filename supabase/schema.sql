-- Jalankan di Supabase SQL Editor (Project > SQL Editor > New query)

create extension if not exists "pgcrypto";

-- Karyawan / device yang dipantau
create table if not exists employees (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text unique,
  device_id text unique not null,      -- android device identifier
  api_key text unique not null default encode(gen_random_bytes(24), 'hex'),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Aktivitas browser (hasil AccessibilityService)
create table if not exists browser_activity (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references employees(id) on delete cascade,
  browser_package text not null,       -- com.android.chrome, org.mozilla.firefox, dst
  url text not null,
  domain text,
  is_search boolean not null default false,
  search_query text,                   -- hasil parse ?q= (Google/Bing/DDG/Yahoo)
  event_type text not null,            -- WINDOW_STATE_CHANGED / WINDOW_CONTENT_CHANGED / dst
  occurred_at timestamptz not null,    -- waktu kejadian di device
  synced_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create index if not exists idx_browser_activity_employee on browser_activity(employee_id, occurred_at desc);

-- Lokasi
create table if not exists location_logs (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references employees(id) on delete cascade,
  latitude double precision not null,
  longitude double precision not null,
  accuracy_m real,
  occurred_at timestamptz not null,
  synced_at timestamptz not null default now()
);
create index if not exists idx_location_employee on location_logs(employee_id, occurred_at desc);

-- Absensi
create table if not exists attendance_logs (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references employees(id) on delete cascade,
  type text not null check (type in ('check_in', 'check_out')),
  latitude double precision,
  longitude double precision,
  photo_url text,
  occurred_at timestamptz not null,
  synced_at timestamptz not null default now()
);
create index if not exists idx_attendance_employee on attendance_logs(employee_id, occurred_at desc);

-- RLS: matikan akses publik langsung, semua akses lewat backend (service role key)
alter table employees enable row level security;
alter table browser_activity enable row level security;
alter table location_logs enable row level security;
alter table attendance_logs enable row level security;
-- Tidak ada policy dibuat -> hanya service_role (dipakai backend) yang bisa akses.
-- Jangan pernah pakai service_role key di client Android/web, hanya di server (Vercel).
