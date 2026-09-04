import { test, expect } from '@playwright/test';

test('renders markdown readme', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.markdown-body h1')).toContainText('Title');
});

test('sidebar lists directory entries', async ({ page }) => {
  await page.goto('/');
  // the fixture root holds a single README.md; the drawer file list renders
  // one anchor per entry (header breadcrumb links live outside the drawer)
  const entries = page.locator('.MuiDrawer-root a[href]');
  await expect(entries).toHaveCount(1);
  await expect(entries).toContainText('README');
});
