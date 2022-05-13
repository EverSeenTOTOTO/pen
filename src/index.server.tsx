import type { Request, Response } from 'express';
import serializeJavascript from 'serialize-javascript';
import ReactDOMServer from 'react-dom/server';
import { StaticRouter } from 'react-router-dom/server';
import { App } from './App';
import { createStore, AppStore } from './store';
import { createRoutes, AppRoutes } from './routes';
import { PenData } from './types';

// see index.html
const APP_HTML = '<!--app-html-->';
const APP_STATE = '<!--app-state-->';

const serialize = (state: Record<string, unknown>) => `<script>;window.__PREFETCHED_STATE__=${serializeJavascript(state)};</script>`;

export type RenderContext = {
  req: Request;
  res: Response;
  template: string;
  html?: string;
  routes?: AppRoutes;
  store?: AppStore;
  markdownData?: PenData
};

export async function render(context: RenderContext) {
  const ctx = context as Required<RenderContext>;
  const { req } = ctx;

  const store = createStore();
  const routes = createRoutes();

  ctx.store = store;
  ctx.routes = routes;

  // prefetch markdown content for ssr
  store.hydrate({
    home: {
      data: ctx.markdownData,
    },
  });

  const html = ReactDOMServer.renderToString(
    <StaticRouter location={req.originalUrl}>
      <App store={store} routes={routes}/>
    </StaticRouter>,
  );

  const state = store.dehydra();

  ctx.html = ctx.template
    .replace(APP_HTML, html)
    .replace(APP_STATE, serialize(state));

  return ctx;
}
