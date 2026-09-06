import { test, expect, type Page } from '@playwright/test';

test('renders markdown readme', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.markdown-body h1')).toContainText('Title');
});

test('sidebar lists directory entries', async ({ page }) => {
  await page.goto('/');
  // fixture root: README.md plus the notebook/ and noreadme/ fixture dirs
  const entries = page.locator('.sidebar button.file-item');
  await expect(entries).toHaveCount(3);
  await expect(entries.filter({ hasText: 'README.md' })).toHaveCount(1);
});

test('sidebar open by default on desktop', async ({ page }) => {
  // fresh visitor, no `drawerVisible` cookie — the persistent sidebar boots
  // open (regression: it used to start closed with no way to reopen it)
  await page.goto('/');
  await expect(page.locator('.app')).toHaveClass(/app-sidebar-open/);
  await expect(page.locator('.sidebar')).toHaveCSS('transform', 'matrix(1, 0, 0, 1, 0, 0)');

  // the header hamburger is mobile-only; desktop closes from the sidebar
  // footer and reopens from the collapsed rail
  await expect(page.locator('.app-header .menu-toggle')).toBeHidden();
  await page.getByRole('button', { name: 'Close sidebar' }).click();
  await expect(page.locator('.app')).not.toHaveClass(/app-sidebar-open/);
  await expect(page.locator('.sidebar-rail')).toBeVisible();
  await expect(page.locator('.app-main')).toHaveCSS('margin-left', '44px');

  await page.getByRole('button', { name: 'Open sidebar' }).click();
  await expect(page.locator('.app')).toHaveClass(/app-sidebar-open/);
  await expect(page.locator('.sidebar-rail')).toBeHidden();
});

// the closed sidebar slides fully off-screen: translateX(-100%) of its
// computed width — read the width instead of hardcoding the token
const hiddenTransform = (page: Page) => page.evaluate(() => {
  const width = document.querySelector('.sidebar')?.getBoundingClientRect().width ?? 0;
  return `matrix(1, 0, 0, 1, ${-Math.round(width)}, 0)`;
});

test('desktop reopen from closed cookie', async ({ page }) => {
  // explicit opt-out keeps the sidebar closed, but the collapsed rail keeps
  // the reopen affordance reachable at the bottom-left
  await page.context().addCookies([
    { name: 'drawerVisible', value: 'false', url: 'http://localhost:3210' },
  ]);
  await page.goto('/');
  await expect(page.locator('.app')).not.toHaveClass(/app-sidebar-open/);
  await expect(page.locator('.sidebar')).toHaveCSS('transform', await hiddenTransform(page));
  await expect(page.locator('.sidebar-rail')).toBeVisible();

  await page.getByRole('button', { name: 'Open sidebar' }).click();
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

test('directory without readme renders an index of children', async ({ page }) => {
  await page.goto('/notebook');
  // no README here — the content area becomes a file index instead of empty
  await expect(page.locator('.file-index-title')).toHaveText('/notebook/');
  const card = page.locator('.file-index-item', { hasText: 'day1.md' });
  await expect(card).toBeVisible();

  await card.click();
  await expect(page).toHaveURL(/\/notebook\/day1\.md$/);
  await expect(page.locator('.markdown-body h1')).toContainText('Day One');
});

test('empty directory shows the empty state', async ({ page }) => {
  await page.goto('/noreadme');
  // .gitkeep is dotfile-ignored, so the directory reads as empty
  await expect(page.locator('.file-index-empty')).toBeVisible();
  await expect(page.locator('.file-index-item')).toHaveCount(0);
});

test('copying math puts latex source on the clipboard', async ({ page }) => {
  await page.goto('/');
  // katex copy-tex rewrites the copy event payload: selecting rendered math
  // must yield the latex source (with $ delimiters), not the visual glyphs
  const clipboard = await page.evaluate(() => {
    const katex = document.querySelector('.katex');
    if (!katex) return '(no math)';
    const range = document.createRange();
    range.selectNode(katex);
    const sel = getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
    return new Promise((resolve) => {
      document.addEventListener('copy', (e) => {
        resolve(e.clipboardData?.getData('text/plain') ?? '(empty)');
      }, { once: true });
      document.execCommand('copy');
    });
  });
  await expect(clipboard).toContain('$e^{i');
});

test('mermaid renders svg', async ({ page }) => {
  await page.goto('/');
  // mermaid is imported lazily on the client (separate async chunk) — allow a
  // generous timeout for chunk load + render
  await expect(page.locator('.mermaid-svg svg').first()).toBeVisible({ timeout: 15000 });
});

test('mermaid viewer zooms, pans and closes', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.mermaid-svg svg').first()).toBeVisible({ timeout: 15000 });

  await page.locator('.mermaid-svg .mermaid-expand').first().click();
  const stage = page.locator('.mermaid-viewer-stage');
  await expect(page.locator('.mermaid-viewer svg')).toBeVisible();
  // the diagram is fitted to the viewport on open — small fixture diagrams
  // upscale — so only assert a percentage shows
  const label = page.locator('.mermaid-viewer-zoom');
  await expect(label).toHaveText(/\d+%/);
  const initialZoom = Number((await label.textContent())?.replace('%', ''));

  // toolbar zoom in
  await page.getByRole('button', { name: 'Zoom in' }).click();
  await expect.poll(async () => Number((await label.textContent())?.replace('%', ''))).toBeGreaterThan(initialZoom);

  // drag pans (inline style keeps the raw calc; computed matrices resolve
  // the -50% into pixels and are awkward to match)
  const box = await stage.boundingBox();
  const cx = box.x + box.width / 2;
  const cy = box.y + box.height / 2;
  await page.mouse.move(cx, cy);
  await page.mouse.down();
  await page.mouse.move(cx + 60, cy + 40, { steps: 4 });
  await page.mouse.up();
  await expect(stage).toHaveAttribute('style', /scale\(/);
  await expect(stage).toHaveAttribute('style', /\+ 60px/);
  await expect(stage).toHaveAttribute('style', /\+ 40px/);

  // esc closes and unlocks the page scroll
  await expect(page.locator('html')).toHaveClass(/pen-viewer-open/);
  await page.keyboard.press('Escape');
  await expect(page.locator('.mermaid-viewer')).toHaveCount(0);
  await expect(page.locator('html')).not.toHaveClass(/pen-viewer-open/);
});

test('mobile overlay drawer', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto('/');

  // mobile ignores the desktop persistent-open state: the sidebar starts
  // off-screen even though `visible` defaults to true
  await expect(page.locator('.sidebar')).toHaveCSS('transform', await hiddenTransform(page));

  await page.getByRole('button', { name: 'Open menu' }).click();
  await expect(page.locator('.app')).toHaveClass(/app-overlay-open/);
  await expect(page.locator('.app-backdrop')).toBeVisible();
  // the same switch now offers to close the overlay
  await expect(page.locator('.app-header .menu-toggle')).toHaveAttribute('aria-label', 'Close menu');
  // the overlay drawer slides in above the backdrop
  await expect(page.locator('.sidebar')).toHaveCSS('transform', 'matrix(1, 0, 0, 1, 0, 0)');

  // click the backdrop clear of the 248px drawer
  await page.locator('.app-backdrop').click({ position: { x: 350, y: 400 } });
  await expect(page.locator('.app')).not.toHaveClass(/app-overlay-open/);
  await expect(page.locator('.app-backdrop')).toBeHidden();
  await expect(page.locator('.sidebar')).toHaveCSS('transform', await hiddenTransform(page));
});
