#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-var-requires */

const { program } = require('commander');
const open = require('open');
const { createServer } = require('./dist/server');
const { version } = require('./package.json');

program
  .version(version)
  .option('-r, --root <root>', 'root directory or markdown to watch, default "."')
  .option('-n, --namespace <namespace>', 'socket.io namespace, default "/"')
  .option('-p, --port <port>', 'port to listen, default "3000"')
  .option('-i, --ignores <ignores...>', 'ignore files, default []')
  .option('-s, --silent', 'ignore log output, default false')
  .option('-o, --open', 'try open browser automaticlly, default false')
  .option('-T, --theme <theme>', 'default theme, dark or light, default "dark"')
  .option('-S, --socketPath <socketPath>', 'socket.io path argument, default"/pensocket.io"')
  .parse();

const opts = program.opts();

createServer(opts)
  .then(({ port, options }) => {
    options.logger.done(`Pen server listening on ${port}`);

    if (opts.open) {
      open(`http://localhost:${port}${options.namespace}`);
    }
  })
  .catch((e) => console.error(e.stack ?? e.message));
