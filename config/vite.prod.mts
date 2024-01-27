import path from 'path';
import { defineConfig } from 'vite';
import deepmerge from 'deepmerge';
import legacy from '@vitejs/plugin-legacy';
import { viteStaticCopy as copy } from 'vite-plugin-static-copy';
// import { visualizer } from 'rollup-plugin-visualizer';
import { slash } from '../src/utils';
import base from './vite.common.mts';

const injectHtml = () => ({
  name: 'inject-html',
  transformIndexHtml(html: string) {
    return html.replace('<!-- inject -->', `<link rel="stylesheet" href="/assets/katex.min.css">
<script defer src="/assets/katex-copy-tex.min.js"></script>
    `);
  },
});

export default defineConfig((c) => deepmerge(base(c), {
  plugins: [
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
    // visualizer({ emitFile: true, filename: 'prod.stats.html' }),
  ],
}));
