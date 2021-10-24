import fs from 'fs';
import { IncomingMessage, ServerResponse } from 'http';
import { extname, join } from 'path';
import * as logger from './logger';

const getContentType = (ext: string) => {
  return new Map([
    ['.js', 'application/javascript'],
    ['.css', 'text/css'],
    ['.svg', 'image/svg+xml'],
    ['.jpg', 'image/jpeg'],
    ['.jpeg', 'image/jpeg'],
    ['.png', 'image/png'],
    ['.gif', 'image/gif'],
    ['.ico', 'image/x-icon'],
  ]).get(ext);
};

const serveStatic = (assets: string, options: { root?: string, logger?: typeof logger }) => {
  options.logger?.info(`Pen serving assets: ${assets}`);

  return function middleware(req: IncomingMessage, res: ServerResponse) {
    const url = new URL(req.url ?? '/', `http://${req.headers.host}`);

    if (/\.(?:css(\.map)?|js(\.map)?|jpe?g|png|gif|ico)$/.test(url.pathname)) {
      const asset = join(assets, url.pathname);

      if (fs.existsSync(asset)) {
        const contentType = getContentType(extname(asset));

        if (contentType) {
          res.setHeader('Content-Type', contentType);
        }

        fs.createReadStream(asset).pipe(res);

        return true;
      }
    }

    return false;
  };
};

export default (options: { logger?: typeof logger, root?: string }) => {
  const assets = join(__dirname, '../spa');
  const middlewares = [
    serveStatic(assets, options),
    serveStatic(join(options.root ?? '.'), options),
  ];

  return (req: IncomingMessage, res: ServerResponse) => {
    for (const middleware of middlewares) {
      if (middleware(req, res)) {
        return;
      }
    }

    res.setHeader('Content-Type', 'text/html');
    fs.createReadStream(join(assets, 'index.html'))
      .pipe(res);
  };
};
