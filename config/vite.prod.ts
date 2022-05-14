import path from 'path';
import { defineConfig } from 'vite';
import legacy from '@vitejs/plugin-legacy';
import { viteStaticCopy as copy } from 'vite-plugin-static-copy';
import base from './vite.common';

export default defineConfig((c) => {
  const config = base(c);
  return {
    ...config,
    plugins: [
      ...(config.plugins || []),
      legacy(),
      copy({
        targets: [
          {
            src: path.join(__dirname, '../src/styles/theme.*.css'),
            dest: '.',
          },
        ],
      }),
    ],
  };
});
