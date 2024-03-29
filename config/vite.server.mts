import { defineConfig } from 'vite';
// import { visualizer } from 'rollup-plugin-visualizer';
import { paths } from './vite.common.mts';
import pkg from '../package.json';

// use vite as cjs bundler
export default defineConfig(({ mode }) => ({
  // plugins: [visualizer({ emitFile: true, filename: 'server.stats.html' })],
  build: {
    ssr: true,
    sourcemap: mode === 'development',
    emptyOutDir: false,
    rollupOptions: {
      input: paths.server,
      output: {
        format: 'cjs'
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
  ssr: {
    external: Object.keys(pkg.dependencies),
    noExternal: [
      /^(get-port|unified|(remark|rehype|hast|unist)[\w-.]+)/,
    ],
  },
}));
