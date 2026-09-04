import { defineConfig } from 'vite';
import { paths } from './vite.common.mts';

// use vite as esm bundler, all deps external
export default defineConfig(({ mode }) => ({
  build: {
    ssr: true,
    sourcemap: mode === 'development',
    emptyOutDir: true,
    rollupOptions: {
      input: paths.server,
      output: {
        format: 'esm',
        entryFileNames: 'index.mjs',
      },
    },
  },
  resolve: {
    alias: {
      '@': paths.src,
      'node:net': 'net',
      'node:os': 'os',
    },
  },
}));
