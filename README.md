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
const { Pen, middleware } = require('@everseenflash/pen-middleware');


const server = createServer(middleware);
const pen = new Pen({
    path: './markdown/' //本地markdown文件或者目录
})

pen.attach(server);

server.listen(3000);
```

一切就绪，现在在支持[socket.io客户端](https://socket.io/docs/v3/client-installation/)的浏览器上打开<http://localhost:3000>看看吧！

### Use with Express

```js
const { createServer } = require('http');
const express = require('express');
const { Pen, middleware } = require('@everseenflash/pen-middleware');

const namespace = '/any';

const app = express();
const server = createServer(app);
const pen = new Pen({
    path: './markdown/', //本地markdown文件或者目录
    namespace
})

app.get(namespace, middleware);
pen.attach(server);
server.listen(3000);
```

## Options

+ `root`
markdown 文件路径
  + type: `string`
  + default: `path.resolve('.')`

+ `namespace`
浏览器访问地址
  + type: `string`
  + default: `'/'`

+ `path`
socket.io连接地址
  + type: `string`
  + default: `'/pensocket.io'`

> 注意，`path`选项默认值和默认提供的middleware是绑定的。如果要修改，需要自己实现一个集成了socket.io-client，并处理`pencontent`和`penerror`事件的middleware。
