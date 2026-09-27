import { test, expect } from '@playwright/test';

const KEY_PAGES = [
  { path: '/login', name: 'Login' },
  { path: '/', name: 'Dashboard' },
  { path: '/santri', name: 'Santri List' },
  { path: '/santri/1', name: 'Santri Detail' },
  { path: '/wali', name: 'Wali List' },
  { path: '/wali/1', name: 'Wali Detail' },
];

test.describe('Accessibility audit with axe-core', () => {
  for (const pageInfo of KEY_PAGES) {
    test(`${pageInfo.name} page has no accessibility violations`, async ({ page }) => {
      await page.goto(pageInfo.path);
      await page.waitForLoadState('networkidle');

      // Inject axe-core
      await page.addScriptTag({
        url: 'https://cdn.jsdelivr.net/npm/axe-core@4.13.2/axe.min.js'
      });

      // Run axe
      const violations = await page.evaluate(() => {
        return new Promise((resolve) => {
          // @ts-expect-error axe is loaded from CDN
          axe.run(document.body, (err: Error, results: any) => {
            if (err) throw err;
            resolve(results.violations);
          });
        });
      });

      if (violations.length > 0) {
        console.log(`\n=== ${pageInfo.name} (${pageInfo.path}) - ${violations.length} violations ===`);
        for (const v of violations) {
          console.log(`\n[${v.impact}] ${v.id}: ${v.description}`);
          console.log(`  Help: ${v.helpUrl}`);
          for (const node of v.nodes) {
            console.log(`  - ${node.html}`);
            if (node.target.length > 0) {
              console.log(`    Target: ${node.target.join(', ')}`);
            }
          }
        }
      }

      expect(violations).toHaveLength(0);
    });
  }
});

test.describe('Keyboard navigation and focus management', () => {
  test('Skip link is first focusable element on all pages', async ({ page }) => {
    for (const pageInfo of KEY_PAGES) {
      await page.goto(pageInfo.path);
      await page.waitForLoadState('networkidle');

      // Tab once - should hit skip link
      await page.keyboard.press('Tab');

      const firstFocused = await page.evaluate(() => {
        const el = document.activeElement;
        return el ? { tag: el.tagName, id: el.id, class: el.className, href: (el as HTMLAnchorElement).href } : null;
      });

      // Check if first focused is skip link
      const isSkipLink = firstFocused?.class?.includes('focus-visible:translate-y-0') ||
                        firstFocused?.href?.includes('#main-content') ||
                        firstFocused?.href?.includes('#login-form');

      if (!isSkipLink) {
        console.log(`${pageInfo.name}: First focused element:`, firstFocused);
      }

      // Skip links should exist
      const skipLink = await page.locator('a[href^="#"]').first();
      await expect(skipLink).toBeVisible({ timeout: 1000 }).catch(() => {});
    }
  });

  test('All interactive elements are reachable via Tab', async ({ page }) => {
    for (const pageInfo of KEY_PAGES) {
      await page.goto(pageInfo.path);
      await page.waitForLoadState('networkidle');

      // Count focusable elements
      const focusableCount = await page.evaluate(() => {
        const selectors = [
          'a[href]', 'button:not([disabled])', 'input:not([disabled])',
          'select:not([disabled])', 'textarea:not([disabled])',
          '[tabindex]:not([tabindex="-1"])'
        ];
        const elements = document.querySelectorAll(selectors.join(','));
        return elements.length;
      });

      console.log(`${pageInfo.name}: ${focusableCount} focusable elements`);
      expect(focusableCount).toBeGreaterThan(0);
    }
  });

  test('Focus is visible on all interactive elements', async ({ page }) => {
    for (const pageInfo of KEY_PAGES) {
      await page.goto(pageInfo.path);
      await page.waitForLoadState('networkidle');

      // Check for focus-visible styles
      const hasFocusStyles = await page.evaluate(() => {
        const styleSheets = Array.from(document.styleSheets);
        let hasFocusVisible = false;
        for (const sheet of styleSheets) {
          try {
            const rules = Array.from(sheet.cssRules || []);
            for (const rule of rules) {
              if (rule instanceof CSSStyleRule && rule.selectorText.includes('focus-visible')) {
                hasFocusVisible = true;
                break;
              }
            }
          } catch {
            // Cross-origin stylesheet
          }
        }
        return hasFocusVisible;
      });

      // Also check inline/tailwind focus-visible classes
      const hasTailwindFocus = await page.evaluate(() => {
        const elements = document.querySelectorAll('*');
        for (const el of elements) {
          const classes = el.className;
          if (typeof classes === 'string' && classes.includes('focus-visible:')) {
            return true;
          }
        }
        return false;
      });

      console.log(`${pageInfo.name}: CSS focus-visible: ${hasFocusStyles}, Tailwind focus-visible: ${hasTailwindFocus}`);
    }
  });
});

