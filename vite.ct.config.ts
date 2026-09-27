import { svelte } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [
    svelte({
      compilerOptions: {
        runes: true
      }
    })
  ],
  resolve: {
    alias: {
      '$lib': path.resolve(__dirname, 'src/lib'),
      '$app': path.resolve(__dirname, 'src/app'),
    },
  },
  css: {
    devSourcemap: false,
  },
});