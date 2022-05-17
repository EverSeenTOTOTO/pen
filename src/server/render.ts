import path from 'path';
import fs from 'fs';
import express, { Express, Request, Response } from 'express';
import { RenderOptions } from '../types';
import { readUnknown } from './reader';

function loadRender(dist: string) {
  // eslint-disable-next-line import/no-dynamic-require, @typescript-eslint/no-var-requires, global-require
  const { render } = require(path.join(dist, 'index.server.js'));
  return render;
}

function readTemplate(dist: string) {
  const index = path.join(dist, 'index.html');
  return fs.readFileSync(index, 'utf8');
}

// extract for dev and test
export const bindRender = (app: Express, options: RenderOptions) => {
  const {
    root, dist, namespace, theme, logger,
  } = options;
  const template = readTemplate(dist);
  const render = loadRender(dist);
  const serveAssets = express.static(dist, { index: false, dotfiles: 'allow' });
  const serveRoot = express.static(root, { index: false, dotfiles: 'allow' });
  const ssr = async (req: Request, res: Response, next: () => void) => {
    try {
      const current = await readUnknown({
        ...options,
        relative: decodeURIComponent(req.url),
      });

      const { html } = await render({
        req,
        res,
        theme,
        template,
        prefetch: {
          socket: options,
          theme,
          home: { data: current },
        },
      });

      logger.done(`Pen rendered page: ${req.url}`);

      res.setHeader('Content-Type', 'text/html');
      res.end(html);
    } catch (e) {
      logger.error((e as Error).message);
      next();
    }
  };

  const router = express.Router();

  router.use(ssr);
  router.use(serveRoot);

  app.use(serveAssets);
  app.use(namespace, router);
};
