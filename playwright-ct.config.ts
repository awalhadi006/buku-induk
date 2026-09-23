import { defineConfig, devices } from '@playwright/experimental-ct-svelte';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  testDir: 'src/lib/components',
  testMatch: /.*\.spec\.ts/,
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: 'line',
  timeout: 120000,
  use: {
    trace: 'on-first-retry',
    ctViteConfig: {
      configFile: path.resolve(__dirname, 'vite.ct.config.ts'),
    },
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  expect: {
    toHaveScreenshot: {
      maxDiffPixels: 100,
    },
  },
});