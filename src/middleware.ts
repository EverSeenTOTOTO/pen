import { createReadStream, existsSync } from 'fs';
import { resolve } from 'path';
import type { IncomingMessage, ServerResponse } from 'http';
import * as Logger from './logger';

const AssetsPattern = /\.(?:css(\.map)?|js(\.map)?|jpe?g|png|gif|ico|cur|heic|webp|tiff?|mp3|m4a|aac|ogg|midi?|wav|mp4|mov|webm|mpe?g|avi|ogv|flv|wmv)$/;

export default (assets = './', logger: typeof Logger | undefined = undefined) => <Req extends IncomingMessage, Res extends ServerResponse>
  (req: Req, res: Res): void => {
  const url = new URL(req.url ?? '/', `http://${req.headers.host}`);

  logger?.info(`Pen got request: ${url.pathname}`);

  if (AssetsPattern.test(url.pathname)) {
    const asset = resolve(assets, `.${url.pathname}`);
    if (existsSync(asset)) {
      logger?.info(`Pen found asset: ${asset}`);
      createReadStream(asset).pipe(res);
    } else {
      logger?.error(`Pen asset not founded: ${asset}`);
      res.statusCode = 404;
      res.end();
    }
  } else {
    logger?.info('Pen redirect to index.html');
    res.setHeader('Content-Type', 'text/html');
    createReadStream(resolve(__dirname, 'spa/index.html'))
      .pipe(res);
  }
};
