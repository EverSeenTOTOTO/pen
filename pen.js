#!/usr/bin/env node

/* eslint-disable import/order */
/* eslint-disable @typescript-eslint/no-var-requires */
const { createServer } = require('http');
const getPort = require('get-port');
const open = require('open');
const { default: createPenMiddleware, logger: defaultLogger } = require('./dist/server/lib');

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
    -i, --ignore-hidden      ignore hidden files
    -s, --silence     keep silence, do not logging
`,
  );
  return;
}

const port = argv.port || argv.p || 3000;
const root = argv._[0] || argv.root || argv.r || '.';
const assets = argv.assets || argv.a;
const ignores = (argv.i || argv['ignore-hidden']) && /[\\/]\./;
const logger = (argv.s || argv.silence) || defaultLogger;
const openBrowser = Boolean(argv.open);

logger && logger.clearConsole();

const middleware = createPenMiddleware({
  root,
  assets,
  logger,
  ignores,
});
const server = createServer(middleware);

// attach socketio
middleware.pen.attach(server);

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
    openBrowser && open(url);
  });
}());
