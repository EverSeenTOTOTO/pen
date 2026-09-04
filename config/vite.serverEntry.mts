import { defineConfig } from 'vite';
import base, { paths } from './vite.common.mts';

export default defineConfig((c) => ({
  ...base(c),
  build: {
    ...base(c).build,
    ssr: paths.serverEntry,
    rollupOptions: {
      output: {
        format: 'esm',
        entryFileNames: 'index.server.mjs',
      },
    },
  },
}));
