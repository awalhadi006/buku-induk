import { chromium, type FullConfig } from '@playwright/test';

/**
 * Global setup for visual regression tests
 * Runs once before all visual tests
 */
export default async function globalSetup(config: FullConfig) {
  console.log('🎭 Visual regression tests: global setup starting...');
  
  // Launch browser to verify it works
  const browser = await chromium.launch();
  await browser.close();
  
  console.log('✅ Visual regression tests: global setup complete');
}