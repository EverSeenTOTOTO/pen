import { test, expect, type Page } from '@playwright/test';

test('renders markdown readme', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.markdown-body h1')).toContainText('Title');
});

test('sidebar lists directory entries', async ({ page }) => {
  await page.goto('/');
  // fixture root: README.md, evil.md, pixel.png plus the media/, notebook/,
  // noreadme/, srcpreview/ and entryonly/ dirs — unsupported files are
  // listed too
  const entries = page.locator('.sidebar button.file-item');
  await expect(entries).toHaveCount(8);
  await expect(entries.filter({ hasText: 'README.md' })).toHaveCount(1);
  await expect(entries.filter({ hasText: 'pixel.png' })).toHaveCount(1);
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

test('no bookend tail under the paper', async ({ page }) => {
  // regression: .app-main used to pad ~90vh below the paper so anchor
  // jumps could pin trailing headings to the top — scrolling to the bottom
  // revealed a near-full page of blank. Anchor jumps center trailing
  // headings instead now; only breathing room remains.
  await page.goto('/');
  await page.waitForSelector('.markdown-paper');

  const gap = await page.evaluate(() => {
    const paper = document.querySelector('.markdown-paper');
    return document.documentElement.scrollHeight - (paper.getBoundingClientRect().bottom + scrollY);
  });

  expect(gap).toBeLessThan(300);
});

test('trailing anchor centers instead of running out of document', async ({ page }) => {
  await page.context().addCookies([
    { name: 'drawerVisible', value: 'true', url: 'http://localhost:3210' },
  ]);
  await page.goto('/');
  await expect(page.locator('.toc-link').first()).toBeVisible();

  // "Image" is the last heading, inside the final screenful — there is no
  // scroll left to pin it to the top, so it must land fully visible
  await page.locator('.toc-link', { hasText: 'Image' }).click();
  await expect(page).toHaveURL(/#image$/);

  // scroll-behavior is smooth — poll until the jump settles, then require
  // the heading fully inside the viewport
  await expect.poll(async () => {
    const box = await page.locator('#image').boundingBox();
    return box ? Math.round(box.y + box.height) : -1;
  }).toBeLessThanOrEqual(page.viewportSize()!.height);
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

test('directory without preferred docs opens the first markdown', async ({ page }) => {
  await page.goto('/notebook');
  // no README/index/skill here — the first markdown in sort order becomes
  // the default reading instead of the file index
  await expect(page.locator('.markdown-body h1')).toContainText('Day One');
  await expect(page.locator('.file-index')).toHaveCount(0);
});

test('directory without markdown renders an index of children', async ({ page }) => {
  await page.goto('/media');
  // only a screenshots/ subdir here — no markdown to read, so the content
  // area becomes a file index of the directory's children
  await expect(page.locator('.file-index-title')).toHaveText('/media/');
  const card = page.locator('.file-index-item', { hasText: 'screenshots' });
  await expect(card).toBeVisible();
});

test('breadcrumb stays stable across directory round trips', async ({ page }) => {
  // regression: a directory reading ends in `/`, whose split produced an
  // empty crumb segment with a duplicate react key — every home/directory
  // round trip then leaked one stale crumb node into the header
  await page.goto('/');
  await expect(page.locator('.breadcrumb > span')).toHaveCount(1);

  for (let i = 0; i < 3; i++) {
    await page.locator('.sidebar .file-item', { hasText: 'notebook' }).click();
    // notebook/ reads day1.md via the markdown fallback — one crumb per
    // real path segment, no phantom empty crumb (textContent includes the
    // leading `/` separator)
    const crumbs = page.locator('.breadcrumb > span');
    await expect(crumbs).toHaveCount(2);
    await expect(crumbs.first()).toHaveText('/notebook');
    await expect(crumbs.nth(1)).toHaveText('/day1.md');

    await page.locator('.breadcrumb-home').click();
    await expect(page.locator('.breadcrumb > span')).toHaveCount(1);
    await expect(page.locator('.breadcrumb > span').first()).toHaveText('/README.md');
  }
});

test('unsupported files are listed but toast on click', async ({ page }) => {
  await page.goto('/noreadme');
  // .gitkeep used to be filtered out of the listing entirely — now every
  // entry is listed, and the unsupported one stays in place with a toast
  const item = page.locator('.file-index-item', { hasText: '.gitkeep' });
  await expect(item).toHaveClass(/file-index-unsupported/);
  await item.click();

  await expect(page.locator('.toast')).toContainText('No preview available');
  await expect(page).toHaveURL(/\/noreadme$/);
});

test('code files render a highlighted source view', async ({ page }) => {
  await page.goto('/srcpreview/app.ts');
  await expect(page.locator('.markdown-body pre code.hljs')).toBeVisible();
  await expect(page.locator('.markdown-body code.hljs .hljs-keyword').first()).toBeVisible();
});

test('navigating a code file keeps the url clean', async ({ page }) => {
  await page.goto('/srcpreview');
  await page.locator('.sidebar .file-item', { hasText: 'app.ts' }).click();
  await expect(page.locator('.markdown-body pre code.hljs')).toBeVisible();
  // code files are files, not directories — no trailing slash
  await expect(page).toHaveURL(/\/srcpreview\/app\.ts$/);
});

test('yaml frontmatter renders as a highlighted block', async ({ page }) => {
  await page.goto('/notebook');
  // day1.md carries frontmatter — it renders as a yaml block instead of
  // being swallowed by the parser
  const block = page.locator('.markdown-body pre code.language-yaml');
  await expect(block).toBeVisible();
  await expect(block).toContainText('title: day one');
  await expect(page.locator('.markdown-body h1')).toContainText('Day One');
});

test('plain-text tier renders without highlight spans', async ({ page }) => {
  await page.goto('/srcpreview/data.toml');
  const code = page.locator('.markdown-body pre code.hljs');
  await expect(code).toContainText('port = 3210');
  await expect(page.locator('.markdown-body .hljs-keyword')).toHaveCount(0);
});

test('code-only directory reads the first code file', async ({ page }) => {
  await page.goto('/srcpreview');
  // no markdown here — the first code file in sort order becomes the
  // default reading instead of the file index
  await expect(page.locator('.markdown-body pre code.hljs')).toBeVisible();
  await expect(page.locator('.file-index')).toHaveCount(0);
});

test('code-only directory prefers its entry file', async ({ page }) => {
  await page.goto('/entryonly');
  // index.js is the entry convention; aaa.ts sorts first — the entry wins
  await expect(page.locator('.markdown-body pre code.hljs')).toContainText("export const entry = 'index.js'");
  await expect(page.locator('.file-index')).toHaveCount(0);
});

test('content images open the lightbox', async ({ page }) => {
  await page.goto('/');
  await page.locator('.markdown-body img').first().click();
  await expect(page.locator('.mermaid-viewer img')).toBeVisible();
  await expect(page.locator('.mermaid-viewer-zoom')).toHaveText(/\d+%/);
  await page.keyboard.press('Escape');
  await expect(page.locator('.mermaid-viewer')).toHaveCount(0);
});

test('raw html is sanitized', async ({ page }) => {
  await page.goto('/evil.md');
  await expect(page.locator('.markdown-body')).toContainText('Safe text');
  // no script execution, no event handlers, no javascript: urls survive
  const audit = await page.evaluate(() => ({
    pwned: (window as unknown as { __pwned?: boolean }).__pwned === true,
    scripts: document.querySelectorAll('.markdown-body script').length,
    onerror: !!document.querySelector('.markdown-body [onerror]'),
    jsHref: !!document.querySelector('.markdown-body a[href^="javascript:"]'),
  }));
  expect(audit).toEqual({ pwned: false, scripts: 0, onerror: false, jsHref: false });
});

test('sidebar filter narrows the file list', async ({ page }) => {
  await page.goto('/');
  const entries = page.locator('.sidebar button.file-item');
  await expect(entries).toHaveCount(8);

  await page.locator('.sidebar-filter').fill('note');
  await expect(entries).toHaveCount(1);
  await expect(entries).toContainText('notebook');

  await page.locator('.sidebar-filter').fill('zzz-nothing');
  await expect(page.locator('.sidebar-filter-empty')).toBeVisible();

  await page.locator('.sidebar-filter').press('Escape');
  await expect(entries).toHaveCount(8);
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
