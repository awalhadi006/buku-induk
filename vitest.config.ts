import path from 'path';
import { defineConfig, mergeConfig } from 'vitest/config';
import viteConfig from './vite.config.ts';

export default mergeConfig(viteConfig, defineConfig({
  test: {
    globals: true,
    environment: 'happy-dom',
    exclude: ['**/node_modules/**', '**/error/**', '**/dist/**', 'tests-e2e/**'],
    setupFiles: ['src/test/setup.ts'],
    testTimeout: 10000,
    hookTimeout: 5000,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      include: ['src/lib/**/*.{ts,js}'],
      exclude: ['src/lib/types.ts', 'src/lib/changelog.ts', 'src/lib/index.ts', 'src/lib/supabase.ts', 'src/lib/components/**/*.test.ts'],
    },
  },
  resolve: {
    alias: {
      '$lib': path.resolve('src/lib'),
      '$app': path.resolve('src/app'),
    },
  },
}));