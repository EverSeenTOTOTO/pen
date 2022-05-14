import fs from 'fs';
import express, { Express, Request, Response } from 'express';
import { path, stripNamespace } from '@/utils';
import { PenSocketInfo, PenTheme } from '@/types';
import { Logger } from './logger';
import { readUnknown } from './reader';

export type RenderOptions = PenSocketInfo & {
  root: string,
  namespace: string,
  dist: string,
  theme: PenTheme,
  ignores: RegExp[]
  logger?: Logger,
};

// extract for dev and test
export const bindRender = (app: Express, options: RenderOptions) => {
  const {
    dist, namespace, theme, logger, root, ignores,
  } = options;
  const index = path.join(dist, 'index.html');
  const entry = path.join(__dirname, 'index.server.js');

  // eslint-disable-next-line import/no-dynamic-require, @typescript-eslint/no-var-requires, global-require
  const { render } = require(entry);
  const template = fs.readFileSync(index, 'utf8');
  const style = `<style id="${theme.id}">${theme.css}</style>`;

  const serve = express.static(dist, { index: false, dotfiles: 'allow' });
  const ssr = async (req: Request, res: Response, next: () => void) => {
    try {
      const current = await readUnknown(
        stripNamespace(namespace, req.originalUrl),
        root,
        ignores,
      );

      const { html } = await render({
        req,
        res,
        style,
        theme,
        template,
        prefetch: {
          socket: options,
          theme,
          home: { data: current },
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
    serve(req, res, () => ssr(req, res, next));
  });
};
