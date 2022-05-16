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
    const socketPath = '/pensocket.io';
    const dist = path.join(process.cwd(), 'src');
    const root = path.join(process.cwd(), '../../doc');
    const theme = await createTheme('dark', dist);
    const templateHtml = fs.readFileSync(paths.template, 'utf-8');
    const transports = ['websocket'] as ('websocket' | 'polling')[];
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const remark = { // FIXME: unified is a mjs module which cannot be required in vite dev
      logger,
      render: {} as unknown as any,
      usePlugins() {},
      process: (s: string) => Promise.resolve(s),
      processError: (s?: Error) => Promise.resolve(s?.message ?? ''),
    };

    const watcher = createWatcher({
      root,
      logger,
      ignores,
      remark,
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
        const current = await readUnknown({
          remark,
          root,
          ignores,
          relative: '/',
        }).catch(() => undefined);
        const { render } = await vite.ssrLoadModule(paths.serverEntry);
        const template = await vite.transformIndexHtml(req.originalUrl, templateHtml);

        const { html } = await render({
          req,
          res,
          theme,
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
        ignored: ['coverage/*'],
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
