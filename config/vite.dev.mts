import path from 'path';
import fs from 'fs';
import http from 'http';
import { defineConfig } from 'vite';
import type { ViteDevServer } from 'vite';
import base, { paths } from './vite.common.mts';
import { createTheme } from '../src/server/theme';
import { readUnknown } from '../src/server/reader';
import { bindSocket } from '../src/server/socket';
import { logger } from '../src/server/logger';
import { RemarkRehype } from '../src/server/rehype';
import { parseCookies } from '../src/cookie';

/**
 * Dev-only static middleware for `/assets/*`: the SSR'd dev page references
 * `/assets/*.css` (theme markdown/hljs links, katex) but those files live in
 * `src/assets` (copied to `dist/assets` by `make prepare` in prod builds),
 * which vite's dev server does not serve. Streams css/fonts with the right
 * content-type, 404 otherwise.
 */
const serveAssets = () => ({
  name: 'dev-serve-assets',
  configureServer(vite: ViteDevServer) {
    const assetsRoot = path.join(process.cwd(), 'src', 'assets');
    const contentTypes: Record<string, string> = {
      '.css': 'text/css',
      '.woff': 'font/woff',
      '.woff2': 'font/woff2',
      '.ttf': 'font/ttf',
    };

    // registered directly (not returned) so it runs before the SSR handler
    vite.middlewares.use('/assets', (req, res) => {
      const relative = decodeURIComponent((req.url ?? '').split('?')[0] ?? '');
      const file = path.resolve(assetsRoot, `.${relative}`);
      const contentType = contentTypes[path.extname(file)];

      const notFound = () => {
        res.statusCode = 404;
        res.end('Not Found');
      };

      // path traversal guard (resolve + prefix check) and extension allowlist
      if (!contentType || !file.startsWith(`${assetsRoot}${path.sep}`) || !fs.existsSync(file)) {
        notFound();
        return;
      }

      res.setHeader('Content-Type', contentType);
      fs.createReadStream(file).on('error', notFound).pipe(res);
    });
  },
});

const devSSR = () => ({
  name: 'dev-ssr',
  async configureServer(vite: ViteDevServer) {
    const namespace = '/';
    const ignores = [/^\/\./];
    const socketPath = '/pensocket.io';
    const dist = path.join(process.cwd(), 'src');
    const root = path.join(process.cwd(), '../..');
    const theme = await createTheme('dark', dist);
    // katex css link for dev/prod head parity (prod injects it at build time)
    const templateHtml = fs.readFileSync(paths.template, 'utf-8')
      .replace('<!-- inject -->', '<link rel="stylesheet" href="/assets/katex.min.css">');
    const transports: ['websocket'] = ['websocket'];
    const remark = new RemarkRehype({ logger, plugins: [] })

    bindSocket(vite.httpServer as http.Server, {
      root,
      ignores,
      dist,
      logger,
      remark,
      namespace,
      socketPath,
      transports,
      connectTimeout: 5000,
    });

    // 缺点是不能调试完整服务端代码，只能调试服务端同构应用的部分
    return () => vite.middlewares.use(async (req, res, next) => {
      try {
        // prefetch the requested document (like prod SSR) instead of always '/'.
        // vite's spa html-fallback rewrites req.url to /index.html before this
        // post hook runs — the real path is req.originalUrl.
        const relative = decodeURIComponent(req.originalUrl ?? '/').split('?')[0] || '/';
        const current = await readUnknown({
          remark,
          root,
          ignores,
          relative,
        });
        const { render } = await vite.ssrLoadModule(paths.serverEntry);
        const template = await vite.transformIndexHtml(req.originalUrl!, templateHtml);
        // cookie parity with the prod middleware: sidebar open unless the
        // cookie explicitly opts out (`setCookieJson` stores bare json booleans)
        const drawerVisible = parseCookies(req.headers.cookie ?? '').drawerVisible !== 'false';

        const { html } = await render({
          req,
          res,
          theme,
          template,
          prefetch: {
            theme,
            home: { data: current },
            drawer: { visible: drawerVisible },
            socket: { socketPath, transports, namespace },
          },
        });

        res.end(html);
      } catch (e) {
        const error = e instanceof Error ? e : new Error(String(e));
        vite.ssrFixStacktrace(error);
        console.error(error.stack ?? error.message);
        next();
      }
    });
  },
});

export default defineConfig((c) => ({
  ...base(c),
  server: {
    host: true,
    watch: {
      ignored: ['coverage/*'],
    },
  },
  plugins: [
    ...base(c).plugins,
    serveAssets(),
    devSSR(),
  ],
  ssr: {
    noExternal: [
      /^(unified|(remark|rehype|hast|unist)[\w-.]+)/,
    ],
  },
}));
