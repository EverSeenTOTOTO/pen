#!/usr/bin/env node
/**
 * Record the README demo gif automatically: a split page (editor | pen
 * preview) where scripted typing lands in demo.md section by section and
 * the live preview follows — no reload, exactly the manual workflow the
 * old Pen.gif showed. Output: ./Pen.gif (webm video -> ffmpeg palette).
 *
 * Usage: node scripts/record-demo.mjs   (needs ffmpeg on PATH)
 */
import { chromium } from '@playwright/test';
import { spawn } from 'child_process';
import { mkdtemp, writeFile, rm, mkdir } from 'fs/promises';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';

const repo = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const port = 39417;
const origin = `http://localhost:${port}`;

// typed into the textarea in this order; each entry lands on disk as one
// save, so the preview visibly re-renders between sections
const SECTIONS = [
  '\nstream markdown preview while you edit.\n',
  '\n## Features\n\n| feature | live |\n| --- | --- |\n| tables | ✓ |\n| task lists | ✓ |\n',
  '\n## Code\n\n```ts\nconst pen = await watch("./demo.md");\npen.on("change", render);\n```\n',
  '\n## Math\n\n$$e^{i\\pi} + 1 = 0$$\n',
  '\n## Diagram\n\n```mermaid\ngraph LR;\n  edit[edit]-->watch[chokidar];\n  watch-->push[socket.io];\n  push-->preview[preview];\n```\n',
  '\n:::info\nsaved -> preview, no reload\n:::\n',
];

// the split harness lives next to demo.md inside the served temp dir —
// same origin as the pen iframe, so the driver can scroll the preview.
// `.shtml` not `.html`: express still serves it as text/html, but the ssr
// middleware does not treat it as a previewable code file — a .html name
// would get intercepted into a source view of the harness itself
const HARNESS = `<!doctype html>
<html>
<head><meta charset="utf-8">
<style>
  html,body{margin:0;height:100%;background:#ffffff;color:#1f2328}
  .wrap{display:flex;height:100vh}
  .editor{width:42%;display:flex;flex-direction:column;border-right:1px solid #d1d9e0;background:#f6f8fa}
  .tab{padding:10px 16px;border-bottom:1px solid #d1d9e0;color:#59636e;font:13px ui-monospace,monospace}
  textarea{flex:1;border:0;outline:0;resize:none;background:transparent;color:#1f2328;
    padding:16px;font:13px/1.7 ui-monospace,SFMono-Regular,Menlo,monospace;caret-color:#0969da}
  iframe{flex:1;border:0}
</style></head>
<body>
  <div class="wrap">
    <div class="editor"><div class="tab">demo.md — editing</div>
      <textarea id="t" spellcheck="false"></textarea></div>
    <iframe id="f" src="/"></iframe>
  </div>
  <script>
    const t = document.getElementById('t');
    t.addEventListener('input', () => { t.scrollTop = t.scrollHeight; });
    t.value = '# Pen\\n';
    t.focus();
    t.setSelectionRange(t.value.length, t.value.length);
  </script>
</body>
</html>`;

const gif = path.join(repo, 'Pen.gif');
const work = await mkdtemp(path.join(os.tmpdir(), 'pen-demo-'));
const videoDir = path.join(work, 'video');

await mkdir(videoDir, { recursive: true });
await writeFile(path.join(work, 'demo.md'), '# Pen\n');
await writeFile(path.join(work, 'editor.shtml'), HARNESS);

const server = spawn('node', ['cli.mjs', '-s', '-p', String(port), '-r', work], {
  cwd: repo,
  stdio: 'ignore',
});

const waitServer = async () => {
  for (let i = 0; i < 60; i++) {
    try {
      const res = await fetch(origin, { redirect: 'manual' });
      if (res.status > 0) return;
    } catch { /* not up yet */ }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`pen did not start on ${origin}`);
};

const cleanup = async () => {
  server.kill();
  await rm(work, { recursive: true, force: true });
};

try {
  await waitServer();

  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1280, height: 860 },
    recordVideo: { dir: videoDir, size: { width: 1280, height: 860 } },
  });
  const page = await context.newPage();

  // light theme reads better in the readme (github renders gifs on white)
  await context.addCookies([{ name: 'themeMode', value: '%22light%22', url: origin }]);

  await page.goto(`${origin}/editor.shtml`);
  await page.waitForFunction(() => {
    const doc = document.getElementById('f')?.contentDocument;
    return !!doc?.querySelector('.markdown-body h1');
  }, null, { timeout: 15000 });

  const theme = await page.evaluate(() => document.getElementById('f')
    ?.contentDocument?.documentElement.dataset.theme);
  if (theme !== 'light') throw new Error(`expected light theme, got ${theme}`);

  await page.waitForTimeout(800);

  let typed = '# Pen\n';

  for (const section of SECTIONS) {
    await page.keyboard.type(section, { delay: 16 });
    typed += section;

    // one save per section: chokidar stabilizes ~1s, then the push lands
    await writeFile(path.join(work, 'demo.md'), typed);
    await page.waitForTimeout(2400);
    await page.evaluate(() => {
      const win = document.getElementById('f')?.contentWindow;
      win?.scrollTo({ top: win.document.documentElement.scrollHeight });
    });
    await page.waitForTimeout(400);
  }

  await page.waitForTimeout(1600); // let mermaid finish its lazy render
  await context.close();

  const video = await page.video().path();

  await browser.close();

  // two-pass gif: shared palette keeps the dark theme crisp at a sane size
  const palette = path.join(work, 'palette.png');
  const run = (args) => new Promise((resolve, reject) => {
    const ff = spawn('ffmpeg', ['-y', ...args], { stdio: 'ignore' });
    ff.on('close', (code) => (code === 0 ? resolve() : reject(new Error(`ffmpeg ${code}`))));
  });

  await run(['-i', video, '-vf', 'fps=12,scale=1200:-2:flags=lanczos,palettegen=stats_mode=diff', palette]);
  await run([
    '-i', video, '-i', palette,
    '-lavfi', 'fps=12,scale=1200:-2:flags=lanczos[x];[x][1:v]paletteuse=dither=bayer:bayer_scale=4:diff_mode=rectangle',
    gif,
  ]);

  console.log(`recorded ${gif}`);
} finally {
  await cleanup();
}
