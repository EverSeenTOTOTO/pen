import { createReadStream, existsSync } from 'fs';
import { dirname, resolve } from 'path';
import type { IncomingMessage, ServerResponse } from 'http';
import type { PenLogger } from './watcher';

const AssetsPattern = /\.(?:css(\.map)?|js(\.map)?|jpe?g|png|gif|ico|cur|heic|webp|tiff?|mp3|m4a|aac|ogg|midi?|wav|mp4|mov|webm|mpe?g|avi|ogv|flv|wmv)$/;

export const createPenMiddleware = (root: string, logger ?: PenLogger) => <Req extends IncomingMessage, Res extends ServerResponse>
  (req: Req, res: Res): void => {
  const url = new URL(req.url ?? '/', `http://${req.headers.host}`);

  if (AssetsPattern.test(url.pathname)) {
    const penAsset = resolve(__dirname, `spa${url.pathname}`);
    if (existsSync(penAsset)) { // 去除inline资源后，需优先看是不是pen的资源
      logger?.info(`Pen request asset: ${penAsset}`);
      createReadStream(penAsset).pipe(res);
      return;
    }

    const asset = resolve(dirname(root), `.${url.pathname}`);
    if (existsSync(asset)) {
      logger?.info(`Pen request asset: ${asset}`);
      createReadStream(asset).pipe(res);
      return;
    }

    logger?.error(`Pen not found asset: ${asset}`);
    res.statusCode = 404;
    res.end();
  } else {
    logger && logger.warn('Pen fallback to index.html');
    res.setHeader('Content-Type', 'text/html');
    createReadStream(resolve(__dirname, 'spa/index.html'))
      .pipe(res);
  }
};

// a default middleware
export const middleware = createPenMiddleware('./');
