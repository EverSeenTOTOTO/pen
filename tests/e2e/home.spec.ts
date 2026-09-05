import { test, expect } from '@playwright/test';

test('renders markdown readme', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.markdown-body h1')).toContainText('Title');
});

test('sidebar lists directory entries', async ({ page }) => {
  await page.goto('/');
  // the fixture root holds a single README.md; the sidebar file list renders
  // one button.file-item per entry
  const entries = page.locator('.sidebar button.file-item');
  await expect(entries).toHaveCount(1);
  await expect(entries).toContainText('README');
});

test('sidebar open by default on desktop', async ({ page }) => {
  // fresh visitor, no `drawerVisible` cookie — the persistent sidebar boots
  // open (regression: it used to start closed with no way to reopen it)
  await page.goto('/');
  await expect(page.locator('.app')).toHaveClass(/app-sidebar-open/);
  await expect(page.locator('.sidebar')).toHaveCSS('transform', 'matrix(1, 0, 0, 1, 0, 0)');
  await expect(page.locator('.app-header .menu-toggle')).toBeHidden();
});

test('desktop reopen from closed cookie', async ({ page }) => {
  // explicit opt-out keeps the sidebar closed, but the header hamburger stays
  // reachable as the reopen affordance
  await page.context().addCookies([
    { name: 'drawerVisible', value: 'false', url: 'http://localhost:3210' },
  ]);
  await page.goto('/');
  await expect(page.locator('.app')).not.toHaveClass(/app-sidebar-open/);
  await expect(page.locator('.sidebar')).toHaveCSS('transform', 'matrix(1, 0, 0, 1, -280, 0)');

  await page.getByRole('button', { name: 'Open menu' }).click();
  await expect(page.locator('.app')).toHaveClass(/app-sidebar-open/);
  await expect(page.locator('.sidebar')).toHaveCSS('transform', 'matrix(1, 0, 0, 1, 0, 0)');
});

test('anchor navigation from toc', async ({ page }) => {
  // seed the cookie explicitly so the toc is open regardless of the
  // default-open change
  await page.context().addCookies([
    { name: 'drawerVisible', value: 'true', url: 'http://localhost:3210' },
  ]);
  await page.goto('/');
  await expect(page.locator('.app')).toHaveClass(/app-sidebar-open/);
  await expect(page.locator('.sidebar')).toHaveCSS('transform', 'matrix(1, 0, 0, 1, 0, 0)');

  await page.locator('.toc-link', { hasText: '中文标题' }).first().click();
  // scrollToHeading navigates via history.replaceState; the browser
  // percent-encodes the CJK slug, `#中文标题` on the wire
  await expect(page).toHaveURL(/#%E4%B8%AD%E6%96%87%E6%A0%87%E9%A2%98$/);
  await expect(page.locator('#中文标题')).toBeVisible();
});

test('theme toggle persists', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

  await page.getByRole('button', { name: /switch to (light|dark) theme/i }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');

  // the cookie is written client-side by a store reaction — wait for it to
  // land before reloading, otherwise the server re-renders the default theme
  await expect
    .poll(async () => (await page.context().cookies()).find((c) => c.name === 'themeMode')?.value)
    .toBe('%22light%22');

  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
});

test('mermaid renders svg', async ({ page }) => {
  await page.goto('/');
  // mermaid is imported lazily on the client (separate async chunk) — allow a
  // generous timeout for chunk load + render
  await expect(page.locator('.mermaid-svg svg').first()).toBeVisible({ timeout: 15000 });
});

test('mobile overlay drawer', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto('/');

  // mobile ignores the desktop persistent-open state: the sidebar starts
  // off-screen even though `visible` defaults to true
  await expect(page.locator('.sidebar')).toHaveCSS('transform', 'matrix(1, 0, 0, 1, -280, 0)');

  await page.getByRole('button', { name: 'Open menu' }).click();
  await expect(page.locator('.app')).toHaveClass(/app-overlay-open/);
  await expect(page.locator('.app-backdrop')).toBeVisible();
  // the overlay drawer slides in above the backdrop
  await expect(page.locator('.sidebar')).toHaveCSS('transform', 'matrix(1, 0, 0, 1, 0, 0)');

  // click the backdrop clear of the 280px drawer
  await page.locator('.app-backdrop').click({ position: { x: 350, y: 400 } });
  await expect(page.locator('.app')).not.toHaveClass(/app-overlay-open/);
  await expect(page.locator('.app-backdrop')).toBeHidden();
  await expect(page.locator('.sidebar')).toHaveCSS('transform', 'matrix(1, 0, 0, 1, -280, 0)');
});
