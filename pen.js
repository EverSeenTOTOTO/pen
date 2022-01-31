#!/usr/bin/env node

const { createServer } = require('http');
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
  .parse();

const options = program.opts();
const { port } = options;
const ignores = Array.isArray(options.ignores) ? options.ignores : [options.ignores];

if (!options.hidden) {
  ignores.push(/[\\/]\./);
}

const logger = options.silence ? undefined : defaultLogger;

logger && logger.clearConsole();

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

const server = createServer(app);

middleware.attach(server);

(async function main() {
  const avaliablePort = await getPort({
    port,
  });

  if (avaliablePort !== port) {
    logger && logger.warn(`Pen found port ${port} unavaliable, use random port ${avaliablePort} instead`);
  }

  server.listen(avaliablePort, () => {
    const url = `http://localhost:${avaliablePort}/`;

    logger && logger.done(`Pen listening on ${chalk.bold(chalk.cyan(url))}`);
    options.open && open(url);
  });
}());
