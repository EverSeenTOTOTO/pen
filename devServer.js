/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable @typescript-eslint/no-var-requires */
const http = require('http');
const express = require('express');
const webpack = require('webpack');
const middleware = require('webpack-dev-middleware');
const webpackConfigs = require('./webpack.config');

const compiler = webpack(webpackConfigs);
const { pen } = require('./dist/index');

const app = express();
const instance = middleware(compiler, {
  // webpack-dev-middleware options
});

app.use(instance);

instance.waitUntilValid(() => {
  const server = http.createServer(app);

  pen.create({
    logger: console,
    ignores: /\.git/,
  }).attach(server);

  server.listen(3000, () => console.log('Pen devServer listening on port 3000!'));
  instance.close();
});
