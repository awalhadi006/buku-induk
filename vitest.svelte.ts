import path from 'path';
import { defineConfig } from 'vitest/config';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
  plugins: [svelte({ compilerOptions: { runes: true } })],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: [],
    pool: 'vmThreads',
  },
  resolve: {
    alias: {
      '$lib': path.resolve('src/lib'),
      '$app': path.resolve('src/app'),
    },
  },
});