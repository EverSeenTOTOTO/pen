import type { Request, Response } from 'express';
import serializeJavascript from 'serialize-javascript';
import ReactDOMServer from 'react-dom/server';
import { StaticRouter } from 'react-router-dom/server';
import { ServerStyleSheets } from '@material-ui/core/styles';
import { App } from './App';
import { createStore } from './store';
import { createRoutes } from './routes';
import { PenTheme } from './types';

// see index.html
const APP_HTML = '<!--app-html-->';
const APP_STATE = '<!--app-state-->';
const APP_STYLE = '<!--app-style-->';

const serialize = (state: Record<string, unknown>) => `<script>;window.__PREFETCHED_STATE__=${serializeJavascript(state)};</script>`;

export type RenderContext = {
  req: Request;
  res: Response;
  theme: PenTheme;
  template: string;
  html?: string;
  prefetch: Record<string, unknown>
};

export async function render(context: RenderContext) {
  const ctx = context as Required<RenderContext>;
  const { req, theme } = ctx;

  const store = createStore();
  const routes = createRoutes();

  // ssr prefetch
  store.hydrate(ctx.prefetch);
  const sheets = new ServerStyleSheets();

  const html = ReactDOMServer.renderToString(
    sheets.collect(
    <StaticRouter location={req.url}>
      <App store={store} routes={routes}/>
    </StaticRouter>,
    ),
  );

  const state = store.dehydra();
  const style = `<style id="${theme.id}">${theme.css}</style><style id="MUI${theme.id}">${sheets.toString()}</style>`;

  ctx.html = ctx.template
    .replace(APP_HTML, html)
    .replace(APP_STYLE, style)
    .replace(APP_STATE, serialize(state));

  return ctx;
}
