#!/usr/bin/env node

/* eslint-disable import/order */
/* eslint-disable @typescript-eslint/no-var-requires */
const { createServer } = require('http');
const express = require('express');
const getPort = require('get-port');
const open = require('open');
const { Pen } = require('./dist/lib');

const argv = require('minimist')(process.argv.slice(2));

const port = argv.port || argv.p || 3000;
const root = argv.root || argv.r || '.';
const assets = argv.assets || argv.a;
const logger = argv.s ? undefined : require('./dist/lib').logger;

logger && logger.clearConsole();

const app = express();
const server = createServer(app);

const pen = new Pen({
  root,
  assets,
  logger,
});

pen.attach(server);
app.get(new RegExp('/(.*)?$'), pen.middleware);

(async function main() {
  const avaliablePort = await getPort({
    port,
  });

  if (avaliablePort !== port) {
    logger && logger.warn(`Pen found port ${port} is not avaliable, use random port ${avaliablePort} instead`);
  }

  server.listen(avaliablePort, () => {
    const url = `http://localhost:${avaliablePort}/`;
    logger && logger.done(`Pen listening on ${url}`);
    open(url);
  });
}());
