import express, { Express, Request, Response } from 'express';
import { path, stripNamespace } from '@/utils';
import { PenOptions } from '@/types';
import { readUnknown, readTemplate } from './reader';

export function loadRender() {
  // eslint-disable-next-line import/no-dynamic-require, @typescript-eslint/no-var-requires, global-require
  const { render } = require(path.join(__dirname, 'index.server.js'));
  return render;
}

// extract for dev and test
export const bindRender = (app: Express, options: PenOptions) => {
  const {
    dist, namespace, theme, logger, root, ignores,
  } = options;
  const template = readTemplate(dist);
  const render = loadRender();
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
