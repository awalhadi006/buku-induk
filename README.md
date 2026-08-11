# Buku Induk Santri

Website master data santri (arsip buku induk digital) untuk pesantren. Dokumentasi: [`PRD.md`](./PRD.md), [`CONTEXT.md`](./CONTEXT.md), [`docs/adr/`](./docs/adr/).

## Stack

- **Frontend**: SvelteKit + TypeScript, Tailwind CSS v4 + daisyUI (multi-tema)
- **Hosting**: Cloudflare Pages (`@sveltejs/adapter-cloudflare`)
- **Backend/data**: Supabase (Postgres + Auth + Storage + RLS)

## Pengembangan lokal

1. Salin `.env.example` ke `.env`, sesuaikan `PUBLIC_SUPABASE_URL` dan `PUBLIC_SUPABASE_ANON_KEY`.
2. Jalankan migrasi di Supabase Dashboard → SQL Editor: salin isi `supabase/migrations/0001_init.sql` dan `0002_rekap.sql`.
3. Jalankan `npm run dev -- --open`.

## Deploy

Cloudflare Pages terhubung ke repo GitHub. Variabel env (di Pages → Settings → Environment):
- `PUBLIC_SUPABASE_URL`
- `PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (secret, untuk import/audit log)

## Keamanan

- Kunci `sb_publishable_...` aman di repo publik (didesain begitu).
- Data santri di database Supabase (dengan RLS), tidak di bundle/repo.
- Semua operasi yang mengakses data sensitif di server-side (hooks, loaders).

## Status

v0.1: login, auth, dashboard rekap, daftar santri sederhana. Fitur CRUD santri/wali, import Excel, dan konfigurasi masuk di tahap selanjutnya.