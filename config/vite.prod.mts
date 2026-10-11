import path from 'path';
import { defineConfig } from 'vite';
import { viteStaticCopy as copy } from 'vite-plugin-static-copy';
// import { visualizer } from 'rollup-plugin-visualizer';
import { slash } from '../src/utils';
import base from './vite.common.mts';

const injectHtml = () => ({
  name: 'inject-html',
  transformIndexHtml(html: string) {
    return html.replace('<!-- inject -->', `<link rel="stylesheet" href="/vendor/katex.min.css">
<script defer src="/vendor/katex-copy-tex.min.js"></script>
    `);
  },
});

export default defineConfig((c) => ({
  ...base(c),
  plugins: [
    ...base(c).plugins,
    injectHtml(),
    copy({
      targets: [
        {
          src: slash(path.join(import.meta.dirname, '../src/assets/**')),
          // vendor/, NOT assets/: these copies keep stable file names
          // (github-markdown-*.css, katex, fonts/), so they must be served
          // with revalidation — assets/ is reserved for content-hashed
          // build output and gets immutable year-long caching
          dest: 'vendor/', // relate to dist
          // vite-plugin-static-copy v4 keeps the path relative to the project
          // root (dist/vendor/src/assets/...); strip the two leading segments
          // to copy flat into dist/vendor/ with fonts/ preserved.
          rename: { stripBase: 2 },
        },
      ],
    }),
    // visualizer({ emitFile: true, filename: 'prod.stats.html' }),
  ],
}));
