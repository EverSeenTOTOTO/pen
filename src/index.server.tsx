import type { Request, Response } from 'express';
import serializeJavascript from 'serialize-javascript';
import ReactDOMServer from 'react-dom/server';
import { StaticRouter } from 'react-router-dom/server';
import { App } from './App';
import { createStore } from './store';
import { createRoutes } from './routes';
import { PenInitData, PenData, PenTheme } from './types';

// see index.html
const APP_HTML = '<!--app-html-->';
const APP_STATE = '<!--app-state-->';
const APP_STYLE = '<!--app-style-->';

const serialize = (state: Record<string, unknown>) => `<script>;window.__PREFETCHED_STATE__=${serializeJavascript(state)};</script>`;

export type RenderContext = {
  req: Request;
  res: Response;
  data: PenData;
  info: PenInitData;
  theme: PenTheme;
  style?: string;
  template: string;
  html?: string;
};

export async function render(context: RenderContext) {
  const ctx = context as Required<RenderContext>;
  const { req } = ctx;

  const store = createStore();
  const routes = createRoutes();

  // ssr prefetch
  store.hydrate({
    home: { data: ctx.data },
    theme: ctx.theme,
    server: ctx.info,
  });

  const html = ReactDOMServer.renderToString(
    <StaticRouter location={req.originalUrl}>
      <App store={store} routes={routes}/>
    </StaticRouter>,
  );

  const state = store.dehydra();

  ctx.html = ctx.template
    .replace(APP_HTML, html)
    .replace(APP_STYLE, ctx.style ?? '')
    .replace(APP_STATE, serialize(state));

  return ctx;
}
