/* eslint-disable @typescript-eslint/no-var-requires */
// eslint-disable-next-line import/no-extraneous-dependencies
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
const { paths } = require('./utils');

module.exports = {
  mode: 'production',
  externals: /^@everseenflash\/pen-middleware|socket\.io|markdown-it/,
  devtool: 'source-map',
  entry: {
    server: paths.serverEntry,
  },
  output: {
    filename: 'lib.js',
    path: paths.serverDist,
    library: {
      type: 'commonjs2',
    },
    clean: true,
  },
  target: 'node',
  module: {
    rules: [
      {
        test: /\.(j|t)s$/,
        loader: 'esbuild-loader',
        options: {
          loader: 'ts',
          target: 'es2015', // Syntax to compile to (see options below for possible values)
        },
      },
    ],
  },
  resolve: {
    modules: [paths.nodeModules],
    alias: {
      '@': paths.src,
    },
    extensions: ['.js', '.ts'],
  },
  plugins: [
    new BundleAnalyzerPlugin({
      analyzerMode: 'disabled',
      generateStatsFile: false,
    }),
  ],
  optimization: {
    minimize: false,
  },
};
