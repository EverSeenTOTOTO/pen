import path from 'path';
import fs from 'fs';
import express, { Express, Request, Response } from 'express';
import { isMarkdown, stripNamespace } from '../utils';
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
        relative: stripNamespace(namespace, req.originalUrl),
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

      logger.done(`Pen rendered page: ${req.originalUrl}`);

      res.setHeader('Content-Type', 'text/html');
      res.end(html);
    } catch (e) {
      logger.error((e as Error).message);
      next();
    }
  };

  app.get(new RegExp(`${namespace}/*`), (req: Request, res: Response, next: () => void) => {
    serveAssets(req, res, () => (isMarkdown(req.originalUrl)
      ? ssr(req, res, next)
      : serveRoot(req, res, () => ssr(req, res, next))));
  });
};
