# 0001 — Stack: SvelteKit + Cloudflare Pages + Supabase

Untuk Buku Induk Santri dipilih SvelteKit (TypeScript) untuk frontend, Cloudflare Pages untuk hosting/deploy, dan Supabase (Postgres + Auth + Storage + RLS) untuk database, autentikasi, dan penyimpanan berkas.

Dipilih karena dukungan kelas-pertama Cloudflare Pages di SvelteKit (`adapter-cloudflare`) meniadakan batasan runtime edge yang dipaksakan adapter pihak ketiga. Supabase memberi keamanan langsung di database via Row Level Security.

Alternatif yang ditolak:
- **Next.js + `next-on-pages`** — batasan runtime dan kompleksitas adapter pada Cloudflare Pages yang sering menjebak.
- **Django/Laravel** — kokoh tapi tidak natural untuk deploy di Cloudflare Pages tanpa server.
- **Self-host lokal** — ditolak user; aplikasi harus bisa diakses dari mana saja.

SSO lintas aplikasi guru direncanakan di fase 2; autentikasi tetap lewat Supabase Auth sekarang dan diganti belakangan tanpa merombak aplikasi.