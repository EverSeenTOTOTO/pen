import http from 'http';
import { bindRender } from '@/server/render';
import { RenderOptions } from '@/types';
import express from 'express';
import { logger } from '@/server/logger';
import { dist, getPage, rootDir } from './setup';

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
    remark: { // FIXME: unified is a mjs module which cannot be required in vite dev
      render: {} as any,
      tocExtractor: {} as any,
      usePlugins() {},
      process: (s: string) => Promise.resolve({ content: `!!TEST!! ${s}` }),
      processError: (s?: Error) => Promise.resolve({ message: s?.message ?? '' }),
    },
    ...opts,
  });

  const server = http.createServer(app);

  return new Promise<{ server: http.Server, port: number }>((resolve) => server.listen(basePort, () => resolve({ server, port: basePort++ })));
};

it('test namespace /, req /', async () => {
  const { server, port } = await prepareServer();
  const page = await getPage(`http://localhost:${port}`);
  const html = await page.content();

  expect(html).toMatch(/<span[^<]*A\.md<\/span>/);

  const len = await page.evaluate(() => {
    const dir = document.querySelector('#root > div > div > div > ul.MuiList-root.jss7.MuiList-dense.MuiList-padding');

    return dir?.children.length;
  });

  expect(len).toBe(2);

  server.close();
});

it('test namespace /, req A.md', async () => {
  const { server, port } = await prepareServer();
  const page = await getPage(`http://localhost:${port}/A.md`);

  let html = await page.content();
  expect(html).toMatch(/!!TEST!! # A/);

  await page.reload();

  html = await page.content();
  expect(html).toMatch(/!!TEST!! # A/);

  server.close();
});

it('test namespace /, req b.md', async () => {
  const { server, port } = await prepareServer();
  const page = await getPage(`http://localhost:${port}/A/b.md`);

  const html = await page.content();
  expect(html).toMatch(/<span[^<]*B<\/span>/);
  expect(html).toMatch(/!!TEST!! # b/);

  server.close();
});

it('test namespace /A, req b.md', async () => {
  const { server, port } = await prepareServer({ namespace: '/A' });
  const page = await getPage(`http://localhost:${port}/A/A/b.md`);

  const html = await page.content();
  expect(html).toMatch(/<span[^<]*B<\/span>/);
  expect(html).toMatch(/!!TEST!! # b/);

  server.close();
});
