# @everseenflash/pen-middleware

一个http server中间件，提供对markdown文件的预览能力，基于[**socket.io**](https://socket.io/)。灵感来源自[**pen**](https://github.com/utatti/pen)。

## Install

```bash
yarn add @everseenflash/pen-middleware
```

## Embedded markdown-it plugin examples

默认集成了一些markdown-it插件：

+ markdown-it-abbr
+ markdown-it-anchor
+ markdown-it-container

> Warn|Error|Info, vuepress style like

```md
::: Warn
balabala
:::
```

+ markdown-it-highlightjs
+ markdown-it-include
+ markdown-it-ins
+ markdown-it-footnote
+ markdown-it-toc-done-right
+ markdown-it-katex (forked, update to katex@0.13.11)
+ markdown-it-copy

## Usage

### Basic Usage

```js
const { createServer } = require('http');
const { pen, middleware } = require('@everseenflash/pen-middleware');

const server = createServer(middleware);

pen
  .create({
    root: './' // 本地markdown文件或者目录
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

const app = express();
const server = http.createServer(app);
pen
  .create({
  root, // 本地markdown文件或者目录
  namespace: '/doc', // 默认 '/'
  ignores: /[\\/]\.git$/,
  logger: console
})
  .create({
  root
  namespace: '/admin'
})
  .attach(server);

app.get('/doc', middleware);
app.get('/admin', middleware);

server.listen(3000);
```

### Use with Terminal

```bash
npm i -g @everseenflash/pen-middleware
npx pen
npx pen -si -p 8080 -r ~/docs
```

#### Cli Options

+ `--port|-p`

设置port，默认3000。

+ `--root|-r`

设置markdown文件目录，默认'./'。

+ `-i`

是否显示隐藏文件，默认不显示。

+ `-s`

是否输出日志，默认输出。

## Custom UI?

Just fork this project and modify it! It is quite a simple project.
