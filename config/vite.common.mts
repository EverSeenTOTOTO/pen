import path from 'path';
import react from '@vitejs/plugin-react';

export const paths = {
  src: path.resolve(import.meta.dirname, '..', 'src'),
  dist: path.resolve(import.meta.dirname, '..', 'dist'),
  template: path.resolve(import.meta.dirname, '..', 'index.html'),
  server: path.resolve(import.meta.dirname, '..', 'src/server/index.ts'),
  serverEntry: path.resolve(import.meta.dirname, '..', 'src/index.server.tsx'),
};

export default ({ mode }: { mode: string }) => ({
  plugins: [react()],
  build: {
    sourcemap: mode === 'development',
    emptyOutDir: false,
  },
  resolve: {
    alias: {
      '@': paths.src,
    },
  },
  css: {
    devSourcemap: mode === 'development',
  },
});
