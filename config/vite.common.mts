import path from 'path';
import postcssNormalize from 'postcss-normalize';
import react from '@vitejs/plugin-react';
import postcssFlexBugsFixes from 'postcss-flexbugs-fixes';
import postcssPresetEnv from 'postcss-preset-env';

export const paths = {
  src: path.resolve(__dirname, '..', 'src'),
  dist: path.resolve(__dirname, '..', 'dist'),
  template: path.resolve(__dirname, '..', 'index.html'),
  server: path.resolve(__dirname, '..', 'src/server/index.ts'), // 服务端代码入口
  serverEntry: path.resolve(__dirname, '..', 'src/index.server.tsx'), // 服务端同构应用入口
};

export default ({ mode }) => ({
  plugins: [
    react(),
  ],
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
    postcss: {
      plugins: [
        postcssFlexBugsFixes(),
        postcssPresetEnv({
          autoprefixer: {
            flexbox: 'no-2009',
          },
          stage: 3,
        }),
        postcssNormalize(),
      ],
    },
    devSourcemap: mode === 'development',
  },
});
