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
const { createReadStream } = require('fs');
const { Pen, middleware } = require('@everseenflash/pen-middleware');


// 这个middleware用于将一个集成了socket.io客户端和内置md样式的html发送给浏览器
// 这个html放在pen/dist/spa下，其实就是个(req, res) => { /* send html */ })方法
const server = createServer(middleware);

const pen = new Pen({
    path: './markdown/' //本地markdown文件或者目录
}).attach(server);

server.listen(3000);
```

一切就绪，现在在支持[socket.io客户端](https://socket.io/docs/v3/client-installation/)的浏览器上打开<http://localhost:3000>看看吧！

## Options
