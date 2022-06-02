# @everseen/pen

A cli tool provides the ability to preview markdown files when editing, based on [socket.io](https://socket.io/) and [chokidar](https://github.com/paulmillr/chokidar).

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

    Set watching directory or markdown file, default `.`.

+ `--namespace|-n`

    Set socket.io namespace, default `/`.

+ `--port|-p`

    Set server port, default `3000` or another auto-detected avaliable port.

+ `--silent|-s`

    Ignore logger messages, default `false`.

+ `--open|-o`

    Open browser automatically, default `false`.

+ `--theme|-T`

    Select theme, `dark` or `light`.

+ `--socketPath|-S`

    Set socket.io path, default `/pensocket.io`.

### Use with Node.js

Check [server.ts](./src/server/index.ts) as an example.

## TODO

1. add server timeout
2. test memory leak
4. keyboard events
6. log for distinct client
