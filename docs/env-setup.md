# Environment Variable Setup for Cloudflare Pages

## Overview

This document explains the separation of environment variables in Cloudflare Pages for the **Buku Induk Santri** application:

- **Public variables** (`PUBLIC_*`): Dapat diakses di client bundle (browser) dan di-bake saat build time. Digunakan untuk data yang aman terpublikasi seperti URL publik, kunci anonim, atau konfigurasi umum.
- **Private variables** (tanpa prefix `PUBLIC_`): Hanya tersedia di runtime server-side (Cloudflare Workers). Digunakan untuk secret seperti API key, client secret, atau konfigurasi sensitif.

## Rules

### Public Variables (PUBLIC_*)
- **Prefix**: Harus menggunakan `PUBLIC_` sebagai prefix
- **Akses**: 
  - `$env/static/public` dalam SvelteKit (tersedia di client bundle)
  - Di Cloudflare Pages: **Build environment variables**
- **Contoh**:
  - `PUBLIC_SUPABASE_URL=https://your-project.supabase.co`
  - `PUBLIC_SUPABASE_ANON_KEY=public-anon-key`
- **Catatan**: 
  - Jangan masukkan secret (password, API key rahasia, dll) ke variabel ini
  - Semua variabel ini akan terlihat di bundle client (lihat `dist/` folder)

### Private Variables (No Prefix)
- **Prefix**: Tidak boleh menggunakan `PUBLIC_` prefix
- **Akses**:
  - `$env/dynamic/private` dalam SvelteKit (hanya tersedia di server runtime)
  - Di Cloudflare Pages: **Production environment variables**
- **Contoh**:
  - `GOOGLE_CLIENT_ID=your-google-client-id`
  - `GOOGLE_CLIENT_SECRET=your-google-client-secret`
  - `GOOGLE_REDIRECT_URI=https://your-domain.com/auth/google/callback`
  - `SUPABASE_SERVICE_ROLE_KEY=your-service-role-secret-key`
- **Catatan**:
  - Variabel ini **tidak** tersedia di client bundle
  - Jangan commit secret ke repository
  - Gunakan Cloudflare Dashboard → Settings → Environment Variables → Production

## Configuration Flow

1. **Local Development**:
   - Gunakan `.env` file (buat sendiri jika tidak ada `.env.example`)
   - Variabel publik: bisa diisi di `.env` atau `.env.local`
   - Variabel privat: **tidak bisa diisi di `.env`**, hanya bisa diakses di server-side

2. **Cloudflare Pages Build**:
   - Variabel publik: di-set di **Build environment variables**
   - Variabel privat: di-set di **Production environment variables**
   - Pastikan semua variabel yang diperlukan tersedia di **Build** (untuk SvelteKit build-time)

3. **Runtime (Production)**:
   - Variabel publik: tersedia di client + server
   - Variabel privat: hanya tersedia di server (Cloudflare Workers)

## Security Note

- **Never commit secrets** to version control
- **Always use `.gitignore`** for `.env` files
- **Audit regularly** for exposed secrets via GitHub Secret scanning
- **Rotate secrets** immediately if compromise suspected

## Example .env file structure

```env
# PUBLIC (safe to commit)
PUBLIC_SUPABASE_URL=https://your-project.supabase.co
PUBLIC_SUPABASE_ANON_KEY=public-anon-key

# PRIVATE (DO NOT COMMIT - add to .gitignore)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=https://your-domain.com/auth/google/callback
SUPABASE_SERVICE_ROLE_KEY=your-service-role-secret-key
```