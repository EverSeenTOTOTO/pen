/* eslint-disable @typescript-eslint/no-var-requires */
const { resolve } = require('path');

module.exports.paths = {
  packageJson: resolve(__dirname, '../package.json'),
  nodeModules: resolve(__dirname, '../node_modules'),
  src: resolve(__dirname, '../src'),
  spa: resolve(__dirname, '../src/spa'),
  serverEntry: resolve(__dirname, '../src/index.ts'),
  spaEntry: resolve(__dirname, '../src/spa/index.tsx'),
  serverDist: resolve(__dirname, '../dist/'),
  spaDist: resolve(__dirname, '../dist/spa/'),
};
