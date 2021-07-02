# @everseenflash/pen-middleware

一个http server中间件，提供对markdown文件的预览能力，基于[**socket.io**](https://socket.io/)。灵感来源自[**pen**](https://github.com/utatti/pen)。

<image src="./demo.gif" width="800">

## Install

```bash
yarn add @everseenflash/pen-middleware
```

## Embedded markdown-it plugin examples

默认集成了一些markdown-it插件：

+ markdown-it-anchor
+ markdown-it-container

> include three containers: `Warn|Error|Info`, vuepress style like

```md
::: Warn
balabala
:::
```

+ markdown-it-highlightjs
+ markdown-it-include
+ markdown-it-footnote
+ markdown-it-toc-done-right
+ markdown-it-katex (forked, update to katex@0.13.11)
+ markdown-it-mermaid (forked, update to mermaid@8.10.2)
+ markdown-it-copy

## Usage

### Basic Usage

```js
const { createServer } = require('http');
const { pen, middleware } = require('@everseenflash/pen-middleware');

const server = createServer(middleware);

pen
  .create({
    root: './markdown-folder' // 本地markdown文件或者目录，默认./
})
  .attach(server);

server.listen(3000);
```

一切就绪，现在在支持[socket.io客户端](https://socket.io/docs/v3/client-installation/)的浏览器上打开<http://localhost:3000>看看吧！

### Use with Express

```ts
const http = require('http');
const express = require('express');
const { pen, middleware, createPenMiddleware, logger } = require('./dist/lib');

const app = express();
const server = http.createServer(app);

const Doc = /\/doc/;
const Admin = '/admin';

pen
  .create({
  namespace: Doc,             // 默认 '/'
  ignores: /[\\/]\.git$/,
  logger // a built-in logger
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
```

### Use with Terminal

```bash
# install globally
npm i -g @everseenflash/pen-middleware
# default usage
pen
# use with simple options
pen -si -p 8080 -r ~/docs
```

#### Cli Options

+ `--port|-p`

设置port，默认3000。

+ `--root|-r`

设置markdown文件目录，默认'./'。

+ `--assets|-a`

设置静态资源目录，默认与`root`保持一致。

+ `-i`

是否显示隐藏文件，默认不显示。

+ `-s`

是否输出日志，默认输出。

## Serve static files

默认会部署'./'目录下的以下文件:

```js
/\.(?:css(\.map)?|js(\.map)?|jpe?g|png|gif|ico|cur|heic|webp|tiff?|mp3|m4a|aac|ogg|midi?|wav|mp4|mov|webm|mpe?g|avi|ogv|flv|wmv)$/
```

可以使用`createPenMiddleware`指定静态资源文件目录.

```js
const middleware = createPenMiddleware('../docs');
```

## Custom UI?

Just fork this project and modify it! It is quite a simple project. Otherwise you can use your own `middleware`.
