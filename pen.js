#!/usr/bin/env node

/* eslint-disable import/order */
/* eslint-disable @typescript-eslint/no-var-requires */
const { createServer } = require('http');
const { resolve, dirname } = require('path');
const { createReadStream } = require('fs');
const getPort = require('get-port');
const open = require('open');
const { pen, middleware } = require('./dist/lib');
const { existsSync } = require('fs');

const argv = require('minimist')(process.argv.slice(2));

const port = argv.port || argv.p || 3000;
const root = argv.root || argv.r || './';
const logger = argv.s ? undefined : console;

const server = createServer(middleware);

pen
  .create({
    root,
    logger,
    ignores: argv.i ? undefined : /[\\/]\./,
  })
  .attach(server);

(async function main() {
  const avaliablePort = await getPort({
    port,
  });

  if (avaliablePort !== port) {
    logger && logger.warn(`port ${port} is not avaliable, use random port instead`);
  }

  server.listen(avaliablePort, () => {
    const url = `http://localhost:${port}`;
    logger && logger.info(`server listening on ${url}`);
    open(url);
  });
}());
