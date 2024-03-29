import path from 'path';
import fs from 'fs';
import { defineConfig, ViteDevServer } from 'vite';
import deepmerge from 'deepmerge';
import base, { paths } from './vite.common.mts';
import { createTheme } from '../src/server/theme';
import { readUnknown } from '../src/server/reader';
import { bindSocket } from '../src/server/socket';
import { logger } from '../src/server/logger';
import { RemarkRehype } from '../src/server/rehype';

const devSSR = () => ({
  name: 'dev-ssr',
  async configureServer(vite: ViteDevServer) {
    const namespace = '/';
    const ignores = [/^\/\./];
    const socketPath = '/pensocket.io';
    const dist = path.join(process.cwd(), 'src');
    const root = path.join(process.cwd(), '../..');
    const theme = await createTheme('dark', dist);
    const templateHtml = fs.readFileSync(paths.template, 'utf-8');
    const transports: ['websocket'] = ['websocket'];
    const remark = new RemarkRehype({ logger, plugins: [] })

    bindSocket(vite.httpServer!, {
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
        const current = await readUnknown({
          remark,
          root,
          ignores,
          relative: '/',
        });
        const { render } = await vite.ssrLoadModule(paths.serverEntry);
        const template = await vite.transformIndexHtml(req.originalUrl!, templateHtml);

        const { html } = await render({
          req,
          res,
          theme,
          template,
          prefetch: {
            theme,
            home: { data: current },
            socket: { socketPath, transports, namespace },
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

export default defineConfig((c) => deepmerge(base(c), {
  server: {
    host: true,
    watch: {
      ignored: ['coverage/*'],
    },
  },
  plugins: [
    devSSR(),
  ],
  ssr: {
    noExternal: [
      /^(unified|(remark|rehype|hast|unist)[\w-.]+)/,
    ],
  },
}));
