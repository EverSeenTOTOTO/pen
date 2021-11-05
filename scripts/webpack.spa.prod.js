/* eslint-disable global-require */
/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable @typescript-eslint/no-var-requires */
const { merge } = require('webpack-merge');
const base = require('./webpack.spa');
const { paths } = require('./utils');

module.exports = merge(base, {
  module: {
    rules: [
      {
        test: /\.(j|t)sx?$/,
        include: paths.spa,
        use: [
          {
            loader: require.resolve('babel-loader'),
            options: {
              cacheDirectory: true,
              cacheCompression: false,
              customize: require.resolve(
                'babel-preset-react-app/webpack-overrides',
              ),
              presets: [
                [
                  require.resolve('babel-preset-react-app'),
                  {
                    runtime: 'classic',
                  },
                ],
              ],
            },
          },
        ],
      },
      {
        test: /\.(js|mjs)$/,
        exclude: /@babel(?:\/|\\{1,2})runtime/,
        loader: require.resolve('babel-loader'),
        options: {
          cacheDirectory: true,
          cacheCompression: false,
        },
      },
    ],
  },
});
