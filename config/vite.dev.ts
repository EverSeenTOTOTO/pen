import path from 'path';
import fs from 'fs';
import { defineConfig, ViteDevServer } from 'vite';
import base, { paths } from './vite.common';
import { createTheme } from '../src/server/theme';
import { readUnknown } from '../src/server/reader';
import { bindSocket } from '../src/server/socket';
import { createWatcher } from '../src/server/watcher';
import { logger } from '../src/server/logger';

const devSSR = () => ({
  name: 'dev-ssr',
  async configureServer(vite: ViteDevServer) {
    const namespace = '/';
    const ignores = [/^\/\./];
    const root = process.cwd();
    // const root = path.join(process.cwd(), 'README.md');
    const socketPath = '/pensocket.io';
    const dist = path.join(process.cwd(), 'src');
    const theme = await createTheme('dark', dist);
    const style = `<style id="${theme.id}">${theme.css}</style>`;
    const templateHtml = fs.readFileSync(paths.template, 'utf-8');
    const transports = ['websocket'] as ('websocket' | 'polling')[];

    const watcher = createWatcher({
      root,
      logger,
      ignores,
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      remark: { // FIXME: unified is a mjs module which cannot be required in vite dev
        use: () => {},
        process: (s: string) => Promise.resolve(s),
        processError: (s?: Error) => Promise.resolve(s?.message ?? ''),
      },
    });

    bindSocket(vite.httpServer, {
      dist,
      logger,
      watcher,
      namespace,
      socketPath,
      transports,
      connectTimeout: 5000,
    });

    // 缺点是不能调试完整服务端代码，只能调试服务端同构应用的部分
    return () => vite.middlewares.use(async (req, res, next) => {
      try {
        const current = await readUnknown('.', root, ignores);
        const { render } = await vite.ssrLoadModule(paths.serverEntry);
        const template = await vite.transformIndexHtml(req.originalUrl, templateHtml);

        const { html } = await render({
          req,
          res,
          style,
          template,
          prefetch: {
            theme,
            home: { data: current },
            socket: { socketPath, transports },
          },
        });

        res.end(html);
      } catch (e) {
        vite.ssrFixStacktrace(e);
        console.error(e.stack ?? e.message);
        next();
      }
    });
  },
});

export default defineConfig((c) => {
  const config = base(c);
  return {
    ...config,
    server: {
      watch: {
        ignored: ['**/server/*.ts', 'coverage/*'],
      },
    },
    plugins: [
      ...(config.plugins || []),
      devSSR(),
    ],
    ssr: {
      noExternal: [
        /^(unified|(remark|rehype)-(\w+))/,
      ],
    },
  };
});
