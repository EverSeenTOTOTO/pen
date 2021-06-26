/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable @typescript-eslint/no-var-requires */
const { resolve } = require('path');
const HtmlWebPackPlugin = require('html-webpack-plugin');
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin');
const safePostCssParser = require('postcss-safe-parser');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');

const { paths } = require('./utils');

module.exports = {
  mode: 'production',
  devtool: 'source-map',
  entry: {
    app: paths.spaEntry,
  },
  output: {
    filename: 'pen.[contenthash:8].js',
    chunkFilename: 'pen.[contenthash:8].js',
    path: paths.spaDist,
    clean: true,
  },
  target: ['web', 'es5'],
  module: {
    strictExportPresence: true,
    rules: [
      // Disable require.ensure as it's not a standard language feature.
      { parser: { requireEnsure: false } },
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
      {
        test: /.css$/,
        use: [
          {
            loader: MiniCssExtractPlugin.loader,
          },
          {
            loader: require.resolve('css-loader'),
          },
        ],
      },
      {
        test: /\.(png|jpg|gif|svg)$/i,
        use: [
          {
            loader: require.resolve('url-loader'),
            options: {
              limit: 1024 * 120,
              fallback: require.resolve('file-loader'),
              name: 'static/media/[name].[hash:8].[ext]',
            },
          },
        ],
      },
      {
        test: /\.(woff2?|ttf)$/i,
        loader: 'url-loader',
      },
    ],
  },
  plugins: [
    new HtmlWebPackPlugin({
      title: 'Pen',
      inject: false,
      template: './public/index.html',
      favicon: './public/favicon.ico',
    }),
    new MiniCssExtractPlugin({
      filename: 'pen.[contenthash:8].css',
      chunkFilename: 'pen.[contenthash:8].css',
    }),
    new OptimizeCSSAssetsPlugin({
      cssProcessorOptions: {
        parser: safePostCssParser,
      },
      cssProcessorPluginOptions: {
        preset: ['default', { minifyFontValues: { removeQuotes: false } }],
      },
    }),
    new BundleAnalyzerPlugin({
      analyzerMode: 'disabled',
      generateStatsFile: false,
    }),
  ],
  resolve: {
    modules: [paths.nodeModules],
    mainFields: ['jsnext:main', 'browser', 'main'],
    alias: {
      fonts: resolve(__dirname, '../node_modules/katex/dist/fonts'),
      react: 'preact/compat',
      'react-dom/test-utils': 'preact/test-utils',
      'react-dom': 'preact/compat',
    },
    extensions: ['.js', '.ts', '.tsx'],
  },
};
