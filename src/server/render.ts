import path from 'path';
import fs from 'fs';
import express, { Express, Request, Response } from 'express';
import { RenderOptions } from '../types';
import { readUnknown } from './reader';
import { createTheme } from './theme';

function loadRender(dist: string) {
  // eslint-disable-next-line import/no-dynamic-require, @typescript-eslint/no-var-requires, global-require
  const { render } = require(path.join(dist, 'index.server.js'));
  return render;
}

function readTemplate(dist: string) {
  const index = path.join(dist, 'index.html');
  return fs.readFileSync(index, 'utf8');
}

export const createSSRMiddleware = (options: RenderOptions) => {
  const {
    dist, logger,
  } = options;
  const template = readTemplate(dist);
  const render = loadRender(dist);

  return async (req: Request, res: Response, next: () => void) => {
    try {
      const theme = typeof options.theme === 'function' ? options.theme() : options.theme;
      const [data, themeData] = await Promise.all([
        readUnknown({
          ...options,
          relative: decodeURIComponent(req.url),
        }),
        createTheme(theme, dist),
      ]);

      const { html } = await render({
        req,
        res,
        template,
        prefetch: {
          socket: options,
          theme: themeData,
          home: { data },
        },
      });

      logger.done(`Pen rendered page: ${req.url}`);

      res.setHeader('Content-Type', 'text/html');
      res.end(html);
    } catch (e) {
      next();
    }
  };
};

// extract for dev and test
export const bindRender = (app: Express, options: RenderOptions) => {
  const { root, dist, namespace } = options;

  const ssr = createSSRMiddleware(options);
  const serveRoot = express.static(root, { index: false, dotfiles: 'allow' });
  const serveAssets = express.static(dist, {
    index: false,
    immutable: true,
    maxAge: 31536000,
    dotfiles: 'allow',
  });

  const router = express.Router();

  router.use(ssr);
  router.use(serveRoot);

  app.use(serveAssets);
  app.use(namespace, router);
  app.use(serveRoot); // fallback
};
