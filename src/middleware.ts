import { IncomingMessage, ServerResponse } from 'http';
import fs from 'fs';
import { join, extname, basename } from 'path';
import serveStatic from 'serve-static';
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

export default (options: { logger?: typeof logger, root?: string }) => {
  const assets = join(__dirname, '../spa');
  const serveAssets = serveStatic(join(options.root ?? '.'), {
    index: false,
    dotfiles: 'allow',
  });

  return (req: IncomingMessage, res: ServerResponse) => {
    const url = new URL(req.url ?? '/', `http://${req.headers.host}`);
    const fallback = () => {
      const asset = join(assets, basename(url.pathname));

      if (fs.existsSync(asset) && !fs.statSync(asset).isDirectory()) {
        const contentType = getContentType(extname(asset));

        if (contentType) {
          res.setHeader('Content-Type', contentType);
        }

        fs.createReadStream(asset).pipe(res);
      } else {
        res.setHeader('Content-Type', 'text/html');
        fs.createReadStream(join(assets, 'index.html'))
          .pipe(res);
      }
    };

    if (/\.(md|markdown)$/i.test(url.pathname)) {
      fallback();
    } else {
      serveAssets(req, res, fallback);
    }
  };
};
