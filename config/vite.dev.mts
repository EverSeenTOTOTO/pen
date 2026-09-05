import path from 'path';
import fs from 'fs';
import http from 'http';
import { defineConfig } from 'vite';
import type { ViteDevServer } from 'vite';
import base, { paths } from './vite.common.mts';
import { createTheme, isThemeName } from '../src/server/theme';
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

/**
 * Dev-only static middleware for the markdown root: prod serves it with
 * `express.static(root)` after SSR, dev otherwise falls through to the SSR
 * html fallback — images referenced by documents would come back as
 * `text/html` and render as broken images. Serves any file with an extension
 * except markdown (those go through SSR), mirroring prod.
 */
const serveRootStatics = () => ({
  name: 'dev-serve-root-statics',
  configureServer(vite: ViteDevServer) {
    const rootDir = path.join(process.cwd(), '../..');
    const contentTypes: Record<string, string> = {
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif': 'image/gif',
      '.svg': 'image/svg+xml',
      '.webp': 'image/webp',
      '.avif': 'image/avif',
      '.ico': 'image/x-icon',
      '.mp4': 'video/mp4',
      '.webm': 'video/webm',
      '.mp3': 'audio/mpeg',
      '.woff': 'font/woff',
      '.woff2': 'font/woff2',
      '.ttf': 'font/ttf',
    };

    // registered directly (not returned) so it runs before the SSR handler
    vite.middlewares.use((req, res, next) => {
      if (req.method !== 'GET' && req.method !== 'HEAD') {
        next();
        return;
      }

      const relative = decodeURIComponent((req.url ?? '').split('?')[0] ?? '');
      const ext = path.extname(relative).toLowerCase();

      // extensionless paths and markdown are SSR routes
      if (!ext || /\.(md|markdown)$/.test(ext)) {
        next();
        return;
      }

      const file = path.resolve(rootDir, `.${relative}`);
      const contentType = contentTypes[ext];

      // path traversal guard (resolve + prefix check) and extension allowlist
      if (!contentType || !file.startsWith(`${rootDir}${path.sep}`) || !fs.existsSync(file)) {
        next();
        return;
      }

      res.setHeader('Content-Type', contentType);
      fs.createReadStream(file).on('error', () => next()).pipe(res);
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
    // both themes precomputed — the per-request cookie picks one (parity
    // with the prod middleware; without it dev always boots dark)
    const themes = {
      dark: await createTheme('dark', dist),
      light: await createTheme('light', dist),
    };
    const defaultTheme = themes.dark;
    // render-blocking head links for dev/prod parity: prod gets the built
    // stylesheet <link> from vite, but in dev base/index.css only arrive as
    // runtime <style> tags when the client entry executes — the ssr markup
    // flashes unstyled first (FOUC / layout jump). Serving them as links
    // from src/assets (serveAssets) makes the first paint correct; the
    // duplicate runtime injection is same-rules and harmless.
    const templateHtml = fs.readFileSync(paths.template, 'utf-8')
      .replace('<!-- inject -->', [
        '<link rel="stylesheet" href="/assets/katex.min.css">',
        '<link rel="stylesheet" href="/assets/base.css">',
        '<link rel="stylesheet" href="/assets/index.css">',
      ].join('\n  '));
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
        // cookie parity with the prod middleware: themeMode holds a json
        // string, drawerVisible a bare json boolean
        const theme = (() => {
          try {
            const parsed = JSON.parse(parseCookies(req.headers.cookie ?? '').themeMode ?? '');
            return isThemeName(parsed) ? themes[parsed] : defaultTheme;
          } catch {
            return defaultTheme;
          }
        })();
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

        // a missing static asset (favicon, dead img src, ...) is not a render
        // failure — 404 quietly instead of logging a stack per request.
        // (`relative` lives inside the try, re-derive it here)
        const failedPath = decodeURIComponent(req.originalUrl ?? '/').split('?')[0] || '/';
        const ext = path.extname(failedPath).toLowerCase();
        if (ext && !/\.(md|markdown|html?)$/.test(ext)) {
          res.statusCode = 404;
          res.end('Not Found');
          return;
        }

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
      // dist churn (make build / e2e runs) must not reload the dev page
      ignored: ['coverage/*', 'dist/*'],
    },
  },
  plugins: [
    ...base(c).plugins,
    serveAssets(),
    serveRootStatics(),
    devSSR(),
  ],
  ssr: {
    noExternal: [
      /^(unified|(remark|rehype|hast|unist)[\w-.]+)/,
    ],
  },
}));
