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
// eslint-disable-next-line import/no-unresolved
const { default: createPenMiddleware, logger: defaultLogger } = require('./dist/server/lib');
const pkg = require('./package.json');

program
  .version(pkg.version)
  .option('-r, --root <root>', 'root directory to watch', '.')
  .option('-p, --port <port>', 'port of markdown server', 3000)
  .option('-t, --filetypes <filetypes...>', 'enabled filetypes, default: md, avaliable types: md/pdf', [])
  .option('-i, --ignores <ignores...>', 'file patterns to ignore', [])
  .option('-H, --hidden', 'ignore hidden files', false)
  .option('-s, --silence', 'ignore logger outputs', false)
  .option('-o, --open', 'open browser automatically', false)
  .option('-K, --key [key]', 'key for https server')
  .option('-C, --cert [cert]', 'certificate for https server')
  .parse();

const options = program.opts();
const port = parseInt(options.port, 10);
const filetypes = Array.isArray(options.filetypes) ? options.filetypes : [options.filetypes];

if (filetypes.length === 0) {
  filetypes.push('md');
}

let ignores = Array.isArray(options.ignores) ? options.ignores : [options.ignores];

if (!options.hidden) {
  ignores.push(/[\\/]\./);
}

ignores = ignores.filter((_) => _).map((p) => new RegExp(p, 'g'));

const PASS = () => {};
const logger = options.silence
  ? {
    info: PASS,
    error: PASS,
    warn: PASS,
    done: PASS,
    clearConsole: PASS,
  }
  : defaultLogger;

logger.clearConsole();

logger.info(`Pen watching ${chalk.cyan(options.root)}`);
logger.info(`Pen enabled filetypes: ${filetypes.map((t) => chalk.cyan(t)).join(', ')}`);
logger.info(`Pen ignore patterns: ${ignores.map((r) => chalk.cyan(r.source)).join(', ')}`);

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
  filetypes: new RegExp(`\\.(${filetypes.filter((t) => ['md', 'markdown', 'pdf'].indexOf(t) !== -1).join('|')})$`),
  ignores,
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
    logger.warn(`Pen found port ${port} unavaliable, use random port ${avaliablePort} instead`);
  }

  server.listen(avaliablePort, () => {
    const url = `${useHttps ? 'https' : 'http'}://localhost:${avaliablePort}/`;

    logger.done(`Pen listening on ${chalk.bold(chalk.cyan(url))}`);
    options.open && open(url);
  });
}());
