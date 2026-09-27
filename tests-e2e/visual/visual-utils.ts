import { type Page, type Locator, expect } from '@playwright/test';

/**
 * Visual testing utilities for Buku Induk
 */

/**
 * Mask dynamic content elements before taking screenshot
 * Elements with data-visual-test-mask will be visually masked
 */
export async function maskDynamicContent(page: Page): Promise<void> {
  await page.locator('[data-visual-test-mask]').evaluateAll((elements) => {
    elements.forEach((el) => {
      const htmlEl = el as HTMLElement;
      htmlEl.style.setProperty('background-color', '#f0f0f0', 'important');
      htmlEl.style.setProperty('color', '#f0f0f0', 'important');
      htmlEl.style.setProperty('border-radius', '2px', 'important');
      htmlEl.dataset.visualMasked = 'true';
    });
  });
}

/**
 * Wait for page to be fully loaded and stable
 */
export async function waitForPageStable(page: Page): Promise<void> {
  // Wait for network to be idle
  await page.waitForLoadState('networkidle');
  
  // Wait for any animations to complete
  await page.waitForTimeout(500);
  
  // Wait for fonts to load
  await page.evaluate(() => document.fonts.ready);
}

/**
 * Set theme for visual testing
 */
export async function setTheme(page: Page, theme: 'bi-light' | 'bi-dark'): Promise<void> {
  await page.evaluate((t) => {
    document.documentElement.setAttribute('data-theme', t);
    try {
      localStorage.setItem('theme', t);
    } catch (e) {
      console.warn('Could not set theme in localStorage:', e);
    }
  }, theme);
  
  await page.waitForTimeout(300);
}

/**
 * Try to login as test user
 * Returns true if login succeeded, false otherwise
 */
export async function tryLogin(page: Page, username?: string, password?: string): Promise<boolean> {
  const user = username || process.env.TEST_USERNAME || 'test@bukuinduk.local';
  const pass = password || process.env.TEST_PASSWORD || 'testpassword123';
  
  await page.goto('/login');
  await page.waitForLoadState('networkidle');
  
  await page.fill('input[name="username"]', user);
  await page.fill('input[name="password"]', pass);
  await page.click('button[type="submit"]');
  
  try {
    // Wait for redirect to dashboard
    await page.waitForURL('**/', { timeout: 10000 });
    await waitForPageStable(page);
    return true;
  } catch {
    // Login failed - likely invalid credentials
    console.warn('Login failed - test credentials not available');
    return false;
  }
}

/**
 * Take visual snapshot with proper naming
 */
export async function takeSnapshot(
  page: Page,
  name: string,
  options?: {
    fullPage?: boolean;
    mask?: Locator[];
    threshold?: number;
  }
): Promise<void> {
  await waitForPageStable(page);
  await maskDynamicContent(page);
  
  await expect(page).toHaveScreenshot(`${name}.png`, {
    fullPage: options?.fullPage ?? true,
    threshold: options?.threshold ?? 0.1,
    animations: 'disabled',
    // Mask additional dynamic elements
    mask: options?.mask,
  });
}

/**
 * Navigate to page and wait for content
 */
export async function gotoAndWait(page: Page, url: string): Promise<void> {
  await page.goto(url);
  await page.waitForLoadState('networkidle');
  await waitForPageStable(page);
}