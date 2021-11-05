/* eslint-disable global-require */
/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable @typescript-eslint/no-var-requires */
const { merge } = require('webpack-merge');
const { ESBuildMinifyPlugin } = require('esbuild-loader');
const base = require('./webpack.spa');

module.exports = merge(base, {
  module: {
    rules: [
      {
        test: /\.m?(j|t)sx?$/,
        use: [
          {
            loader: 'esbuild-loader',
            options: {
              loader: 'tsx',
              target: 'es2015',
              tsconfigRaw: require('../tsconfig.json'),
            },
          },
        ],
      },
    ],
  },
  optimization: {
    minimizer: [
      new ESBuildMinifyPlugin({
        target: 'es2015',
      }),
    ],
  },
});
