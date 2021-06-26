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
const assets = argv.assets || argv.a || root;
const logger = argv.s ? undefined : console;

logger.info(
  `
======== Pen ========
root: ${root}
assets: ${assets}
port: ${port}
`,
);

const server = createServer(createPenMiddleware(assets, logger));

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
    logger && logger.warn(`Pen port ${port} is not avaliable, use random port ${avaliablePort} instead`);
  }

  server.listen(avaliablePort, () => {
    const url = `http://localhost:${avaliablePort}`;
    logger && logger.info(`Pen listen on ${url}`);
    open(url);
  });
}());
