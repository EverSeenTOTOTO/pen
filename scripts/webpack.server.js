/* eslint-disable @typescript-eslint/no-var-requires */
// eslint-disable-next-line import/no-extraneous-dependencies
const { paths } = require('./utils');

module.exports = {
  mode: process.env.NODE_ENV,
  externals: /^(socket\.io|markdown-it|serve-static)/,
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
  optimization: {
    minimize: process.env.NODE_ENV !== 'production',
  },
};
