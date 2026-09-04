import { hydrateRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import { App } from './App';
import { createRoutes } from './routes';
import { createStore } from './store';

import './assets/base.css';
import './assets/index.css';

const container = document.getElementById('root');
const store = createStore();
const routes = createRoutes();

if (window.__PREFETCHED_STATE__) {
  if (import.meta.env.DEV) {
    console.log('prefetched state', window.__PREFETCHED_STATE__);
  }
  // merge ssr prefetched data
  store.hydrate(window.__PREFETCHED_STATE__);
  delete window.__PREFETCHED_STATE__;
}

hydrateRoot(container!, <BrowserRouter>
  <App store={store} routes={routes} />
</BrowserRouter>);
