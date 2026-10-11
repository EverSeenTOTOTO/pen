import path from 'path';
import fs from 'fs';
import express from 'express';
import chalk from 'chalk';
import type { Express, Request, Response } from 'express';
import { perf } from '@/utils';
import type { RenderOptions, ThemeNames } from '../types';
import { createTheme, isThemeName } from './theme';
import { readUnknown } from './reader';
import { scope, paint } from './logger';

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
    // sidebar open by default; only an explicit `false` cookie closes it
    const drawerVisible = parseCookieJson(req.cookies.drawerVisible) !== false;

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
  // content-hashed build output (assets/): url changes with content, so a
  // full year of immutable caching is safe. maxAge is in MILLISECONDS —
  // the old value of 31536000 silently meant ~9 hours.
  const serveAssets = express.static(path.join(dist, 'assets'), {
    index: false,
    dotfiles: 'allow',
    immutable: true,
    maxAge: 365 * 24 * 60 * 60 * 1000,
  });
  // version-stable vendor copies (vendor/: theme css, katex, fonts) keep
  // their urls across releases — revalidate via etag instead of caching
  const serveVendor = express.static(path.join(dist, 'vendor'), {
    index: false,
    dotfiles: 'allow',
  });
  // dist root leftovers (favicon) — default revalidation
  const serveDist = express.static(dist, {
    index: false,
    dotfiles: 'allow',
  });

  const router = express.Router();

  // request line: `GET /notebook/day1.md 200 9ms`, colored by status class.
  // Successful static-asset responses stay quiet — pages and failures are
  // the interesting part
  router.use((req, res, next) => {
    const start = performance.now();
    res.on('finish', () => {
      const isDoc = !path.extname(req.path) || /\.(md|markdown)$/i.test(req.path);
      if (!isDoc && res.statusCode < 400) return;

      const ms = performance.now() - start;
      const line = [
        chalk.white(req.method),
        req.originalUrl,
        paint.status(res.statusCode)(String(res.statusCode)),
        paint.slow(ms)(`${ms.toFixed(1)}ms`),
      ].join(' ');
      const level = res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'log';
      options.logger[level](`${scope('request')}${line}`);
    });
    next();
  });

  router.use(ssr);
  router.use(serveRoot);

  // specific subtrees first — the root-level dist mount is the fallback
  app.use('/assets', serveAssets);
  app.use('/vendor', serveVendor);
  app.use(serveDist);
  app.use(namespace, router);
  app.use(serveRoot);
};
