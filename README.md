# @everseen/pen

> used to be @everseenflash/pen-middleware

一个cli工具，提供对markdown文件的预览能力。也可用作http中间件。基于[**socket.io**](https://socket.io/)。灵感来源自[**pen**](https://github.com/utatti/pen)。

<image src="./demo.gif" width="800">

## Usage

### Use with CLI

```bash
# install globally
npm i -g @everseen/pen
# default usage
pen
# use with simple options
pen -H -p 8080 -r ~/docs
```

#### Cli Options

+ `--help|-h`

help.

+ `--root|-r`

设置markdown文件目录，默认'./'。


+ `--port|-p`

设置port，默认3000。

+ `--open`

是否自动打开浏览器，默认否。

+ `-i, --ignores`

设置隐藏文件。

+ `-H, --hidden`

是否显示dotFile，默认不显示。

+ `-s, --silence`

是否输出日志，默认输出。

### Use with Node.js API

Just check [pen.js](./pen.js) as an example.

## Embedded markdown-it plugins

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
+ markdown-it-footnote
+ markdown-it-toc-done-right
+ markdown-it-katex (forked, update to katex@0.13.11)
+ markdown-it-mermaid (forked, update to mermaid@8.10.2)

## Q&A

+ Diffrent namespaces?

Pen force to use default namespace `'/'`, different namespace is not support yet.

+ Custom UI?

Just fork this project and modify it! It is quite a simple project. Otherwise you can use your own `middleware`.

+ `ENOSPC: System limit for number of file watchers reached`

```bash
echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf && sudo sysctl -p
```
