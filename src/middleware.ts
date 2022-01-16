import { IncomingMessage, ServerResponse } from 'http';
import fs from 'fs';
import { join, extname, basename } from 'path';
import serveStatic from 'serve-static';
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
  [/\.woff$/, 'application/font-woff'],
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
