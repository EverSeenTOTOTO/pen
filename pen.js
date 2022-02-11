#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-var-requires */

const { createServer: createHttpServer } = require('http');
const { createServer: createHttpsServer } = require('https');
const path = require('path');
const fs = require('fs');
const express = require('express');
const getPort = require('get-port');
const open = require('open');
const chalk = require('chalk');
const { program } = require('commander');
const { default: createPenMiddleware, logger: defaultLogger } = require('./dist/server/lib');
const pkg = require('./package.json');

program
  .version(pkg.version)
  .option('-r, --root <root>', 'root directory to watch', '.')
  .option('-p, --port <port>', 'port of markdown server', 3000)
  .option('-i, --ignores <ignores...>', 'files to ignore', [])
  .option('-H, --hidden', 'ignore hidden files', false)
  .option('-s, --silence', 'show logger outputs', false)
  .option('-o, --open', 'open browser automatically', false)
  .option('-K, --key [key]', 'key for https server')
  .option('-C, --cert [cert]', 'certificate for https server')
  .parse();

const options = program.opts();
const port = parseInt(options.port, 10);
const ignores = Array.isArray(options.ignores) ? options.ignores : [options.ignores];

if (!options.hidden) {
  ignores.push(/[\\/]\./);
}

const logger = options.silence ? undefined : defaultLogger;

logger && logger.clearConsole();

let key;
let cert;

if (options.key && options.cert) {
  try {
    key = fs.readFileSync(path.resolve(options.key));
    cert = fs.readFileSync(path.resolve(options.cert));
  } catch (e) {
    logger.error(`Pen failed to read ${options.key} or ${options.cert}`);
  }
}

const useHttps = !!((key && cert));

const middleware = createPenMiddleware({
  logger,
  root: options.root,
  ignores: ignores
    .map((each) => {
      if (typeof each === 'string') {
        return new RegExp(each);
      }

      if (each instanceof RegExp) {
        return each;
      }

      return undefined;
    })
    .filter((_) => _),
});

const app = express();

app.use(middleware);

const server = useHttps
  ? createHttpsServer({ key, cert }, app)
  : createHttpServer(app);

middleware.attach(server);

(async function main() {
  const avaliablePort = await getPort({
    port,
  });

  if (avaliablePort !== port) {
    logger && logger.warn(`Pen found port ${port} unavaliable, use random port ${avaliablePort} instead`);
  }

  server.listen(avaliablePort, () => {
    const url = `${useHttps ? 'https' : 'http'}://localhost:${avaliablePort}/`;

    logger && logger.done(`Pen listening on ${chalk.bold(chalk.cyan(url))}`);
    options.open && open(url);
  });
}());
