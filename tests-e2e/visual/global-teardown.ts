import { type FullConfig } from '@playwright/test';

/**
 * Global teardown for visual regression tests
 * Runs once after all visual tests
 */
export default async function globalTeardown(config: FullConfig) {
  console.log('🎭 Visual regression tests: global teardown complete');
}