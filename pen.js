#!/usr/bin/env node

/* eslint-disable import/order */
/* eslint-disable @typescript-eslint/no-var-requires */
const { createServer } = require('http');
const { resolve, dirname } = require('path');
const { createReadStream } = require('fs');
const getPort = require('get-port');
const open = require('open');
const { pen } = require('./dist/lib');
const { existsSync } = require('fs');

const argv = require('minimist')(process.argv.slice(2));

const port = argv.port || argv.p || 3000;
const root = argv.root || argv.r || './';
const logger = argv.s ? undefined : console;

const AssetsPattern = /\.(?:css(\.map)?|js(\.map)?|jpe?g|png|gif|ico|cur|heic|webp|tiff?|mp3|m4a|aac|ogg|midi?|wav|mp4|mov|webm|mpe?g|avi|ogv|flv|wmv)$/;

const server = createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  if (AssetsPattern.test(url.pathname)) {
    const asset = resolve(dirname(root), `.${url.pathname}`);
    if (existsSync(asset)) {
      logger && logger.info(`Pen request asset: ${asset}`);
      createReadStream(asset).pipe(res);
    } else {
      logger && logger.error(`Pen not found asset: ${asset}`);
      res.statusCode = 404;
      res.end();
    }
  } else {
    logger && logger.warn('Pen fallback to index.html');
    res.setHeader('Content-Type', 'text/html');
    createReadStream(resolve(__dirname, './dist/spa/index.html'))
      .pipe(res);
  }
});

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
