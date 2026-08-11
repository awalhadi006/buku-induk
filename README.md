# Buku Induk Santri

Website master data santri (arsip buku induk digital) untuk pesantren. Dokumentasi rancangan: [`PRD.md`](./PRD.md), glosarium domain [`CONTEXT.md`](./CONTEXT.md), keputusan arsitektur [`docs/adr/`](./docs/adr/).

## Stack

- **Frontend**: SvelteKit + TypeScript, Tailwind CSS v4 + daisyUI (multi-tema)
- **Hosting**: Cloudflare Pages (`@sveltejs/adapter-cloudflare`)
- **Backend/data**: Supabase (Postgres + Auth + Storage + RLS)

## Pengembangan

```sh
npm run dev        # dev server
npm run check      # type-check
npm run build      # build untuk Cloudflare Pages
npm run preview    # preview build lokal via wrangler
```

## Deploy

Push ke GitHub; Cloudflare Pages terhubung ke repo, output dir `.svelte-kit/cloudflare`.