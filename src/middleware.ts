import { createReadStream, existsSync } from 'fs';
import { resolve } from 'path';
import type { IncomingMessage, ServerResponse } from 'http';
import * as Logger from './logger';

const AssetsPattern = /\.(?:css(\.map)?|js(\.map)?|jpe?g|png|gif|ico|cur|heic|webp|tiff?|mp3|m4a|aac|ogg|midi?|wav|mp4|mov|webm|mpe?g|avi|ogv|flv|wmv)$/;

export const createPenMiddleware = (root: string, logger ?: typeof Logger) => <Req extends IncomingMessage, Res extends ServerResponse>
  (req: Req, res: Res): void => {
  const url = new URL(req.url ?? '/', `http://${req.headers.host}`);

  if (AssetsPattern.test(url.pathname)) {
    const asset = resolve(root, `.${url.pathname}`);
    logger?.info(`Pen got asset request: ${asset}`);
    if (existsSync(asset)) {
      createReadStream(asset).pipe(res);
    } else {
      logger?.error(`Pen found no asset: ${asset}`);
      res.statusCode = 404;
      res.end();
    }
  } else {
    logger && logger.info('Pen redirect to index.html');
    res.setHeader('Content-Type', 'text/html');
    createReadStream(resolve(__dirname, 'spa/index.html'))
      .pipe(res);
  }
};

// a default middleware
export const middleware = createPenMiddleware('./');
