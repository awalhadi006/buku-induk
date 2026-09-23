import { defineConfig, devices } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Playwright Visual Regression Testing Configuration
 * 
 * Runs at 4 viewports × 2 themes = 8 combinations per page
 * Viewports: 375 (mobile), 768 (tablet), 1024 (desktop), 1440 (wide desktop)
 * Themes: bi-light, bi-dark
 */
export default defineConfig({
  testDir: './tests-e2e/visual',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html', { outputFolder: 'playwright-report-visual', open: 'never' }],
    ['list']
  ],
  
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || (process.env.CI ? 'https://bukuinduk.smpallathifah.my.id' : 'http://localhost:4173'),
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    browserName: 'chromium',
    channel: 'chrome',
  },

  // Visual regression specific settings
  expect: {
    toHaveScreenshot: {
      threshold: 0.1,     // 0.1% pixel threshold for pixel matching
      animations: 'disabled',
      // Ignore alpha channel for theme comparison
      ignoreAlpha: true,
    },
  },

  projects: [
    // Mobile (375px) - Light theme
    {
      name: 'mobile-light',
      use: {
        ...devices['iPhone 12'],
        viewport: { width: 375, height: 667 },
        colorScheme: 'light',
        browserName: 'chromium',
        channel: 'chrome',
        defaultBrowserType: 'chromium',
      },
    },
    // Mobile (375px) - Dark theme
    {
      name: 'mobile-dark',
      use: {
        ...devices['iPhone 12'],
        viewport: { width: 375, height: 667 },
        colorScheme: 'dark',
        browserName: 'chromium',
        channel: 'chrome',
        defaultBrowserType: 'chromium',
      },
    },
    // Tablet (768px) - Light theme
    {
      name: 'tablet-light',
      use: {
        ...devices['iPad Mini'],
        viewport: { width: 768, height: 1024 },
        colorScheme: 'light',
        browserName: 'chromium',
        channel: 'chrome',
        defaultBrowserType: 'chromium',
      },
    },
    // Tablet (768px) - Dark theme
    {
      name: 'tablet-dark',
      use: {
        ...devices['iPad Mini'],
        viewport: { width: 768, height: 1024 },
        colorScheme: 'dark',
        browserName: 'chromium',
        channel: 'chrome',
        defaultBrowserType: 'chromium',
      },
    },
    // Desktop (1024px) - Light theme
    {
      name: 'desktop-light',
      use: {
        viewport: { width: 1024, height: 768 },
        colorScheme: 'light',
        browserName: 'chromium',
        channel: 'chrome',
        defaultBrowserType: 'chromium',
      },
    },
    // Desktop (1024px) - Dark theme
    {
      name: 'desktop-dark',
      use: {
        viewport: { width: 1024, height: 768 },
        colorScheme: 'dark',
        browserName: 'chromium',
        channel: 'chrome',
        defaultBrowserType: 'chromium',
      },
    },
    // Wide desktop (1440px) - Light theme
    {
      name: 'wide-light',
      use: {
        viewport: { width: 1440, height: 900 },
        colorScheme: 'light',
        browserName: 'chromium',
        channel: 'chrome',
        defaultBrowserType: 'chromium',
      },
    },
    // Wide desktop (1440px) - Dark theme
    {
      name: 'wide-dark',
      use: {
        viewport: { width: 1440, height: 900 },
        colorScheme: 'dark',
        browserName: 'chromium',
        channel: 'chrome',
        defaultBrowserType: 'chromium',
      },
    },
  ],

  webServer: process.env.CI
    ? undefined
    : {
        command: 'npm run preview',
        url: 'http://localhost:4173',
        reuseExistingServer: true,
        timeout: 300000,
      },

  // Output directory for visual test artifacts
  outputDir: 'test-results-visual',
  
  // Snapshot directory
  snapshotDir: path.join(__dirname, 'tests-e2e', 'visual', 'snapshots'),
  
  });