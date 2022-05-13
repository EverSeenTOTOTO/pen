import fs from 'fs';
import express, { Express, Request, Response } from 'express';
import { path, stripNamespace } from '@/utils';
import { Logger } from './logger';
import { Watcher } from './watcher';

const SERVER_ENTRY = path.join(__dirname, 'index.server.js');

export type RenderOptions = {
  assets: string,
  namespace: string,
  watcher: Watcher,
  logger?: Logger,
};

export const bindRender = (app: Express, options: RenderOptions) => {
  const {
    assets, namespace, watcher, logger,
  } = options;
  const index = path.join(assets, 'index.html');

  // eslint-disable-next-line import/no-dynamic-require, @typescript-eslint/no-var-requires, global-require
  const { render } = require(SERVER_ENTRY);
  const template = fs.readFileSync(index, 'utf8');

  const serveAssets = express.static(assets, {
    index: false,
    dotfiles: 'allow',
  });
  const ssr = async (req: Request, res: Response, next: () => void) => {
    try {
      // change watching target
      await watcher.setupWatching(stripNamespace(namespace, req.originalUrl));

      const { html } = await render({
        req,
        res,
        template,
        markdownData: watcher.current,
      });

      logger?.done(`Pen rendered page: ${req.originalUrl}`);

      res.setHeader('Content-Type', 'text/html');
      res.end(html);
    } catch (e) {
      logger?.error(`Pen ssr error: ${(e as Error).message}`);
      next();
    }
  };

  app.get(new RegExp(`${namespace}/*`), (req: Request, res: Response, next: () => void) => {
    serveAssets(req, res, () => ssr(req, res, next));
  });
};
