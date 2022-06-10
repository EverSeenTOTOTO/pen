import http from 'http';
import { bindRender } from '@/server/render';
import { RenderOptions } from '@/types';
import express from 'express';
import { logger } from '@/server/logger';
import {
  dist, e2e, rootDir, mockRemark,
} from './setup';

let basePort = 3000;

const prepareServer = (opts?: Partial<Omit<RenderOptions, 'remark'>>) => {
  const app = express();

  bindRender(app, {
    dist,
    logger,
    root: rootDir,
    ignores: [],
    namespace: '/',
    theme: 'light',
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    remark: mockRemark,
    ...opts,
  });

  const server = http.createServer(app);

  return new Promise<{ server: http.Server, port: number }>((resolve) => server.listen(basePort, () => resolve({ server, port: basePort++ })));
};

it('test namespace /, req /', async () => {
  const { server, port } = await prepareServer();

  await e2e(async (page) => {
    await page.goto(`http://localhost:${port}`);

    const title = await page.title();
    const html = await page.content();

    expect(title).toMatch(/Pen/);
    expect(html).toMatch(/<span[^<]*A\.md<\/span>/);

    const len = await page.evaluate(() => {
      const dir = document.querySelector('#root > div > div > div > ul.MuiList-root.jss7.MuiList-dense.MuiList-padding');

      return dir?.children.length;
    });
    expect(len).toBe(2);

    const color = await page.evaluate(() => window.getComputedStyle(document.body).backgroundColor);
    expect(color).toBe('rgb(255, 255, 255)');
  });

  server.close();
});

it('test namespace /, req A.md', async () => {
  const { server, port } = await prepareServer();

  await e2e(async (page) => {
    await page.goto(`http://localhost:${port}/A.md`);

    let html = await page.content();
    expect(html).toMatch(/!!TEST!! # A/);

    await page.reload();

    html = await page.content();
    expect(html).toMatch(/!!TEST!! # A/);
  });

  server.close();
});

it('test namespace /, req b.md', async () => {
  const { server, port } = await prepareServer();

  await e2e(async (page) => {
    await page.goto(`http://localhost:${port}/A/b.md`);

    const html = await page.content();
    expect(html).toMatch(/<span[^<]*B<\/span>/);
    expect(html).toMatch(/!!TEST!! # b/);
  });

  server.close();
});

it('test namespace /A, req b.md', async () => {
  const { server, port } = await prepareServer({ namespace: '/A' });

  await e2e(async (page) => {
    await page.goto(`http://localhost:${port}/A/A/b.md`);

    const html = await page.content();
    expect(html).toMatch(/<span[^<]*B<\/span>/);
    expect(html).toMatch(/!!TEST!! # b/);
  });

  server.close();
});

it('test theme', async () => {
  const { server, port } = await prepareServer({ theme: 'dark' });

  await e2e(async (page) => {
    await page.goto(`http://localhost:${port}/`);

    const color = await page.evaluate(() => window.getComputedStyle(document.body).backgroundColor);

    expect(color).toBe('rgb(13, 17, 23)');
  });

  server.close();
});
