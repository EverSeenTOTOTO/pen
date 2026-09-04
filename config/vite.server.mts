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
  // MUI v5 packages cannot be loaded by node ESM externals (esm root files with
  // directory imports, no exports map) — bundle them instead, keep the rest external.
  ssr: {
    noExternal: [/^@mui\//],
  },
}));
