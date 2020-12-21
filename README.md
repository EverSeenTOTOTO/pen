# @everseenflash/pen-middleware

一个http server中间件，提供对markdown文件的预览能力，基于[**socket.io**](https://socket.io/)。灵感来源自[**pen**](https://github.com/utatti/pen)。

## Install

```bash
yarn add @everseenflash/pen-middleware
```

## Usage

### Basic Usage Example

```js
const { createServer } = require('http');
const { pen, middleware } = require('@everseenflash/pen-middleware');

const server = createServer(middleware);
pen
  .create({
    root: './markdown-path/' //本地markdown文件或者目录
})
  .attach(server);

server.listen(3000);
```

一切就绪，现在在支持[socket.io客户端](https://socket.io/docs/v3/client-installation/)的浏览器上打开<http://localhost:3000>看看吧！

### Use with Express

```ts
import http from 'http';
import express from 'express';
import { pen, middleware } from '@everseenflash/pen-middleware';

const doc = '/doc'; // 可以设置页面访问上下文，默认是'/'
const admin = '/admin';

const app = express();
const server = http.createServer(app);
pen
  .create({
  root: './markdown/', // 本地markdown文件或者目录
  namespace: doc,
})
  .create({
  root: './admin/',
  namespace: admin,
})
  .attach(server);

app.get(doc, middleware);
app.get(admin, middleware);

server.listen(3000);

```
