import path from 'path';
import fs from 'fs';
import express from 'express';
import type { Express, Request, Response } from 'express';
import { perf } from '@/utils';
import type { RenderOptions, ThemeNames } from '../types';
import { createTheme, isThemeName } from './theme';
import { readUnknown } from './reader';

export const createSSRMiddleware = (options: RenderOptions) => {
  const preloadPromise = Promise.all([
    fs.promises.readFile(path.join(options.dist, 'index.html'), 'utf8'),
    import(path.join(options.dist, 'index.server.mjs')).then((value) => value.render),
  ]);

  return async (req: Request, res: Response, next: () => void) => {
    const url = decodeURIComponent(req.url);

    perf?.mark('parse theme start');

    // parse each cookie independently: a missing/malformed theme cookie must
    // not abort the drawer cookie (and vice versa)
    const parseCookieJson = (raw: string | undefined): unknown => {
      if (raw === undefined) return undefined;
      try {
        return JSON.parse(raw);
      } catch (e) {
        options.logger.error(e);
        return undefined;
      }
    };

    const themeCookie: unknown = parseCookieJson(req.cookies.themeMode);
    const themeMode: ThemeNames = isThemeName(themeCookie) ? themeCookie : 'dark';
    const drawerVisible = parseCookieJson(req.cookies.drawerVisible) === true;

    perf?.measure('parse theme end', 'parse theme start');
    perf?.mark('read data start');

    try {
      const [template, render] = await preloadPromise;
      const [data, themeData] = await Promise.all([
        readUnknown({ ...options, relative: url }),
        createTheme(themeMode, options.dist),
      ]);

      perf?.measure('read data end', 'read data start');
      perf?.mark('render start');

      const { html } = await render({
        req,
        res,
        template,
        prefetch: {
          socket: options,
          theme: themeData,
          home: { data },
          drawer: { visible: drawerVisible },
        },
      });

      perf?.measure('render end', 'render start');

      res.setHeader('Content-Type', 'text/html');
      res.end(html);
    } catch {
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