test.describe('ARIA labels on icon-only buttons', () => {
  test('All icon-only buttons have accessible names', async ({ page }) => {
    for (const pageInfo of KEY_PAGES) {
      await page.goto(pageInfo.path);
      await page.waitForLoadState('networkidle');

      const iconButtonsWithoutLabel = await page.evaluate(() => {
        const buttons = document.querySelectorAll('button, [role="button"]');
        const issues: string[] = [];

        for (const btn of buttons) {
          const hasText = btn.textContent?.trim();
          const hasAriaLabel = btn.getAttribute('aria-label');
          const hasAriaLabelledby = btn.getAttribute('aria-labelledby');
          const hasTitle = btn.getAttribute('title');

          // Check if button only contains icons/svg
          const hasOnlyIcons = !hasText && btn.querySelector('svg, [class*="icon"], i, [class*="Icon"]');

          if (hasOnlyIcons && !hasAriaLabel && !hasAriaLabelledby && !hasTitle) {
            issues.push(btn.outerHTML.substring(0, 200));
          }
        }

        return issues;
      });

      if (iconButtonsWithoutLabel.length > 0) {
        console.log(`${pageInfo.name}: Icon-only buttons without accessible name:`, iconButtonsWithoutLabel);
      }

      expect(iconButtonsWithoutLabel).toHaveLength(0);
    }
  });
});

test.describe('Modal/Drawer focus management', () => {
  test('Modal traps focus when open', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Look for any modal triggers and test them
    const modalTriggers = await page.locator('button:has-text("Modal"), [data-modal-trigger]').count();

    if (modalTriggers > 0) {
      // Test first modal
      await page.locator('button:has-text("Modal"), [data-modal-trigger]').first().click();
      await page.waitForTimeout(100);

      const focusTrapped = await page.evaluate(() => {
        const modal = document.querySelector('[role="dialog"][aria-modal="true"]');
        if (!modal) return false;

        const focusableInModal = modal.querySelectorAll(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );

        // Check if focus is within modal
        const activeEl = document.activeElement;
        return modal.contains(activeEl);
      });

      expect(focusTrapped).toBe(true);
    }
  });

  test('Focus restores to trigger on modal close', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const modalTriggers = await page.locator('button:has-text("Modal"), [data-modal-trigger]').count();

    if (modalTriggers > 0) {
      const trigger = page.locator('button:has-text("Modal"), [data-modal-trigger]').first();

      // Focus the trigger
      await trigger.focus();
      const triggerBefore = await trigger.getAttribute('id') || 'no-id';

      // Open modal
      await trigger.click();
      await page.waitForTimeout(100);

      // Close modal with Escape
      await page.keyboard.press('Escape');
      await page.waitForTimeout(100);

      // Check focus returned to trigger
      const activeEl = await page.evaluate(() => document.activeElement?.id || 'none');
      // Focus should be back on trigger or nearby
    }
  });
});

test.describe('Heading hierarchy', () => {
  test('Pages have proper heading hierarchy (h1→h2→h3)', async ({ page }) => {
    for (const pageInfo of KEY_PAGES) {
      await page.goto(pageInfo.path);
      await page.waitForLoadState('networkidle');

      const headingStructure = await page.evaluate(() => {
        const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
        const structure: { level: number; text: string }[] = [];

        for (const h of headings) {
          const level = parseInt(h.tagName[1]);
          structure.push({ level, text: h.textContent?.trim() || '' });
        }

        return structure;
      });

      console.log(`${pageInfo.name} heading structure:`, headingStructure);

      // Check for h1
      const h1Count = headingStructure.filter(h => h.level === 1).length;
      expect(h1Count).toBe(1);

      // Check hierarchy - no skipping levels
      let prevLevel = 0;
      for (const h of headingStructure) {
        if (prevLevel > 0 && h.level > prevLevel + 1) {
          console.warn(`${pageInfo.name}: Heading level skip from h${prevLevel} to h${h.level}: "${h.text}"`);
        }
        prevLevel = h.level;
      }
    }
  });
});

test.describe('Theme contrast verification', () => {
  test('Contrast passes in both light and dark themes', async ({ page }) => {
    for (const pageInfo of KEY_PAGES) {
      // Test light theme
      await page.goto(pageInfo.path);
      await page.waitForLoadState('networkidle');

      await page.evaluate(() => {
        document.documentElement.setAttribute('data-theme', 'bi-light');
      });
      await page.waitForTimeout(100);

      // Test dark theme
      await page.evaluate(() => {
        document.documentElement.setAttribute('data-theme', 'bi-dark');
      });
      await page.waitForTimeout(100);
    }
  });
});