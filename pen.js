#!/usr/bin/env node

/* eslint-disable import/order */
/* eslint-disable @typescript-eslint/no-var-requires */
const { createServer } = require('http');
const getPort = require('get-port');
const open = require('open');
const { pen, createPenMiddleware } = require('./dist/lib');

const argv = require('minimist')(process.argv.slice(2));

const port = argv.port || argv.p || 3000;
const root = argv.root || argv.r || './';
const namespace = argv.namespace || argv.n;
const assets = argv.assets || argv.a || root;
const logger = argv.s ? undefined : require('./dist/lib').logger;

logger && logger.clearConsole();

const server = createServer(createPenMiddleware(assets, logger));

pen
  .create({
    root,
    namespace,
    logger,
    ignores: argv.i ? undefined : /[\\/]\./,
  })
  .attach(server);

(async function main() {
  const avaliablePort = await getPort({
    port,
  });

  if (avaliablePort !== port) {
    logger && logger.warn(`Pen found port ${port} is not avaliable, use random port ${avaliablePort} instead`);
  }

  server.listen(avaliablePort, () => {
    const url = `http://localhost:${avaliablePort}${namespace || '/'}`;
    logger && logger.done(`Pen listening on ${url}`);
    open(url);
  });
}());
