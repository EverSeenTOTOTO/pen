import fs from 'fs';
import express, { Express, Request, Response } from 'express';
import { path, stripNamespace } from '@/utils';
import { PenInitData, PenTheme } from '@/types';
import { Logger } from './logger';
import { Watcher } from './watcher';

export type RenderOptions = PenInitData & {
  dist: string,
  watcher: Watcher,
  theme: PenTheme,
  logger?: Logger,
};

export const bindRender = (app: Express, options: RenderOptions) => {
  const {
    dist, namespace, watcher, logger,
  } = options;
  const index = path.join(dist, 'index.html');
  const theme = path.join(dist, `assets/theme.${options.theme.name}.css`);
  const entry = path.join(__dirname, 'index.server.js');

  // eslint-disable-next-line import/no-dynamic-require, @typescript-eslint/no-var-requires, global-require
  const { render } = require(entry);
  const template = fs.readFileSync(index, 'utf8');
  const style = `<style>${fs.readFileSync(theme, 'utf8')}</style>`;

  const serveAssets = express.static(dist, {
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
        style,
        template,
        theme: options.theme,
        data: watcher.current,
        info: {
          root: options.root,
          namespace: options.namespace,
        },
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
