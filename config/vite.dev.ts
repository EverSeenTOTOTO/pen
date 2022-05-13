import fs from 'fs';
import { defineConfig, ViteDevServer } from 'vite';
import base, { paths } from './vite.common';

const mockData = (url: string) => {
  switch (url) {
    case '/':
      return {
        type: 'directory',
        children: ['1.md', '10.md', '2.md', '20.md', 'aaa', 'bbb', 'very-longlonglonglonglonglonglong-filename.md'],
        relativePath: '/',
        readme: {
          type: 'markdown',
          content: '# README',
        },
      };
    case '/10.md':
      return {
        type: 'directory',
        children: ['1.md', '10.md', '2.md', '20.md', 'aaa', 'bbb', 'very-longlonglonglonglonglonglong-filename.md'],
        relativePath: '/',
        reading: {
          type: 'markdown',
          content: '# 10.md',
        },
      };
    case '/2.md':
      return {
        type: 'markdown',
        content: '# 2.md',
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

    // 缺点是不能调试完整服务端代码，只能调试服务端同构应用的部分
    return () => vite.middlewares.use(async (req, res, next) => {
      try {
        const { render } = await vite.ssrLoadModule(paths.serverEntry);
        const template = await vite.transformIndexHtml(req.originalUrl, templateHtml);
        const { html } = await render({
          req,
          res,
          template,
          markdownData: mockData(req.originalUrl),
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
