import path from 'path';
import { defineConfig } from 'vite';
import legacy from '@vitejs/plugin-legacy';
import { viteStaticCopy as copy } from 'vite-plugin-static-copy';
import { slash } from '../src/utils';
import base from './vite.common';

const injectHtml = () => ({
  name: 'inject-html',
  transformIndexHtml(html: string) {
    return html.replace('<!-- inject -->', `<link rel="stylesheet" href="/assets/katex.min.css">
    <script defer src="/assets/katex.min.js"></script>
    <script defer src="/assets/katex-auto-render.min.js" onload="renderMathInElement(document.body);"></script>`);
  },
});

export default defineConfig((c) => {
  const config = base(c);
  return {
    ...config,
    plugins: [
      ...(config.plugins || []),
      legacy(),
      injectHtml(),
      copy({
        targets: [
          {
            src: slash(path.join(__dirname, '../src/assets/*')),
            dest: 'assets/', // relate to dist
          },
        ],
      }),
    ],
  };
});
