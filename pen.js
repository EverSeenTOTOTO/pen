#!/usr/bin/env node

/* eslint-disable import/order */
/* eslint-disable @typescript-eslint/no-var-requires */
const { createServer } = require('http');
const express = require('express');
const getPort = require('get-port');
const open = require('open');
const { default: createPenMiddleware, logger: defaultLogger } = require('./dist/lib');

const argv = require('minimist')(process.argv.slice(2));

const help = argv.help || argv.h;

if (help) {
  console.log(
    `
Usage: pen [options] [directory]

Options:
    --root, -r        select which directory to watch, default './'
    --port, -p        select which port to bind, if port already in use, will select a random port
    --assets, -a      select which directory as assets dir, default use root dir
    --help, -h        print this help message
    -i                ignore hidden files
    -s                keep silence, do not logging
`,
  );
  return;
}

const port = argv.port || argv.p || 3000;
const root = argv.root || argv.r || '.';
const assets = argv.assets || argv.a;
const ignores = argv.i && /[\\/]\./;
const logger = argv.s ? undefined : defaultLogger;

logger && logger.clearConsole();

const app = express();
const server = createServer(app);
const pen = createPenMiddleware({
  root,
  assets,
  server,
  logger,
  ignores,
});

app.get(new RegExp('/(.*)?$'), pen);

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
