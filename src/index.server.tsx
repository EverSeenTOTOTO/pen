import type { Request, Response } from 'express';
import serializeJavascript from 'serialize-javascript';
import ReactDOMServer from 'react-dom/server.node';
import { StaticRouter } from 'react-router';
import { enableStaticRendering } from 'mobx-react-lite';
import type { PenTheme } from './types';
import { App } from './App';
import { createStore } from './store';
import { createRoutes } from './routes';

// Call enableStaticRendering(true) when running in an SSR environment, in which observer wrapped components should never re-render, but cleanup after the first rendering automatically.
enableStaticRendering(true);

// see index.html
const APP_HTML = '<!--app-html-->';
const APP_STATE = '<!--app-state-->';

const serialize = (state: Record<string, unknown>) => `<script>;window.__PREFETCHED_STATE__=${serializeJavascript(state)};</script>`;

/**
 * Stamp the theme onto the rendered document: `data-theme` on the first
 * `<html>` tag plus the theme-specific static css <link> tags, replacing the
 * `<!--pen-theme-links-->` placeholder in index.html.
 */
export const applyThemeToTemplate = (html: string, theme: PenTheme): string => html
  .replace('<html', `<html data-theme="${theme.name}"`) // first <html> tag only
  .replace('<!--pen-theme-links-->', theme.links);

export type RenderContext = {
  req: Request;
  res: Response;
  template: string;
  html?: string;
  prefetch: Record<string, unknown>
};

export async function render(context: RenderContext) {
  const ctx = context as Required<RenderContext>;
  const { req, prefetch } = ctx;
  const { theme } = prefetch as { theme?: PenTheme };

  const store = createStore();
  const routes = createRoutes();

  // ssr prefetch
  store.hydrate(prefetch);

  const html = ReactDOMServer.renderToString(
    <StaticRouter location={req.originalUrl ?? req.url}>
      <App store={store} routes={routes} />
    </StaticRouter>,
  );

  const state = store.dehydra();

  ctx.html = ctx.template
    .replace(APP_HTML, html)
    .replace(APP_STATE, serialize(state));

  // theme css <link> tags and data-theme are part of the rendered document
  if (theme) ctx.html = applyThemeToTemplate(ctx.html, theme);

  return ctx;
}
