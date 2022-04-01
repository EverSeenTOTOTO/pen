import express, { Request, Response } from 'express';
import fs from 'fs';
import { basename, extname, join } from 'path';
import * as logger from './logger';

const MimeTypes = new Map([
  [/\.s?html?$/, 'text/html'],
  [/\.css$/, 'text/css'],
  [/\.xml$/, 'text/xml'],
  [/\.gif$/, 'image/gif'],
  [/\.jpe?g$/, 'image/jpeg'],
  [/\.js$/, 'application/javascript'],
  [/\.txt$/, 'text/plain'],
  [/\.png$/, 'image/png'],
  [/\.ico$/, 'image/x-icon'],
  [/\.svgz?$/, 'image/svg+xml'],
  [/\.webp$/, 'image/webp'],
  [/\.ttf$/, 'application/ttf'],
  [/\.woff$/, 'application/font-woff'],
  [/\.woff2$/, 'application/font-woff2'],
  [/\.json$/, 'application/json'],
  [/\.pdf$/, 'application/pdf'],
  [/\.zip$/, 'application/zip'],
  [/\.7z$/, 'application/x-7z-compressed'],
  [/\.(j|w|e)ar$/, 'application/java-archive'],
  [/\.mp3$/, 'audio/mpeg'],
  [/\.ogg$/, 'audio/ogg'],
  [/\.m4a$/, 'audio/x-m4a'],
  [/\.mp4$/, 'video/mp4'],
  [/\.3gpp?$/, 'video/3gpp'],
  [/\.mpe?g$/, 'video/mpeg'],
  [/\.mov$/, 'video/quicktime'],
  [/\.flv$/, 'video/x-flv'],
  [/\.m4v?$/, 'video/x-m4v'],
  [/\.wmv?$/, 'video/x-ms-wmv'],
  [/\.avi?$/, 'video/x-msvideo'],
  [/\.(bin|exe|dll|deb|dmg|iso|img)$/, 'application/octet-stream'],
]);

const getContentType = (ext: string) => {
  for (const [key, value] of MimeTypes) {
    if (key.test(ext)) {
      return value;
    }
  }

  return undefined;
};

export default (options: { logger?: typeof logger, root?: string, namespace?: string }) => {
  const assets = join(__dirname, '../spa');
  const serveAssets = express.static(join(options.root ?? '.'), {
    index: false,
    dotfiles: 'allow',
  });

  return (req: Request, res: Response) => {
    const url = new URL(req.url ?? '/', `http://${req.headers.host}`);
    const fallback = () => {
      const asset = join(assets, basename(url.pathname));

      if (fs.existsSync(asset) && !fs.statSync(asset).isDirectory()) {
        const contentType = getContentType(extname(asset));

        if (contentType) {
          res.setHeader('Content-Type', contentType);
        }

        options.logger?.warn(`Serving ${url.pathname}`);

        fs.createReadStream(asset).pipe(res);
      } else {
        options.logger?.warn(`Not found ${url.pathname} or is markdown request, fallback to html`);
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
