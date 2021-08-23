/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable @typescript-eslint/no-var-requires */
const { resolve } = require('path');
const HtmlWebPackPlugin = require('html-webpack-plugin');
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin');
const safePostCssParser = require('postcss-safe-parser');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
const AssetPlugin = require('./asset-plugin');

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
        test: /\.(png|jpg|gif|svg|woff2?|ttf)$/i,
        type: 'asset/inline',
      },
    ],
  },
  plugins: [
    new HtmlWebPackPlugin({
      title: 'Pen',
      template: './public/index.html',
      favicon: './public/favicon.ico',
      inject: false,
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
    new AssetPlugin(), // 生成一个assets.json
  ],
  externals: {
    mermaid: 'mermaid',
  },
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
  devServer: {
    contentBase: paths.spaDist,
    historyApiFallback: true,
    compress: true,
    progress: true,
    host: '0.0.0.0',
  },
};
