import finalHandler from 'finalhandler';
import { IncomingMessage, ServerResponse } from 'http';
import path from 'path';
import serveStatic from 'serve-static';

export default (options: { assets?: string, root?: string }) => {
  const PenAssets = path.resolve(__dirname, '../spa');
  const assets = options?.assets ?? options?.root ?? '.';

  const servePenAssets = serveStatic(path.join(PenAssets));
  const serveUserAssets = serveStatic(path.join(assets));

  return function middleware(req: IncomingMessage, res: ServerResponse) {
    servePenAssets(req, res, finalHandler(req, res));
    serveUserAssets(req, res, finalHandler(req, res));
  };
};
