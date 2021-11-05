/* eslint-disable global-require */
/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable @typescript-eslint/no-var-requires */
const { resolve } = require('path');
const HtmlWebPackPlugin = require('html-webpack-plugin');
const postcssNormalize = require('postcss-normalize');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');

const { paths } = require('./utils');

module.exports = {
  mode: process.env.NODE_ENV,
  devtool: 'source-map',
  entry: {
    app: paths.spaEntry,
  },
  output: {
    filename: 'pen.[contenthash:8].js',
    chunkFilename: 'pen.[contenthash:8].js',
    path: paths.spaDist,
  },
  target: ['web', 'es5'],
  module: {
    rules: [
      {
        test: /.css$/,
        use: [
          {
            loader: require.resolve('css-loader'),
          },
          {
            loader: require.resolve('postcss-loader'),
            options: {
              postcssOptions: {
                plugins: [
                  require('postcss-flexbugs-fixes'),
                  require('postcss-preset-env')({
                    autoprefixer: {
                      flexbox: 'no-2009',
                    },
                    stage: 3,
                  }),
                  postcssNormalize(),
                  require('cssnano')({
                    preset: 'default',
                  }),
                ],
              },
              sourceMap: process.env.NODE_ENV === 'development',
            },
          },
        ],
      },
      {
        test: /\.(png|jpg|gif|svg|woff2?|ttf)$/i,
        type: 'asset/inline',
      },
    ],
  },
  plugins: [
    new HtmlWebPackPlugin({
      title: 'Pen',
      template: resolve(paths.public, 'index.html'),
      favicon: resolve(paths.public, 'favicon.ico'),
    }),
    new BundleAnalyzerPlugin({
      analyzerMode: 'disabled',
      generateStatsFile: false,
    }),
  ],
  externals: {
    mermaid: 'mermaid',
  },
  resolve: {
    modules: [paths.nodeModules],
    mainFields: ['jsnext:main', 'browser', 'main'],
    alias: {
      react: 'preact/compat',
      'react-dom/test-utils': 'preact/test-utils',
      'react-dom': 'preact/compat',
    },
    extensions: ['.js', '.ts', '.tsx'],
  },
  devServer: {
    contentBase: paths.spaDist,
    historyApiFallback: true,
    compress: true,
    progress: true,
    host: '0.0.0.0',
  },
};
