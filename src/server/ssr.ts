import fs from 'fs';
import express, { Express, Request, Response } from 'express';
import { path, stripNamespace } from '@/utils';
import { PenInitData } from '@/types';
import { Logger } from './logger';
import { Watcher } from './watcher';

const SERVER_ENTRY = path.join(__dirname, 'index.server.js');

export type RenderOptions = {
  dark: boolean,
  dist: string,
  namespace: string,
  watchRoot: string,
  watcher: Watcher,
  logger?: Logger,
};

export const bindRender = (app: Express, options: RenderOptions) => {
  const {
    dist, namespace, watcher, logger,
  } = options;
  const index = path.join(dist, 'index.html');
  const theme = path.join(dist, `assets/theme.${options.dark ? 'dark' : 'light'}.css`);

  // eslint-disable-next-line import/no-dynamic-require, @typescript-eslint/no-var-requires, global-require
  const { render } = require(SERVER_ENTRY);
  const template = fs.readFileSync(index, 'utf8');
  const style = `<style>${fs.readFileSync(theme, 'utf8')}</style>`;
  const info: PenInitData = {
    availableThemes: [],
    theme: '',
    dark: false,
    watchRoot: options.watchRoot,
    socketNamespace: options.namespace,
  };

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
        info,
        style,
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
