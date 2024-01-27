#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-var-requires */

process.env.NODE_ENV = process.env.NODE_ENV || 'production';

const { program } = require('commander');
const open = require('open');
const { createServer } = require('./dist/index');
const { version } = require('./package.json');

program
  .version(version)
  .option('-r, --root <root>', 'set watching directory, relative path to current dir, default `.`')
  .option('-n, --namespace <namespace>', 'set socket.io namespace, default `/`')
  .option('-p, --port <port>', 'set server port, default `3000` or another auto-detected avaliable port')
  .option('-i, --ignores <ignores...>', 'set ignoring files, default `[]`, for example if you want to ignore dotfiles: `-i "^\\."`')
  .option('-s, --silent', 'ignore logger messages, default `false`')
  .option('-o, --open', 'open browser automatically, default `false`')
  .option('-S, --socketPath <socketPath>', 'Set socket.io path, default `/pensocket.io`')
  .parse();

const opts = program.opts();

createServer(opts)
  .then(({ port, options }) => {
    options.logger.done(`Pen server listening on ${port}`);

    if (opts.open) {
      open(`http://localhost:${port}${options.namespace}`);
    }
  })
  .catch((e) => console.error(e.stack || e.message));
