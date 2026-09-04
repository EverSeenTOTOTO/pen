import path from 'path';
import fs from 'fs';
import express from 'express';
import type { Express, Request, Response } from 'express';
import { perf } from '@/utils';
import type { PenTheme, RenderOptions, ThemeNames } from '../types';
import { createTheme, isThemeName } from './theme';
import { readUnknown } from './reader';

/**
 * Stamp the theme onto the rendered document: `data-theme` on the first
 * `<html>` tag plus the theme-specific static css <link> tags, replacing the
 * `<!--pen-theme-links-->` placeholder in index.html.
 */
export const applyThemeToTemplate = (html: string, theme: PenTheme): string => html
  .replace('<html', `<html data-theme="${theme.name}"`) // first <html> tag only
  .replace('<!--pen-theme-links-->', theme.links);

export const createSSRMiddleware = (options: RenderOptions) => {
  const preloadPromise = Promise.all([
    fs.promises.readFile(path.join(options.dist, 'index.html'), 'utf8'),
    import(path.join(options.dist, 'index.server.mjs')).then((value) => value.render),
  ]);

  return async (req: Request, res: Response, next: () => void) => {
    const url = decodeURIComponent(req.url);

    perf?.mark('parse theme start');

    let themeMode: ThemeNames = 'dark';
    let drawerVisible = false;
    try {
      const themeCookie: unknown = JSON.parse(req.cookies.themeMode);
      if (isThemeName(themeCookie)) themeMode = themeCookie;
      drawerVisible = JSON.parse(req.cookies.drawerVisible) === true;
    } catch (e) {
      options.logger.error(e);
    }

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
      res.end(applyThemeToTemplate(html, themeData));
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
