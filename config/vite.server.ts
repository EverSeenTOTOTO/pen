import { defineConfig } from 'vite';
import { paths } from './vite.common';
import pkg from '../package.json';

// use vite as cjs bundler
export default defineConfig(({ mode }) => ({
  build: {
    ssr: true,
    sourcemap: mode === 'development',
    emptyOutDir: false,
    rollupOptions: {
      input: paths.server,
      output: {
        dir: undefined, // must leave undefined explicitly
        file: paths.serverOutput,
      },
    },
  },
  resolve: {
    alias: {
      '@': paths.src,
    },
  },
  ssr: {
    external: Object.keys(pkg.dependencies),
    noExternal: [
      /^(unified|(remark|rehype|hast|unist)[\w-.]+)/,
    ],
  },
}));
