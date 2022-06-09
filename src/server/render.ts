import path from 'path';
import fs from 'fs';
import express, { Express, Request, Response } from 'express';
import { RenderOptions } from '../types';
import { createTheme } from './theme';
import { readUnknown } from './reader';

function loadRenderAsync(dist: string) {
  return import(path.join(dist, 'index.server.js')).then((value) => value.render);
}

function readTemplateAsync(dist: string) {
  const index = path.join(dist, 'index.html');
  return fs.promises.readFile(index, 'utf8');
}

export const createSSRMiddleware = (options: RenderOptions) => {
  const { dist } = options;
  const tp = readTemplateAsync(dist);
  const rp = loadRenderAsync(dist);

  return async (req: Request, res: Response, next: () => void) => {
    const url = decodeURIComponent(req.url);

    try {
      const [template, render] = await Promise.all([tp, rp]);
      const theme = typeof options.theme === 'function' ? options.theme() : options.theme;

      const [data, themeData] = await Promise.all([
        readUnknown({ ...options, relative: url }),
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

      res.setHeader('Content-Type', 'text/html');
      res.end(html);
    } catch (e) {
      // console.error(e.stack ?? e.message);
      next();
    }
  };
};

// extract for dev and test
export const bindRender = (app: Express, options: RenderOptions) => {
  const { root, dist, namespace } = options;

  const ssr = createSSRMiddleware(options);
  const serveRoot = express.static(root, {
    index: false,
    dotfiles: 'allow',
  });
  const serveDist = express.static(dist, {
    index: false,
    dotfiles: 'allow',
    immutable: true,
    maxAge: 31536000,
  });

  const router = express.Router();

  router.use(ssr);
  router.use(serveRoot);

  app.use(serveDist);
  app.use(namespace, router);
  app.use(serveRoot);
};
