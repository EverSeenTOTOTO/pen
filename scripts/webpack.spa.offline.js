/* eslint-disable @typescript-eslint/no-var-requires */
const HtmlWebPackPlugin = require('html-webpack-plugin');
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin');
const safePostCssParser = require('postcss-safe-parser');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
const spa = require('./webpack.spa.js');

module.exports = {
  ...spa,
  externals: undefined,
  plugins: [
    new HtmlWebPackPlugin({
      title: 'Pen',
      template: './public/index.offline.html',
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
  ],
};
