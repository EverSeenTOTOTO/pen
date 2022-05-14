import path from 'path';
import fs from 'fs';
import { defineConfig, ViteDevServer } from 'vite';
import base, { paths } from './vite.common';
import { themes } from '../src/server/theme';

const children = [
  '1.md',
  '10.md',
  '2.md',
  '20.md',
  'aaa',
  'bbb',
  'very-longlonglonglonglonglonglong-filename.md',
].map((each) => ({
  filename: each,
  relativePath: each,
  type: each.endsWith('md') ? 'markdown' : 'directory',
}));

const mockData = (url: string) => {
  switch (url) {
    case '/':
      return {
        type: 'directory',
        children,
        filename: 'demo',
        relativePath: '/',
        readme: {
          type: 'markdown',
          filename: 'README',
          content: '# README',
        },
      };
    case '/10.md':
      return {
        type: 'directory',
        children,
        relativePath: '/',
        filename: 'demo',
        reading: {
          type: 'markdown',
          filename: '10.md',
          content: '# 10.md',
        },
      };
    case '/2.md':
      return {
        type: 'markdown',
        content: '# 2.md',
        filename: '2.md',
      };
    default:
      return {
        type: 'error',
        message: 'mock error',
      };
  }
};

const devSSR = () => ({
  name: 'dev-ssr',
  async configureServer(vite: ViteDevServer) {
    const { logger } = vite.config;
    const templateHtml = fs.readFileSync(paths.template, 'utf-8');
    const theme = { name: 'dark', options: themes.dark };
    const css = fs.readFileSync(path.join(__dirname, `../src/styles/theme.${theme.name}.css`), 'utf8');
    const info = {
      root: process.cwd(),
      namespace: '/',
    };

    // 缺点是不能调试完整服务端代码，只能调试服务端同构应用的部分
    return () => vite.middlewares.use(async (req, res, next) => {
      try {
        const { render } = await vite.ssrLoadModule(paths.serverEntry);
        const template = await vite.transformIndexHtml(req.originalUrl, templateHtml);
        const { html } = await render({
          req,
          res,
          info,
          theme,
          template,
          style: `<style>${css}</style>`,
          data: mockData(req.originalUrl),
        });

        res.end(html);
      } catch (e) {
        vite.ssrFixStacktrace(e);
        logger.error(e.stack ?? e.message);
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
