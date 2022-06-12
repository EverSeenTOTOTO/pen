import http, { IncomingMessage } from 'http';
import { bindRender } from '@/server/render';
import { RenderOptions } from '@/types';
import express from 'express';
import { logger } from '@/server/logger';
import getPort from 'get-port';
import {
  dist, e2e, rootDir, mockRemark, testMockServer,
} from './setup';

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

  return getPort({ port: 3000 })
    .then((port: number) => new Promise((resolve) => server.listen(port, () => {
      console.info(`Test server listening on ${port}`);
      resolve({ server, port });
    })));
};

const closeServer = (server: http.Server) => new Promise<void>((res, rej) => server.close((err) => (err ? rej(err) : res())));

it('test namespace /, req /', async () => {
  const { server, port } = await prepareServer();
  const url = `http://localhost:${port}/`;

  await testMockServer(url, (res: IncomingMessage) => {
    expect(res.statusCode).toBe(200);
  });

  await e2e(async (page) => {
    await page.goto(url);

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
  }).finally(() => {
    closeServer(server);
  });
});

it('test namespace /, req A.md', async () => {
  const { server, port } = await prepareServer();
  const url = `http://localhost:${port}/A.md`;

  await testMockServer(url, (res: IncomingMessage) => {
    expect(res.statusCode).toBe(200);
  });

  await e2e(async (page) => {
    await page.goto(url);

    let html = await page.content();
    expect(html).toMatch(/!!TEST!! # A/);

    await page.reload();

    html = await page.content();
    expect(html).toMatch(/!!TEST!! # A/);
  }).finally(() => {
    closeServer(server);
  });
});

it('test namespace /, req b.md', async () => {
  const { server, port } = await prepareServer();

  await e2e(async (page) => {
    await page.goto(`http://localhost:${port}/A/b.md`);

    const html = await page.content();
    expect(html).toMatch(/<span[^<]*B<\/span>/);
    expect(html).toMatch(/!!TEST!! # b/);
  }).finally(() => {
    closeServer(server);
  });
});

it('test namespace /A, req b.md', async () => {
  const { server, port } = await prepareServer({ namespace: '/A' });

  await e2e(async (page) => {
    await page.goto(`http://localhost:${port}/A/A/b.md`);

    const html = await page.content();
    expect(html).toMatch(/<span[^<]*B<\/span>/);
    expect(html).toMatch(/!!TEST!! # b/);
  }).finally(() => {
    closeServer(server);
  });
});

it('test theme', async () => {
  const { server, port } = await prepareServer({ theme: () => Promise.resolve('dark') });

  await e2e(async (page) => {
    await page.goto(`http://localhost:${port}/`);

    const color = await page.evaluate(() => window.getComputedStyle(document.body).backgroundColor);

    expect(color).toBe('rgb(13, 17, 23)');
  }).finally(() => {
    closeServer(server);
  });
});
