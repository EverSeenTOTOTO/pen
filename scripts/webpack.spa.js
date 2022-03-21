/* eslint-disable global-require */
/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable @typescript-eslint/no-var-requires */
const { resolve } = require('path');
const HtmlWebPackPlugin = require('html-webpack-plugin');
const postcssNormalize = require('postcss-normalize');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');

const { paths } = require('./utils');

module.exports = {
  mode: process.env.NODE_ENV,
  devtool: process.env.NODE_ENV === 'development' ? 'source-map' : undefined,
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
          process.env.NODE_ENV === 'development'
            ? {
              loader: require.resolve('style-loader'),
            }
            : MiniCssExtractPlugin.loader,
          {
            loader: require.resolve('css-loader'),
            options: {
              importLoaders: 1,
              sourceMap: process.env.NODE_ENV === 'development',
            },
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
    new CopyWebpackPlugin({
      patterns: [
        {
          from: resolve(paths.nodeModules, 'katex/dist/katex.min.css'),
          to: resolve(paths.spaDist, 'katex.min.4ff918ea.css'),
        },
        {
          from: resolve(paths.nodeModules, 'katex/dist/katex.min.js'),
          to: resolve(paths.spaDist, 'katex.min.6ec44b58.js'),
        },
        {
          from: resolve(paths.nodeModules, 'katex/dist/contrib/auto-render.min.js'),
          to: resolve(paths.spaDist, 'auto-render.min.163583b1.js'),
        },
        {
          from: resolve(paths.nodeModules, 'mermaid/dist/mermaid.min.js'),
          to: resolve(paths.spaDist, 'mermaid.min.6ec44b58.js'),
        },
      ],
    }),
    new MiniCssExtractPlugin({
      filename: 'pen.[contenthash:8].css',
    }),
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
