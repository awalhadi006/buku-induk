import { test, expect } from '@playwright/test';

test('security headers are present on homepage', async ({ page }) => {
  await page.goto('/');

  const response = await page.waitForResponse(resp => resp.url().endsWith('/') && resp.status() === 200);
  const headers = response.headers();

  // Check Content Security Policy
  expect(headers['content-security-policy']).toContain("default-src 'self'");
  expect(headers['content-security-policy']).toContain("script-src 'self' 'unsafe-inline'");
  expect(headers['content-security-policy']).toContain("style-src 'self' 'unsafe-inline'");
  expect(headers['content-security-policy']).toContain("font-src 'self'");
  expect(headers['content-security-policy']).toContain("img-src 'self'");
  expect(headers['content-security-policy']).toContain("connect-src 'self'");
  expect(headers['content-security-policy']).toContain("frame-src https://accounts.google.com");
  expect(headers['content-security-policy']).toContain("frame-ancestors 'none'");

  // Check HSTS
  expect(headers['strict-transport-security']).toContain('max-age=31536000');
  expect(headers['strict-transport-security']).toContain('includeSubDomains');
  expect(headers['strict-transport-security']).toContain('preload');

  // Check X-Content-Type-Options
  expect(headers['x-content-type-options']).toBe('nosniff');

  // Check X-Frame-Options
  expect(headers['x-frame-options']).toBe('DENY');
});

test('security headers are present on a sample route', async ({ page }) => {
  await page.goto('/login');

  const response = await page.waitForResponse(resp => resp.url().endsWith('/login') && resp.status() === 200);
  const headers = response.headers();

  // Basic check that security headers are present
  expect(headers['content-security-policy']).toBeTruthy();
  expect(headers['strict-transport-security']).toBeTruthy();
  expect(headers['x-content-type-options']).toBe('nosniff');
  expect(headers['x-frame-options']).toBe('DENY');
});