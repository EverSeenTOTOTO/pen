import type { Request, Response } from 'express';
import serializeJavascript from 'serialize-javascript';
import ReactDOMServer from 'react-dom/server';
import { StaticRouter } from 'react-router-dom/server';
import createEmotionServer from '@emotion/server/create-instance';
import createEmotionCache from './createEmotionCache';
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
  template: string;
  html?: string;
  prefetch: Record<string, unknown>
};

export async function render(context: RenderContext) {
  const ctx = context as Required<RenderContext>;
  const { req, prefetch } = ctx;

  const store = createStore();
  const routes = createRoutes();
  const cache = createEmotionCache();
  const { extractCriticalToChunks, constructStyleTagsFromChunks } = createEmotionServer(cache);

  // ssr prefetch
  store.hydrate(prefetch);

  const html = ReactDOMServer.renderToString(
    <StaticRouter location={req.url}>
      <App store={store} routes={routes} cache={cache} />
    </StaticRouter>,
  );

  // Grab the CSS from emotion
  const emotionChunks = extractCriticalToChunks(html);
  const emotionCss = constructStyleTagsFromChunks(emotionChunks);

  const state = store.dehydra();
  const { theme } = prefetch as { theme: PenTheme };
  const style = `<style id="${theme.id}">${theme.css}</style>${emotionCss}`;

  ctx.html = ctx.template
    .replace(APP_HTML, html)
    .replace(APP_STYLE, style)
    .replace(APP_STATE, serialize(state));

  return ctx;
}
