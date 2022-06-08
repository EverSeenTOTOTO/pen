# @everseen/pen

A cli tool provides the ability to preview markdown files when editing, based on [socket.io](https://socket.io/) and [chokidar](https://github.com/paulmillr/chokidar), with builtin katex, highlight.js, copy, doctoc and vuepress style container support.

<img src="./Pen.gif" />

## Usage 

### Use with CLI

```bash 
# install globally 
npm i -g @everseen/pen 

# default usage 
pen 
  
# use with cli options 
pen -o -p 5000 -r ../docs
```

#### CLI Options

+ `--help|-h`
    
    Print help message.

+ `--root|-r`

    Set watching directory, default `.`.

+ `--namespace|-n`

    Set socket.io namespace, default `/`.

+ `--port|-p`

    Set server port, default `3000` or another auto-detected avaliable port.

+ `--ignores|-i`

    Set ignoring files, default `[]`, example if you want to ignore dotfiles: `-i "^\\."`

+ `--silent|-s`

    Ignore logger messages, default `false`.

+ `--open|-o`

    Open browser automatically, default `false`.

+ `--theme|-T`

    Select theme, `dark` or `light`.

+ `--socketPath|-S`

    Set socket.io path, default `/pensocket.io`.

### Use with Node.js

Check [cli.js](./cli.js) and [server/index.ts](./src/server/index.ts) as an example.

## Q & A

1. The UI looks ugly, how to customize theme?

    My fault🐶, fork this project and rewrite the client part, this is a small project!.

## TODO

1. add server timeout
2. test cases, and test memory leak
4. support keyboard events
6. log for distinct client
