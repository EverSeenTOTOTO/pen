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
  // MUI v5 packages cannot be loaded by node ESM externals (esm root files with
  // directory imports, no exports map) — bundle them instead, keep the rest external.
  ssr: {
    noExternal: [/^@mui\//],
  },
}));
