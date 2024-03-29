import { defineConfig } from 'vite';
import deepmerge from 'deepmerge';
// import { visualizer } from 'rollup-plugin-visualizer';
import base, { paths } from './vite.common.mts';
import pkg from '../package.json';

export default defineConfig((c) => deepmerge(base(c), {
  build: {
    ssr: paths.serverEntry,
    rollupOptions: {
      output: {
        format: 'cjs'
      },
    },
  },
  // plugins: [visualizer({ emitFile: true, filename: 'serverEntry.stats.html' })],
  ssr: {
    external: Object.keys(pkg.dependencies),
  },
}));
