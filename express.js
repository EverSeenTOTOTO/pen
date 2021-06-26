const http = require('http');
const express = require('express');
const { pen, middleware, createPenMiddleware, logger } = require('./dist/lib');

const app = express();
const server = http.createServer(app);

const Doc = '/doc';
const Admin = '/admin';

pen
  .create({
  namespace: Doc,             // 默认 '/'
  ignores: /[\\/]\.git$/,
  logger
})
  .create({
  root: '../docs',
  namespace: '/admin',
  logger
})
  .attach(server);

app.get(Doc, createPenMiddleware('./src/spa', console));
app.get(Admin, middleware);

server.listen(3000);