import path from 'path';
import fs from 'fs';
import { defineConfig, ViteDevServer } from 'vite';
import base, { paths } from './vite.common';
import { createTheme } from '../src/server/theme';
import { readUnknown } from '../src/server/reader';
import { bindSocket } from '../src/server/socket';

const devSSR = () => ({
  name: 'dev-ssr',
  async configureServer(vite: ViteDevServer) {
    const namespace = '/';
    const ignores = [/^\/\./];
    const root = process.cwd();
    const transports = ['websocket'] as ('websocket' | 'polling')[];
    const socketPath = '/pensocket.io';
    const templateHtml = fs.readFileSync(paths.template, 'utf-8');
    const dist = path.join(__dirname, '../src/styles/');
    const theme = createTheme('dark', dist);
    const style = `<style id="${theme.id}">${theme.css}</style>`;

    bindSocket(vite.httpServer, {
      root,
      dist,
      ignores,
      namespace,
      socketPath,
      transports,
      connectTimeout: 5000,
    });

    // 缺点是不能调试完整服务端代码，只能调试服务端同构应用的部分
    return () => vite.middlewares.use(async (req, res, next) => {
      try {
        const current = await readUnknown('.', process.cwd(), ignores);
        const { render } = await vite.ssrLoadModule(paths.serverEntry);
        const template = await vite.transformIndexHtml(req.originalUrl, templateHtml);

        const { html } = await render({
          req,
          res,
          theme,
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
    plugins: [
      ...(config.plugins || []),
      devSSR(),
    ],
  };
});
