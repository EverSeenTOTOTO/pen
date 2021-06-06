/* eslint-disable @typescript-eslint/no-var-requires */
const { resolve } = require('path');
const HtmlWebPackPlugin = require('html-webpack-plugin');
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin');
const safePostCssParser = require('postcss-safe-parser');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

// Variable used for enabling profiling in Production
// passed into alias object. Uses a flag if passed into the build command
const paths = {
  root: resolve(__dirname, '.'),
  src: resolve(__dirname, './src/spa/'),
  dist: resolve(__dirname, './dist/spa/'),
  resouces: resolve(__dirname, './src/spa/assets/'),
  packageJson: resolve(__dirname, './package.json'),
  nodeModules: resolve(__dirname, './node_modules'),
};

module.exports = {
  mode: 'production',
  devtool: 'source-map',
  entry: {
    app: './src/spa/index.tsx',
  },
  output: {
    filename: 'bundle.js',
    path: paths.dist,
  },
  target: ['web', 'es5'],
  optimization: {
    minimize: false,
  },
  module: {
    strictExportPresence: true,
    rules: [
      // Disable require.ensure as it's not a standard language feature.
      { parser: { requireEnsure: false } },
      {
        test: /\.(j|t)sx?$/,
        include: paths.src,
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
              // 30KB 以下的文件采用 url-loader
              limit: 1024 * 30,
              // 否则采用 file-loader，默认值就是 file-loader
              fallback: require.resolve('file-loader'),
              name: 'static/media/[name].[hash:8].[ext]',
            },
          },
        ],
        include: paths.resouces,
      },
    ],
  },
  plugins: [
    new HtmlWebPackPlugin({
      title: 'Pen',
      inject: false,
      template: './public/index.html',
      favicon: './public/favicon.ico',
      minify: false,
      scriptLoading: 'blocking',
    }),
    new MiniCssExtractPlugin({
      filename: 'bundle.css',
    }),
    new OptimizeCSSAssetsPlugin({
      cssProcessorOptions: {
        parser: safePostCssParser,
      },
      cssProcessorPluginOptions: {
        preset: ['default', { minifyFontValues: { removeQuotes: false } }],
      },
    }),
  ],
  resolve: {
    modules: [paths.nodeModules],
    mainFields: ['jsnext:main', 'browser', 'main'],
    alias: {
      react: resolve(__dirname, './node_modules/react/umd/react.production.min.js'),
      'react-dom': resolve(__dirname, './node_modules/react-dom/umd/react-dom.production.min.js'),
      '@': paths.src,
    },
    extensions: ['.js', '.ts', '.tsx'],
  },
};
