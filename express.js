const http = require('http');
const express = require('express');
const { pen, middleware, createPenMiddleware } = require('./dist/lib');

const app = express();
const server = http.createServer(app);

const Doc = '/doc';
const Admin = '/admin';

pen
  .create({
  namespace: Doc,             // 默认 '/'
  ignores: /[\\/]\.git$/,
  logger: console
})
  .create({
  root: '../docs',
  namespace: '/admin',
  logger: console
})
  .attach(server);

app.get(Doc, createPenMiddleware('./src/spa', console));
app.get(Admin, middleware);

server.listen(3000);