import path from 'path';
import { defineConfig } from 'vitest/config';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
  plugins: [svelte()],
  test: {
    globals: true,
    environment: 'jsdom',
    exclude: ['**/node_modules/**', '**/error/**', '**/dist/**', 'tests-e2e/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      include: ['src/lib/**/*.{ts,js}'],
      exclude: ['src/lib/types.ts', 'src/lib/changelog.ts', 'src/lib/index.ts', 'src/lib/supabase.ts'],
    },
  },
  resolve: {
    alias: {
      '$lib': path.resolve('src/lib'),
      '$app': path.resolve('src/app'),
    },
  },
});
